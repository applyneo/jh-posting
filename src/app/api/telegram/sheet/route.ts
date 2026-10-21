import { NextResponse } from "next/server";
import { getSheetRows, getSheetStats } from "@/lib/sheet_backend";

export async function GET() {
  try {
    const rows = getSheetRows();
    const stats = getSheetStats();

    return NextResponse.json({
      ok: true,
      stats,
      total: rows.length,
      rows,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load sheet data" },
      { status: 500 }
    );
  }
}
