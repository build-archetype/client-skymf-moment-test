import { NextRequest, NextResponse } from "next/server";
import { getServerSideUser } from "./lib/payload-utils";
import { cookies } from "next/headers";

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const nextCookies = cookies();

  const { user } = await getServerSideUser(nextCookies);

  if (user && ["/sign-in", "/sign-up"].includes(nextUrl.pathname)) {
    return NextResponse.redirect(`${nextUrl.origin}/`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/sign-in",
    "/sign-up",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
