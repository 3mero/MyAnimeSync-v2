import { type NextRequest, NextResponse } from "next/server"

// This route acts as a proxy to the AniList API
// to avoid client-side CORS issues and hide potential API keys.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error("Anilist API Error:", res.status, errorBody)
      return NextResponse.json(
        { error: `Anilist API error: ${res.statusText}`, details: errorBody },
        { status: res.status },
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("API Route Error:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
