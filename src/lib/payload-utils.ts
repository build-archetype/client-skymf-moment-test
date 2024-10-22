import { User } from "../payload-types";
import { RequestCookies } from "next/dist/server/web/spec-extension/cookies";

export const getServerSideUser = async (cookies: RequestCookies) => {
  const token = cookies.get("payload-token")?.value;

  const meRes = await fetch(`/api/users/me`, {
    headers: {
      Authorization: `JWT ${token}`,
    },
  });

  const { user } = await meRes.json();

  return { user };
};
