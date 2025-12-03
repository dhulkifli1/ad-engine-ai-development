import { type NextRequest, NextResponse } from "next/server"

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const controller = new AbortController()
    const body = await request.json()
    console.log("[v0] API: Received webhook payload:", body)

    const webhookUrl =
      process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
        ? "https://paidadvertising.app.n8n.cloud/webhook/f15da269-0ee5-4b08-ad92-ae7d14b0c0e2"
        : "https://paidadvertising.app.n8n.cloud/webhook/9216bb6c-cd2b-40c0-9a86-91123c00d197";
    console.log("[v0] API: Sending request to:", webhookUrl)

    const timeout = setTimeout(() => controller.abort(), maxDuration * 1000)

    // Forward the request to the n8n webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AdEngine-Frontend/1.0",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    console.log("[v0] API: n8n response status:", response.status)
    console.log("[v0] API: n8n response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] API: n8n webhook failed:", response.status, response.statusText)
      console.error("[v0] API: n8n error response:", errorText)

      return NextResponse.json(
        {
          error: "Webhook request failed",
          status: response.status,
          statusText: response.statusText,
          details: errorText,
          url: webhookUrl,
        },
        { status: response.status },
      )
    }

    const responseData = await response.text()
    console.log("[v0] API: n8n webhook success:", responseData)

    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    console.error("[v0] API: Error forwarding webhook:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
