import { NextRequest, NextResponse } from 'next/server';

const SITE_PASSWORD = process.env.SITE_PASSWORD || '';

export async function POST(request: NextRequest) {
  // 未设置密码，直接放行
  if (!SITE_PASSWORD) {
    return NextResponse.json({ success: true });
  }

  const { password } = await request.json();
  if (password !== SITE_PASSWORD) {
    return NextResponse.json({ success: false, message: '密码错误' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  // 写入 cookie，有效期 7 天
  res.cookies.set('auth', 'ok', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return res;
}

export async function GET() {
  // 未设置密码，直接放行
  if (!SITE_PASSWORD) {
    return NextResponse.json({ authed: true });
  }
  return NextResponse.json({ authed: false });
}
