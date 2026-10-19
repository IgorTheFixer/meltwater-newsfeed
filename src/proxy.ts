import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");

    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const separatorIndex = decoded.indexOf(":");

      const username = decoded.slice(0, separatorIndex);
      const password = decoded.slice(separatorIndex + 1);

      const validUsername = process.env.ADMIN_USERNAME;
      const validPassword = process.env.ADMIN_PASSWORD;

      if (
        username === validUsername &&
        password === validPassword
      ) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="News Feed Manager"',
    },
  });
}

export const config = {
  matcher: [
    "/admin/news/:path*",
    "/api/news/import",
    "/api/news/publish",
  ],
};