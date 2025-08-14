import express from "express";
import fetch from "node-fetch";
import { runQuery } from "../services/neo4jService.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/webhook", express.json({ type: "*/*" }), async (req, res) => {
  try {
    const transmissionId = req.header("paypal-transmission-id");
    const transmissionTime = req.header("paypal-transmission-time");
    const certUrl = req.header("paypal-cert-url");
    const authAlgo = req.header("paypal-auth-algo");
    const transmissionSig = req.header("paypal-transmission-sig");
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const body = req.body;

    const response = await fetch(`https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET).toString("base64")}`
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: body
      })
    });

    const verifyData = await response.json();
    if (verifyData.verification_status !== "SUCCESS") {
      return res.status(400).send("Invalid signature");
    }

    if (body.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      const customUserId = body.resource.custom_id;
      if (customUserId) {
        await runQuery(
          `MERGE (u:User {id: $userId}) SET u.premium = true`,
          { userId: customUserId }
        );
        console.log(`✅ Premium activated for ${customUserId}`);
      }
    }

    if (body.event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
      const customUserId = body.resource.custom_id;
      if (customUserId) {
        await runQuery(
          `MERGE (u:User {id: $userId}) SET u.premium = false`,
          { userId: customUserId }
        );
        console.log(`❌ Premium cancelled for ${customUserId}`);
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Error");
  }
});

router.post('/upgrade', async (req, res) => {
  // This route remains for client fallback if needed (but webhook is preferred)
  const { userId } = req.body;
  await runQuery(
    `MERGE (u:User {id: $userId}) SET u.premium = true`,
    { userId }
  );
  res.json({ success: true });
});

export default router;
