import { buffer } from "micro";
import { NextApiRequest, NextApiResponse } from "next";
import stripeWebhookHandler from "@/webhooks";

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
    await stripeWebhookHandler(req, res);
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
