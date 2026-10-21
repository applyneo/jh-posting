import { NextRequest, NextResponse } from "next/server";

const FREEHIRE_API = "https://freehire.me/api/v1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiUrl = new URL(`${FREEHIRE_API}/jobs/facets`);

    for (const [key, value] of searchParams.entries()) {
      apiUrl.searchParams.append(key, value);
    }

    const res = await fetch(apiUrl.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "FreeHire-Web-Portal/1.0",
      },
      next: { revalidate: 300 }, // cache facets for 5 mins
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `FreeHire facets error: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load facets" },
      { status: 500 }
    );
  }
}
