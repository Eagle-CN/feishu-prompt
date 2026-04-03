import { NextRequest, NextResponse } from 'next/server';

const FEISHU_APP_ID     = process.env.FEISHU_APP_ID!;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET!;
const BITABLE_APP_TOKEN = process.env.FEISHU_BITABLE_APP_TOKEN!;
const BITABLE_TABLE_ID  = process.env.FEISHU_BITABLE_TABLE_ID!;

// ─── token 缓存 ───────────────────────────────────────────────────────────────
let cachedToken: { token: string; expireAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expireAt - 60_000) return cachedToken.token;
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`飞书鉴权失败: ${data.msg}`);
  cachedToken = { token: data.tenant_access_token, expireAt: Date.now() + data.expire * 1000 };
  return cachedToken.token;
}

// ─── view 列表缓存（10分钟）──────────────────────────────────────────────────
let cachedViews: { views: { id: string; name: string }[]; expireAt: number } | null = null;

async function getViews(token: string): Promise<{ id: string; name: string }[]> {
  if (cachedViews && Date.now() < cachedViews.expireAt) return cachedViews.views;
  const res = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_APP_TOKEN}/tables/${BITABLE_TABLE_ID}/views`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (data.code !== 0) throw new Error(`获取视图失败: ${data.msg}`);
  const views = (data.data?.items || [])
    .filter((v: any) => v.view_type === 'grid')
    .map((v: any) => ({ id: v.view_id, name: v.view_name }));
  cachedViews = { views, expireAt: Date.now() + 10 * 60_000 };
  return views;
}

// ─── 字段提取工具 ─────────────────────────────────────────────────────────────

function extractText(field: any): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) return field.map((f: any) => f.text || '').join('');
  return '';
}

/**
 * 提取图片 URL（仅支持 URL 字段，不处理附件）
 * 飞书 URL 字段格式：{ link: "https://...", text: "..." }
 * 或多行文本格式：[{ text: "https://...", type: "url" }]
 */
function extractImageUrl(field: any): string {
  if (!field) return '';
  // URL 字段：{ link, text }
  if (typeof field === 'object' && !Array.isArray(field) && field.link) return field.link;
  // 纯字符串
  if (typeof field === 'string' && field.startsWith('http')) return field;
  // 多行文本数组
  if (Array.isArray(field)) {
    for (const item of field) {
      if (item.link) return item.link;
      if (item.text?.startsWith('http')) return item.text;
    }
  }
  return '';
}

// ─── 查询指定 view 的记录 ─────────────────────────────────────────────────────
async function fetchViewRecords(
  token: string,
  viewId: string,
  viewName: string,
  pageSize: number,
  pageToken: string
): Promise<{ items: any[]; has_more: boolean; page_token: string }> {
  const params = new URLSearchParams({ page_size: String(pageSize), view_id: viewId });
  if (pageToken) params.set('page_token', pageToken);

  const res = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_APP_TOKEN}/tables/${BITABLE_TABLE_ID}/records?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (data.code !== 0) {
    console.error(`[inspiration] view ${viewName} 查询失败:`, data.msg);
    return { items: [], has_more: false, page_token: '' };
  }

  const rawItems = data.data?.items || [];

  const items = rawItems
    .map((item: any) => {
      const f = item.fields || {};

      // 图片：取 oss_url 字段（OSS 直链）
      const image = extractImageUrl(f['oss_url']);
      if (!image) return null;

      return {
        id:       item.record_id,
        image,
        prompt:   extractText(f['prompt']),
        title:    extractText(f['title']),
        category: viewName,
        model:    extractText(f['model']),
        tags:     Array.isArray(f['tags'])
                    ? f['tags'].map((t: any) => t.text || t).filter(Boolean)
                    : [],
      };
    })
    .filter(Boolean);

  return {
    items,
    has_more:   data.data?.has_more || false,
    page_token: data.data?.page_token || '',
  };
}

// ─── GET /api/inspiration ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category     = searchParams.get('category') || '';
    const keyword      = searchParams.get('keyword')  || '';
    const pageSize     = Math.min(50, parseInt(searchParams.get('page_size') || '30'));
    const rawPageToken = searchParams.get('page_token') || '';

    const token = await getAccessToken();
    const views = await getViews(token);

    const targetViews = category && category !== '全部'
      ? views.filter(v => v.name === category)
      : views;

    if (!targetViews.length) {
      return NextResponse.json({ success: true, data: [], has_more: false, page_token: '', categories: views.map(v => v.name) });
    }

    // 解析分页 token（格式：viewId:token|viewId:token）
    const tokenMap: Record<string, string> = {};
    if (rawPageToken) {
      rawPageToken.split('|').forEach(part => {
        const idx = part.indexOf(':');
        if (idx > 0) tokenMap[part.slice(0, idx)] = part.slice(idx + 1);
      });
    }

    // 并发查询所有目标 view
    const results = await Promise.all(
      targetViews.map(v => fetchViewRecords(token, v.id, v.name, pageSize, tokenMap[v.id] || ''))
    );

    let allItems: any[] = [];
    results.forEach(r => allItems.push(...r.items));

    if (keyword) {
      allItems = allItems.filter(item =>
        item.prompt?.includes(keyword) || item.title?.includes(keyword)
      );
    }

    const hasMore = results.some(r => r.has_more);
    const nextTokenParts = results
      .map((r, i) => r.has_more ? `${targetViews[i].id}:${r.page_token}` : null)
      .filter(Boolean);

    return NextResponse.json({
      success:    true,
      data:       allItems,
      has_more:   hasMore,
      page_token: nextTokenParts.join('|'),
      categories: views.map(v => v.name),
    });
  } catch (e: any) {
    console.error('[inspiration]', e);
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
