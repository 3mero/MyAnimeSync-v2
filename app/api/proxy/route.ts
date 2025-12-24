import { type NextRequest, NextResponse } from "next/server"

// This route acts as a server-side proxy to bypass client-side CORS issues.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const targetUrl = searchParams.get("url")

  if (!targetUrl) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Failed to fetch from target URL: ${response.statusText}`, details: errorText },
        { status: response.status },
      )
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || (!contentType.includes("application/json") && !contentType.includes("text/plain"))) {
      return NextResponse.json(
        { error: "Invalid content type. Proxied URL must return JSON or plain text." },
        { status: 400 },
      )
    }

    const data = await response.json()

    const newHeaders = new Headers()
    newHeaders.set("Content-Type", "application/json")

    const etag = response.headers.get("etag")
    if (etag) {
      newHeaders.set("ETag", etag)
    }

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: newHeaders,
    })
  } catch (error: any) {
    console.error("[PROXY API] Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error during proxy request", details: error.message },
      { status: 500 },
    )
  }
}
