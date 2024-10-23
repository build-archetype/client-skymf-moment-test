import { getPayload } from "payload/dist/payload";
import nodemailer from "nodemailer";
import config from "./payload.config";
import { MongoClient } from "mongodb";
import { InitOptions } from "payload/config";

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
    return {
      emails: {
        send: async ({ from, to, subject, html }: any) => {
          const transporter = nodemailer.createTransport({
            host: "smtp.resend.com",
            secure: true,
            port: 465,
            auth: {
              user: "resend",
              pass: process.env.RESEND_API_KEY,
            },
          });

          const info = await transporter.sendMail({
            from,
            to,
            subject,
            html,
          });

          return { id: info.messageId };
        },
      },
    };
  }
};

const emailService = createEmailService();

let cached = (global as any).payload;

if (!cached) {
  cached = (global as any).payload = { client: null, promise: null };
}

export const getPayloadClient = async (options?: {
  initOptions?: Partial<InitOptions>;
}) => {
  if (cached.client) {
    return cached.client;
  }

  if (!cached.promise) {
    const mongodb = await MongoClient.connect(process.env.MONGODB_URL!);

    cached.promise = getPayload({
      // @ts-ignore
      mongoConnection: mongodb.db(),
      config,
      email: {
        transport: nodemailer.createTransport({
          // Use a standard SMTP configuration or another supported transport
          host: "your-smtp-host",
          port: 587,
          auth: {
            user: "your-email@example.com",
            pass: "your-password",
          },
        }),
        fromName: "moment",
        fromAddress: "hello@moment.com",
      },
      ...(options?.initOptions || {}),
    });
  }

  try {
    cached.client = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.client;
};
