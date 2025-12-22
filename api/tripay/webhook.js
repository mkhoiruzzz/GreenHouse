import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/* ================= ENV ================= */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY;
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

/* ================= SUPABASE ================= */
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

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

function formatPhone(phone) {
  return phone
    .replace(/\D/g, "")
    .replace(/^0/, "62");
}

/* ================= HANDLER ================= */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const payload = req.body;

  /* ==== VERIFY SIGNATURE ==== */
  if (!verifyTripaySignature(req, payload)) {
    console.error("❌ Invalid Tripay signature");
    return res.status(401).json({ message: "Invalid signature" });
  }

  console.log("📩 Tripay Callback:", payload);

  const {
    reference,
    merchant_ref,
    status,
    total_amount,
    payment_method,
  } = payload;

  try {
    /* ==== GET ORDER ==== */
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("tripay_reference", reference)
      .single();

    if (orderError || !order) {
      console.error("❌ Order not found", orderError);
      return res.status(404).json({ message: "Order not found" });
    }

    /* ==== UPDATE ORDER STATUS ==== */
    if (status === "PAID") {
      await supabase
        .from("orders")
        .update({
          status_pembayaran: "PAID",
          metode_pembayaran: payment_method,
        })
        .eq("id", order.id);

      console.log("✅ Order updated to PAID");
    }

    /* ==== SEND WHATSAPP ==== */
    if (status === "PAID" && order.customer_phone) {
      const phone = formatPhone(order.customer_phone);
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

      await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: FONNTE_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: phone,
          message,
        }),
      });

      console.log("📱 WA sent to:", phone);
    }

    return res.json({ success: true, message: "Webhook processed" });
  } catch (err) {
    console.error("🔥 Webhook Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
