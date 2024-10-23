import express from "express";
import { WebhookRequest } from "./server";
import { stripe } from "./lib/stripe";
import type Stripe from "stripe";
import { getPayloadClient } from "./get-payload";
import { Product } from "./payload-types";
import { Resend } from "resend";
import { ReceiptEmailHtml } from "./components/emails/ReceiptEmail";
import { NextApiRequest } from "next";
import { Buffer } from "buffer";

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

export const stripeWebhookHandler = async (buf: Buffer, sig: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    throw new Error(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}`
    );
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (!session?.metadata?.userId || !session?.metadata?.orderId) {
    throw new Error("Webhook Error: No user present in metadata");
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

    if (!user) throw new Error("No such user exists.");

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

    if (!order) throw new Error("No such order exists.");

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

    return { message: "Order processed successfully" };
  }

  throw new Error("Webhook Error: Unhandled event type");
};
