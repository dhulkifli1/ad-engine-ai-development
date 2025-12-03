import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API: Brand creation request received")

    const body = await request.json()
    console.log("[v0] API: Received brand creation request:", body)

    const webhookUrl =
      process.env.NEXT_PUBLIC_ENVIRONMENT === "sandbox"
        ? "https://paidadvertising.app.n8n.cloud/webhook/705b4fe6-de4b-401b-870e-4fe1e6d043f7"
        : "https://paidadvertising.app.n8n.cloud/webhook/26c5b336-b3a2-46d9-bae5-7f75eabda7fb";
    console.log("[v0] API: Sending request to:", webhookUrl)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    console.log("[v0] API: n8n response status:", response.status)
    console.log("[v0] API: n8n response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] API: n8n webhook failed:", errorText)
      return NextResponse.json(
        { error: "Webhook request failed", details: errorText, url: webhookUrl },
        { status: response.status },
      )
    }

    const responseData = await response.json()
    console.log("[v0] API: n8n webhook success:", responseData)

    return NextResponse.json({ success: true, data: JSON.stringify(responseData) })
  } catch (error) {
    console.error("[v0] API: Error in brand creation:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
