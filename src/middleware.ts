import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "sthira_session";

/**
 * Быстрая проверка наличия сессии для закрытых разделов.
 * Настоящая проверка прав (включая роль администратора) выполняется на сервере
 * в layout и в API — cookie не является доказательством авторизации.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
