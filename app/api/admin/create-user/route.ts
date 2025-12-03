import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function generateRandomPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let password = ""
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    console.log("[CreateUser API] Request received")

    let requestData: any
    try {
      requestData = await request.json()
    } catch (parseError) {
      console.error("[CreateUser API] JSON parse error:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { email, firstName, lastName, role } = requestData
    console.log("[CreateUser API] Request data:", { email, firstName, lastName, role })

    if (!email || !firstName || !lastName || !role) {
      console.log("[CreateUser API] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const password = generateRandomPassword()
    console.log("[CreateUser API] Generated random password for user")

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[CreateUser API] Creating user with admin privileges...")

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

    if (createError) {
      console.error("[CreateUser API] Error creating user:", createError)
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!newUser.user) {
      console.log("[CreateUser API] Failed to create user - no user returned")
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    console.log("[CreateUser API] User created, inserting profile...")
    const { error: profileInsertError } = await supabase.from("users").upsert(
      {
        id: newUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        first_sign_in: true, // Set to true for new users
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    )

    if (profileInsertError) {
      console.error("[CreateUser API] Error inserting user profile:", profileInsertError)
      // User was created but profile insert failed - this is still a success
      // The user can still log in, they just won't have the role set properly
    }

    console.log("[CreateUser API] User created successfully:", newUser.user.id)

    try {
      console.log("[CreateUser API] Triggering user creation webhook...")

      const webhookPayload = {
        user_email: email,
        password: password,
      }

      const webhookUrl =
        process.env.ENVIRONMENT === "sandbox"
          ? "https://paidadvertising.app.n8n.cloud/webhook/a4f319cd-cd94-4a0f-b43e-f004301b4b0e"
          : "https://paidadvertising.app.n8n.cloud/webhook/79192633-ea4d-4365-8925-586cbcc04cdb";
      console.log("[CreateUser API] Sending webhook to:", webhookUrl)
      console.log("[CreateUser API] Webhook payload:", { user_email: email, password: "[REDACTED]" })

      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "AdEngine-Frontend/1.0",
        },
        body: JSON.stringify(webhookPayload),
      })

      console.log("[CreateUser API] Webhook response status:", webhookResponse.status)

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text()
        console.error("[CreateUser API] Webhook failed:", webhookResponse.status, errorText)
        // Don't fail the user creation if webhook fails
      } else {
        const responseData = await webhookResponse.text()
        console.log("[CreateUser API] Webhook success:", responseData)
      }
    } catch (webhookError) {
      console.error("[CreateUser API] Webhook error:", webhookError)
      // Don't fail the user creation if webhook fails
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        firstName,
        lastName,
        role,
      },
    })
  } catch (error) {
    console.error("[CreateUser API] Unexpected error:", error)
    return NextResponse.json(
      {
        error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
