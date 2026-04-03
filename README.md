# ✨ 飞书灵感库

基于飞书多维表格驱动的 AI 提示词灵感库，瀑布流展示，支持分类筛选和关键词搜索。

## 功能特性

- 瀑布流图片展示，自适应多列布局
- 按飞书视图（Grid 页签）自动生成分类标签
- 关键词搜索（匹配标题和提示词）
- 点击图片查看详情，一键复制提示词
- 分页加载，支持"加载更多"
- 飞书 Access Token 自动缓存刷新

## 快速开始

```bash
npm install
npm run dev
```

访问 http://localhost:3002

## 环境变量配置

复制 `.env.local` 并填入你的飞书应用信息：

```env
# 飞书开放平台应用凭证
FEISHU_APP_ID=你的飞书应用ID
FEISHU_APP_SECRET=你的飞书应用密钥

# 多维表格配置
FEISHU_BITABLE_APP_TOKEN=多维表格Token
FEISHU_BITABLE_TABLE_ID=表格ID

# 访问密码（留空则不启用密码保护）
SITE_PASSWORD=
```

> 可以直接复制 `.env.example` 为 `.env.local` 再填写。

### 如何获取这些值

| 变量 | 获取方式 |
|------|---------|
| `FEISHU_APP_ID` / `FEISHU_APP_SECRET` | 飞书开放平台 → 我的应用 → 应用凭证 |
| `FEISHU_BITABLE_APP_TOKEN` | 多维表格链接中 `/base/` 后面的部分 |
| `FEISHU_BITABLE_TABLE_ID` | 多维表格链接中 `table=` 后面的部分 |
| `SITE_PASSWORD` | 自定义访问密码，留空则不启用密码保护 |

示例链接：`https://xxx.feishu.cn/base/xxxxxxxxxxxxxxxxxxxxxx?table=tblxxxxxxxxxxxxxxxxxx`
- APP_TOKEN = `xxxxxxxxxxxxxxxxxxxxxx`（`/base/` 后面的部分）
- TABLE_ID = `tblxxxxxxxxxxxxxxxxxx`（`table=` 后面的部分）

## 飞书多维表格结构

每个 **Grid 视图（页签）** 对应一个分类，页签名称即为分类名。

每条记录需包含以下字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `oss_url` | URL / 文本 | 图片直链（必填，无此字段的记录会被过滤） |
| `prompt` | 文本 | AI 提示词，支持复制 |
| `title` | 文本 | 作品标题 |
| `model` | 文本 | 使用的 AI 模型 |
| `tags` | 多选 | 标签 |

> `oss_url` 字段需填写可公开访问的图片 URL，飞书附件字段暂不支持。

## 飞书应用权限

在飞书开放平台为应用开通以下权限：

- `bitable:app:readonly` — 读取多维表格

## API 说明

`GET /api/inspiration`

| 参数 | 类型 | 说明 |
|------|------|------|
| `category` | string | 分类名（对应视图名），不传或传 `全部` 则查询所有视图 |
| `keyword` | string | 关键词，匹配 `title` 和 `prompt` 字段 |
| `page_size` | number | 每页数量，最大 50，默认 30 |
| `page_token` | string | 分页游标，由上一次响应返回 |

响应示例：

```json
{
  "success": true,
  "data": [
    {
      "id": "recXXX",
      "image": "https://...",
      "prompt": "a beautiful sunset...",
      "title": "日落",
      "category": "风景",
      "model": "Midjourney",
      "tags": ["自然", "光影"]
    }
  ],
  "has_more": true,
  "page_token": "viewId:token",
  "categories": ["风景", "人物", "建筑"]
}
```

## 部署

### 国内 — 腾讯 EdgeOne（需要已备案域名）

适合国内用户访问，速度更快。

1. 登录 [腾讯云 EdgeOne](https://console.cloud.tencent.com/edgeone) → Pages → 新建项目
2. 关联 GitHub 仓库，框架选 **Next.js**
3. 在「环境变量」中添加四个变量（同下）
4. 绑定已备案的自定义域名

### 国外 — Vercel（无需域名）

适合没有备案域名的情况，部署最简单。

1. 访问 [vercel.com](https://vercel.com)，导入 GitHub 仓库
2. 框架自动识别为 Next.js
3. 在「Environment Variables」中添加以下四个变量：

| 变量名 | 说明 |
|--------|------|
| `FEISHU_APP_ID` | 飞书应用 ID |
| `FEISHU_APP_SECRET` | 飞书应用密钥 |
| `FEISHU_BITABLE_APP_TOKEN` | 多维表格 Token |
| `FEISHU_BITABLE_TABLE_ID` | 表格 ID |
| `SITE_PASSWORD` | 访问密码（可选） |

4. 点击 Deploy，完成后 Vercel 会分配一个 `*.vercel.app` 域名直接可用

### 本地 / 自托管

```bash
npm run build
npm start
```

## 技术栈

- [Next.js 14](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- [飞书开放平台 API](https://open.feishu.cn/document/home/index)
