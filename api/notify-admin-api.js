import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { type, title, message, order_id, link } = req.body;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ message: "Supabase credentials missing" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        console.log("🔔 Starting Admin notification process for type:", type);

        // 1. Fetch all Admins from auth.users (Service Role can do this)
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) throw authError;

        const admins = users.filter(u =>
            u.email === 'admin@example.com' ||
            u.user_metadata?.role === 'admin'
        );

        if (admins.length === 0) {
            console.log("⚠️ No Admin users found in auth.users");
            return res.status(200).json({ success: true, message: "No admins to notify" });
        }

        console.log(`👤 Found ${admins.length} admins to notify`);

        // 2. Prepare notifications
        const adminNotifs = admins.map(admin => ({
            user_id: admin.id,
            type: type || 'order',
            title: title || 'Notifikasi Admin 🔔',
            message: message || 'Ada aktivitas baru di toko.',
            order_id: order_id || null,
            link: link || '/admin',
            is_read: false
        }));

        // 3. Insert and ignore RLS
        const { error: insertError } = await supabase
            .from('notifications')
            .insert(adminNotifs);

        if (insertError) throw insertError;

        console.log("✅ Admin notifications inserted successfully");

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("🔥 Admin notification error:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
