import { NextRequest, NextResponse } from "next/server";

const FREEHIRE_API = "https://freehire.me/api/v1";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
    }

    const res = await fetch(`${FREEHIRE_API}/jobs/${encodeURIComponent(slug)}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FreeHire-Web-Portal/1.0",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Job not found or API error (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch job" },
      { status: 500 }
    );
  }
}
