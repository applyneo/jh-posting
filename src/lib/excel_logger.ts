import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

export interface JobPostRecord {
  domain: "tech" | "non_tech" | "healthcare";
  title: string;
  company: string;
  location: string;
  workMode: string;
  jobType: string;
  salary: string;
  experience: string;
  applyUrl: string;
  chatCount: number;
  chatIds: string[];
  status: "Success" | "Failed";
}

const EXCEL_PATH = path.join(process.cwd(), "posted_jobs_ledger.xlsx");

export function recordPostsToExcel(records: JobPostRecord[]) {
  if (records.length === 0) return;

  const now = new Date();
  // Format for IST (UTC + 5:30)
  const istDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const istTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);

  let wb: XLSX.WorkBook;
  let allRows: any[] = [];
  let summaryRows: any[] = [];

  try {
    if (fs.existsSync(EXCEL_PATH)) {
      wb = XLSX.readFile(EXCEL_PATH);
      if (wb.Sheets["All Posted Jobs"]) {
        allRows = XLSX.utils.sheet_to_json(wb.Sheets["All Posted Jobs"]);
      }
      if (wb.Sheets["Daily Summary"]) {
        summaryRows = XLSX.utils.sheet_to_json(wb.Sheets["Daily Summary"]);
      }
    } else {
      wb = XLSX.utils.book_new();
    }
  } catch {
    wb = XLSX.utils.book_new();
  }

  // Append new jobs to allRows
  for (const r of records) {
    allRows.push({
      "Posted Date": istDate,
      "Posted Time (IST)": istTime,
      "Category": r.domain.toUpperCase(),
      "Job Title": r.title,
      "Company": r.company,
      "Location": r.location,
      "Work Mode": r.workMode,
      "Job Type": r.jobType,
      "Salary": r.salary,
      "Experience": r.experience,
      "Official Apply Link": r.applyUrl,
      "Delivered To (Chats Count)": r.chatCount,
      "Chat IDs": r.chatIds.join(", "),
      "Status": r.status,
    });
  }

  // Update Daily Summary
  let todaySummary = summaryRows.find((s) => s["Date"] === istDate);
  if (!todaySummary) {
    todaySummary = {
      Date: istDate,
      "Tech Jobs Posted": 0,
      "Non-Tech Jobs Posted": 0,
      "Healthcare Jobs Posted": 0,
      "Total Jobs Done Today": 0,
      "Total Telegram Deliveries": 0,
      "Last Updated (IST)": istTime,
    };
    summaryRows.push(todaySummary);
  }

  for (const r of records) {
    if (r.status === "Success") {
      if (r.domain === "tech") todaySummary["Tech Jobs Posted"]++;
      else if (r.domain === "non_tech") todaySummary["Non-Tech Jobs Posted"]++;
      else if (r.domain === "healthcare") todaySummary["Healthcare Jobs Posted"]++;

      todaySummary["Total Jobs Done Today"]++;
      todaySummary["Total Telegram Deliveries"] += r.chatCount;
    }
  }
  todaySummary["Last Updated (IST)"] = istTime;

  // Build sheets
  const wsAll = XLSX.utils.json_to_sheet(allRows);
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

  // Set column widths for readability
  wsAll["!cols"] = [
    { wch: 12 }, // Date
    { wch: 16 }, // Time
    { wch: 12 }, // Category
    { wch: 35 }, // Title
    { wch: 25 }, // Company
    { wch: 25 }, // Location
    { wch: 15 }, // Work Mode
    { wch: 12 }, // Job Type
    { wch: 25 }, // Salary
    { wch: 15 }, // Experience
    { wch: 60 }, // URL
    { wch: 20 }, // Chat Count
    { wch: 35 }, // Chat IDs
    { wch: 10 }, // Status
  ];

  wsSummary["!cols"] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 },
    { wch: 18 },
  ];

  wb.Sheets["All Posted Jobs"] = wsAll;
  wb.Sheets["Daily Summary"] = wsSummary;
  wb.SheetNames = ["All Posted Jobs", "Daily Summary"];

  try {
    XLSX.writeFile(wb, EXCEL_PATH);
  } catch (err) {
    console.error("Failed to write Excel file:", err);
  }
}

export function getExcelBuffer(): Buffer | null {
  try {
    if (fs.existsSync(EXCEL_PATH)) {
      return fs.readFileSync(EXCEL_PATH);
    }
  } catch {}
  return null;
}
