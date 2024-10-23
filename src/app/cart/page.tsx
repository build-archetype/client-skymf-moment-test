import { getServerSideUser } from "@/lib/payload-utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CartPageClient from "./CartPageClient";

export default async function CartPage() {
  const nextCookies = cookies();
  const { user } = await getServerSideUser(nextCookies);

  if (!user) {
    return redirect("/sign-in?origin=cart");
  }

  return <CartPageClient />;
}
