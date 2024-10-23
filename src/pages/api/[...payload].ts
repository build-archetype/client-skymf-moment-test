import { getPayloadClient } from "../../get-payload";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const payload = await getPayloadClient();
  await payload.api(req, res);
}
