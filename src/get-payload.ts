import { getPayload } from "payload/dist/payload";
import nodemailer from "nodemailer";
import config from "./payload.config";
import { MongoClient } from "mongodb";
import { InitOptions } from "payload/config";

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  secure: true,
  port: 465,
  auth: {
    user: "resend",
    pass: process.env.RESEND_API_KEY,
  },
});

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
        transport: transporter,
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
