import { NextResponse } from "next/server";
import { getExcelWorkbookBuffer } from "@/lib/sheet_backend";

export async function GET() {
  try {
    const finalBuffer = getExcelWorkbookBuffer();
    const uint8 = new Uint8Array(finalBuffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="JobHunger_Telegram_Posting_Ledger.xlsx"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to download Excel file" },
      { status: 500 }
    );
  }
}
