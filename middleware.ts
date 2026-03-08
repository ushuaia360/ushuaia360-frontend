import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;
  
  // Proteger todas las rutas admin
  const adminRoutes = ["/senderos", "/usuarios", "/comentarios"];
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route)) || 
                       (pathname === "/" && !pathname.startsWith("/login"));
  
  if (isAdminRoute) {
    if (!token) {
      // Redirigir al login si no hay token
      const loginUrl = new URL("/login", request.url);
      // Agregar la URL de destino como query param para redirigir después del login
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Si ya está logueado y va al login, redirigir al admin
  if (pathname === "/login" && token) {
    const redirectTo = request.nextUrl.searchParams.get("redirect") || "/senderos";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/senderos/:path*", 
    "/usuarios/:path*", 
    "/comentarios/:path*", 
    "/login",
    "/"
  ],
};
