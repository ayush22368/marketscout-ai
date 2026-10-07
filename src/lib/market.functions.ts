import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { runMarketAnalysis } from "./market.server";

const schema = z.object({
  business: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(100),
  budget: z.string().trim().min(1).max(60),
  targetCustomers: z.string().trim().min(2).max(160),
});

export const analyzeMarket = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => runMarketAnalysis(data));
