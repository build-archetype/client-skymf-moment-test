import { User } from "../payload-types";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    // Browser should use relative path
    return "";
  }

  if (process.env.VERCEL_URL) {
    // Reference for Vercel.com
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.RENDER_INTERNAL_HOSTNAME) {
    // Reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  }

  // Assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export async function getServerSideUser(cookies: ReadonlyRequestCookies) {
  const token = cookies.get("payload-token")?.value;

  const baseUrl = getBaseUrl();
  const meRes = await fetch(`${baseUrl}/api/users/me`, {
    headers: {
      Authorization: `JWT ${token}`,
    },
  });

  const { user } = await meRes.json();

  return { user };
}
