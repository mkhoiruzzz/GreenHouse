import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/* ================= ENV ================= */
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY || process.env.VITE_TRIPAY_PRIVATE_KEY;
const FONNTE_TOKEN = process.env.FONNTE_TOKEN || process.env.VITE_FONNTE_TOKEN;

/* ================= UTILS ================= */
function verifyTripaySignature(req, body) {
  const signature = req.headers["x-callback-signature"];
  const event = req.headers["x-callback-event"];

  if (event !== "payment_status") return false;

  const hmac = crypto
    .createHmac("sha256", TRIPAY_PRIVATE_KEY)
    .update(JSON.stringify(body))
    .digest("hex");

  return hmac === signature;
}

/* ================= HANDLER ================= */
export default async function handler(req, res) {
  console.log("📨 Incoming Webhook Request:", {
    method: req.method,
    headers: req.headers,
    url: req.url
  });

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed. Use POST." });
  }

  // Check env variables inside handler to avoid top-level crash
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TRIPAY_PRIVATE_KEY) {
    console.error("❌ MISSING ENVIRONMENT VARIABLES");
    return res.status(500).json({
      message: "Server configuration error: missing credentials",
      debug: {
        url: !!SUPABASE_URL,
        key: !!SUPABASE_SERVICE_ROLE_KEY,
        tripay: !!TRIPAY_PRIVATE_KEY
      }
    });
  }

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );
  const payload = req.body;

  /* ==== VERIFY SIGNATURE ==== */
  try {
    if (!verifyTripaySignature(req, payload)) {
      console.error("❌ Invalid Tripay signature");
      return res.status(401).json({ message: "Invalid signature" });
    }
  } catch (sigErr) {
    console.error("🔥 Signature verification failed:", sigErr);
    return res.status(500).json({ message: "Signature calculation error" });
  }

  console.log("📩 Payload Verified:", payload);

  const {
    reference,
    merchant_ref,
    status,
    total_amount,
    payment_method,
  } = payload;

  try {
    /* ==== GET ORDER ==== */
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("tripay_reference", reference)
      .single();

    if (fetchError || !order) {
      console.error("❌ Order not found for reference:", reference, fetchError);
      return res.status(404).json({ message: "Order not found in database" });
    }

    /* ==== UPDATE ORDER ==== */
    // Tripay sends "PAID" or "UNPAID" or "EXPIRED"
    if (status?.toUpperCase() === "PAID") {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status_pembayaran: "paid", // Use lowercase for consistency with analytics
          metode_pembayaran: payment_method,
        })
        .eq("id", order.id);

      if (updateError) {
        console.error("❌ Failed to update order:", updateError);
        throw updateError;
      }
      console.log("✅ Order updated to paid (lowercase)");
    }

    /* ==== SEND WHATSAPP (FIX FINAL) ==== */
    if (status?.toUpperCase() === "PAID" && order.customer_phone) {
      // 🔥 FORMAT PALING AMAN UNTUK FONNTE
      const phone = order.customer_phone
        .replace(/\D/g, "")
        .replace(/^62/, "")
        .replace(/^0/, "");

      console.log("📱 FINAL PHONE FORMATTED:", phone);

      const customerName = order.customer_name || "Customer";

      const message = `
Halo *${customerName}* 👋

Terima kasih telah melakukan pembayaran di *Green House 🌱*

🧾 *Order ID*: ${merchant_ref}
💳 *Metode*: ${payment_method}
💰 *Total*: Rp ${Number(total_amount).toLocaleString("id-ID")}
📦 *Status*: Pembayaran berhasil ✅

Pesananmu sedang kami proses 🌿
Terima kasih 🙏
      `.trim();

      try {
        const waRes = await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            Authorization: FONNTE_TOKEN || '',
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target: phone,
            countryCode: "62",
            message: message,
          }),
        });

        const waText = await waRes.text();
        console.log("📨 FONNTE RESPONSE:", waText);
      } catch (waErr) {
        console.error("⚠️ Fonnte WhatsApp error:", waErr.message);
        // Don't fail the whole webhook if WhatsApp fails
      }

      // 📟 INSERT PERSISTENT NOTIFICATION
      try {
        await supabase.from("notifications").insert({
          user_id: order.user_id,
          type: "payment",
          title: "Pembayaran Berhasil ✅",
          message: `Terima kasih! Pembayaran pesanan #${order.id} telah kami terima.`,
          order_id: order.id,
          link: "/orders"
        });
        console.log("✅ Persistent notification inserted");
      } catch (notifErr) {
        console.error("⚠️ Failed to insert notification:", notifErr.message);
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("🔥 Webhook processing error:", err);
    return res.status(500).json({
      message: "Internal server error during processing",
      error: err.message
    });
  }
}
