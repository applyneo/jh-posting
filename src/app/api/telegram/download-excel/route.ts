import { NextResponse } from "next/server";
import { getExcelBuffer } from "@/lib/excel_logger";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const existing = getExcelBuffer();
    let finalBuffer: Buffer;

    if (existing) {
      finalBuffer = existing;
    } else {
      const wb = XLSX.utils.book_new();
      const wsAll = XLSX.utils.json_to_sheet([]);
      const wsSummary = XLSX.utils.json_to_sheet([]);
      wb.Sheets["All Posted Jobs"] = wsAll;
      wb.Sheets["Daily Summary"] = wsSummary;
      wb.SheetNames = ["All Posted Jobs", "Daily Summary"];
      finalBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    }

    const uint8 = new Uint8Array(finalBuffer);
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="JobHunger_Telegram_Posting_Ledger.xlsx"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to download Excel file" }, { status: 500 });
  }
}
