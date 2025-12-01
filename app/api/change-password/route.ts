import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json()

    if (!userId || !password) {
      return NextResponse.json({ error: "User ID and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Create admin client using service role key
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[API] Updating password for user:", userId)

    // Update user password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: password })

    if (updateError) {
      console.error("[API] Password update error:", updateError)
      throw updateError
    }

    console.log("[API] Password updated successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Change password error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update password" },
      { status: 500 },
    )
  }
}
