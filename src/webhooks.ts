import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "./lib/stripe";
import type Stripe from "stripe";
import { getPayloadClient } from "./get-payload";
import { Product } from "./payload-types";
import { Resend } from "resend";
import { ReceiptEmailHtml } from "./components/emails/ReceiptEmail";
import { Request, Response } from "express";

// Mock email service that mimics Resend's structure
const mockEmailService = {
  emails: {
    send: async ({ from, to, subject, html }: any) => {
      console.log(`Mock email sent from ${from} to ${to[0]}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${html}`);
      return { id: "mock-email-id" };
    },
  },
};

// Function to create email service
const createEmailService = () => {
  if (process.env.MOCK_EMAIL === "true") {
    return mockEmailService;
  } else {
    return new Resend(process.env.RESEND_API_KEY);
  }
};

const emailService = createEmailService();

export const config = {
  api: {
    bodyParser: false,
  },
};

type CompatibleRequest = NextApiRequest | Request;
type CompatibleResponse = NextApiResponse | Response;

const stripeWebhookHandler = async (
  req: CompatibleRequest,
  res: CompatibleResponse
) => {
  if (req.method === "POST") {
    let rawBody: Buffer;

    if ("rawBody" in req) {
      // Express request
      rawBody = req.rawBody;
    } else {
      // Next.js API route
      rawBody = await buffer(req);
    }

    const sig = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown Error";
      console.log(`Webhook Error: ${errorMessage}`);
      return res.status(400).send(`Webhook Error: ${errorMessage}`);
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (!session?.metadata?.userId || !session?.metadata?.orderId) {
      return res.status(400).send(`Webhook Error: No user present in metadata`);
    }

    if (event.type === "checkout.session.completed") {
      const payload = await getPayloadClient();

      const { docs: users } = await payload.find({
        collection: "users",
        where: {
          id: {
            equals: session.metadata.userId,
          },
        },
      });

      const [user] = users;

      if (!user) return res.status(404).send("No such user exists.");

      const { docs: orders } = await payload.find({
        collection: "orders",
        depth: 2,
        where: {
          id: {
            equals: session.metadata.orderId,
          },
        },
      });

      const [order] = orders;

      if (!order) return res.status(404).send("No such order exists.");

      await payload.update({
        collection: "orders",
        data: {
          _isPaid: true,
        },
        where: {
          id: {
            equals: session.metadata.orderId,
          },
        },
      });

      try {
        await emailService.emails.send({
          from: "DigitalHippo <hello@joshtriedcoding.com>",
          to: [user.email as string],
          subject: "Thanks for your order! This is your receipt.",
          html: await ReceiptEmailHtml({
            date: new Date(),
            email: user.email as string,
            orderId: session.metadata.orderId,
            products: order.products as Product[],
          }),
        });
      } catch (error) {
        console.error("Failed to send email:", error);
      }

      return res
        .status(200)
        .json({ received: true, message: "Order processed successfully" });
    }

    return res
      .status(400)
      .send(`Webhook Error: Unhandled event type ${event.type}`);
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};

export default stripeWebhookHandler;
