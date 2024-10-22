import { User } from "../payload-types";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export async function getServerSideUser(cookies: ReadonlyRequestCookies) {
  const token = cookies.get("payload-token")?.value;

  const meRes = await fetch(`/api/users/me`, {
    headers: {
      Authorization: `JWT ${token}`,
    },
  });

  const { user } = await meRes.json();

  return { user };
}
