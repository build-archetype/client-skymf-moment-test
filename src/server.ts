import dotenv from "dotenv";
import path from "path";
import { setupMongoDB } from "./config/mongoSetup";
import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";

// Load environment variables
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

import express from "express";
import bodyParser from "body-parser";
import { getPayloadClient } from "./get-payload";
import { nextApp, nextHandler } from "./next-utils";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./trpc";
import { PayloadRequest } from "payload/types";
import stripeWebhookHandler from "./webhooks";

// ... existing code ...

export const createContext = async ({
  req,
  res,
}: CreateExpressContextOptions) => {
  return { req, res, user: req.user };
};

export type Context = inferAsyncReturnType<typeof createContext>;

// Remove the start function and create an async function to initialize the app
const initializeApp = async () => {
  // Setup MongoDB (either in-memory or real)
  await setupMongoDB();

  const app = express();

  // Add this middleware to parse the raw body for the webhook route
  app.use("/api/webhooks/stripe", bodyParser.raw({ type: "application/json" }));

  app.post("/api/webhooks/stripe", (req, res) => {
    // @ts-ignore
    req.rawBody = req.body;
    return stripeWebhookHandler(req, res);
  });

  const payload = await getPayloadClient();

  const cartRouter = express.Router();

  cartRouter.use(payload.authenticate);

  cartRouter.get("/", (req, res) => {
    const request = req as PayloadRequest;

    if (!request.user) return res.redirect("/sign-in?origin=cart");

    const parsedUrl = parse(req.url, true);
    const { query } = parsedUrl;

    return nextApp.render(req, res, "/cart", query);
  });

  app.use("/cart", cartRouter);
  app.use(
    "/api/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  app.use((req, res) => nextHandler(req, res));

  return app;
};

// Export a handler function for Vercel
export default async (req: any, res: any) => {
  const app = await initializeApp();
  app(req, res);
};

// If running locally, start the server
if (process.env.NODE_ENV !== "production") {
  const PORT = Number(process.env.PORT) || 3000;
  initializeApp().then((app) => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}
