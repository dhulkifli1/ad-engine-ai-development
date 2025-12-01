import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] API: Received delete chat request:", body)

    const webhookUrl = "https://paidadvertising.app.n8n.cloud/webhook/30919980-69f5-423b-b394-c6eaf9904b7c"
    console.log("[v0] API: Sending request to:", webhookUrl)

    // Forward the request to the n8n webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AdEngine-Frontend/1.0",
      },
      body: JSON.stringify(body),
    })

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
    console.error("[v0] API: Error forwarding delete request:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
