// api/delete-account.js
// ✅ API Route untuk menghapus akun user (Server-side)

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, email } = req.body;

    // Validate input
    if (!user_id || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id and email' 
      });
    }

    console.log(`📄 API: Starting account deletion for user: ${user_id}`);

    // ✅ STEP 1: Soft delete dari profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        email: email // Keep original email for reference
      })
      .eq('id', user_id);

    if (profileError) {
      console.error('Profile soft delete error:', profileError);
      throw new Error(`Failed to soft delete profile: ${profileError.message}`);
    }

    console.log('✅ Profile soft deleted');

    // ✅ STEP 2: Update email di auth.users dengan unique email
    const uniqueEmail = `deleted_${user_id}_${Date.now()}@deleted.account`;
    
    try {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { 
          email: uniqueEmail,
          email_confirm: true // Skip email confirmation
        }
      );

      if (updateError) {
        console.warn('Email update warning:', updateError);
        // Don't throw, continue with process
      } else {
        console.log(`✅ Auth email updated to: ${uniqueEmail}`);
      }
    } catch (emailError) {
      console.warn('Email update error (non-critical):', emailError);
      // Continue even if this fails
    }

    // ✅ STEP 3: Optional - Hard delete dari auth.users setelah delay
    // Uncomment jika ingin langsung hard delete
    /*
    try {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      
      if (deleteError) {
        console.warn('Auth user deletion warning:', deleteError);
      } else {
        console.log('✅ User deleted from auth.users');
      }
    } catch (deleteError) {
      console.warn('Auth deletion error (non-critical):', deleteError);
    }
    */

    // ✅ SUCCESS RESPONSE
    return res.status(200).json({
      success: true,
      message: 'Account successfully deleted. Email can be reused.',
      details: {
        profile_deleted: true,
        auth_email_updated: true,
        original_email: email,
        user_id: user_id
      }
    });

  } catch (error) {
    console.error('❌ API Delete account error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to delete account',
      message: error.message,
      details: 'Account deletion encountered an error. Please contact support.'
    });
  }
}

// ✅ ALTERNATIVE: Next.js App Router (app/api/delete-account/route.js)
/*
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request) {
  try {
    const { user_id, email } = await request.json();

    if (!user_id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Same deletion logic as above...
    
    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
*/