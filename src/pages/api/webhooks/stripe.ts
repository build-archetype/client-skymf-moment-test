import { buffer } from "micro";
import { NextApiRequest, NextApiResponse } from "next";
import { stripeWebhookHandler } from "@/webhooks";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"] as string;

    try {
      await stripeWebhookHandler(buf, sig);
      res.status(200).send("Webhook processed successfully");
    } catch (err) {
      res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
