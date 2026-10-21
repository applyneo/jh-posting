import { NextRequest, NextResponse } from "next/server";

const FREEHIRE_API = "https://freehire.me/api/v1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Construct query to FreeHire API
    const apiUrl = new URL(`${FREEHIRE_API}/agent/jobs/search`);
    
    // Copy all allowed parameters
    const allowedParams = [
      "q",
      "limit",
      "offset",
      "work_mode",
      "category",
      "seniority",
      "country",
      "region",
      "employment_type",
      "company",
    ];

    for (const key of allowedParams) {
      const values = searchParams.getAll(key);
      for (const val of values) {
        if (val) apiUrl.searchParams.append(key, val);
      }
    }

    // Always request markdown description format
    apiUrl.searchParams.set("description_format", "markdown");

    // Default limit and offset if not specified
    if (!apiUrl.searchParams.has("limit")) {
      apiUrl.searchParams.set("limit", "20");
    }
    if (!apiUrl.searchParams.has("offset")) {
      apiUrl.searchParams.set("offset", "0");
    }

    const res = await fetch(apiUrl.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "FreeHire-Web-Portal/1.0",
      },
      next: { revalidate: 30 }, // cache for 30s
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `FreeHire upstream error (${res.status}): ${text}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("API /api/jobs error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
