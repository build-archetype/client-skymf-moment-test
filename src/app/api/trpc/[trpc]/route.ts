import { appRouter } from "@/trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

export async function GET() {
  return new Response("Hello from tRPC endpoint");
}

export { GET as POST };
