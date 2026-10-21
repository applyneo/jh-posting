import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export interface SheetJobRow {
  id: string;
  slug: string;
  postedDate: string;
  postedTime: string;
  category: "tech" | "non_tech" | "healthcare";
  title: string;
  company: string;
  location: string;
  workMode: string;
  jobType: string;
  salary: string;
  experience: string;
  applyUrl: string;
  deliveredToCount: number;
  chatIds: string[];
  status: "Success" | "Failed";
}

export interface SheetSummaryStats {
  totalJobs: number;
  techCount: number;
  nonTechCount: number;
  healthcareCount: number;
  totalDeliveries: number;
  lastUpdated: string;
}

// Memory cache fallback for serverless cold-start performance
let memoryRows: SheetJobRow[] = [];
let memorySlugs: Set<string> = new Set();

function getStoragePaths() {
  const rootDir = process.cwd();
  const localDataDir = path.join(rootDir, "data");
  const localJsonPath = path.join(localDataDir, "jobs_ledger.json");
  const localExcelPath = path.join(rootDir, "posted_jobs_ledger.xlsx");
  const tmpJsonPath = path.join("/tmp", "jobs_ledger.json");
  const tmpExcelPath = path.join("/tmp", "posted_jobs_ledger.xlsx");

  return {
    localDataDir,
    localJsonPath,
    localExcelPath,
    tmpJsonPath,
    tmpExcelPath,
  };
}

/**
 * Load all sheet rows from persistent storage
 */
export function getSheetRows(): SheetJobRow[] {
  const { localJsonPath, tmpJsonPath } = getStoragePaths();

  // Try reading from tmp on Vercel, then local repo file
  const pathsToCheck = process.env.VERCEL
    ? [tmpJsonPath, localJsonPath]
    : [localJsonPath, tmpJsonPath];

  for (const p of pathsToCheck) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryRows = parsed;
          memorySlugs = new Set(parsed.map((r: SheetJobRow) => r.slug).filter(Boolean));
          return memoryRows;
        }
      }
    } catch {}
  }

  return memoryRows;
}

/**
 * Get Set of all posted job slugs for 100% duplicate prevention
 */
export function getPostedSlugs(): Set<string> {
  getSheetRows();
  return memorySlugs;
}

/**
 * Save newly broadcasted jobs to the backend sheet & generate Excel workbook
 */
export function appendSheetRows(newRows: SheetJobRow[]): SheetJobRow[] {
  if (newRows.length === 0) return getSheetRows();

  const current = getSheetRows();
  const updated = [...current, ...newRows];
  memoryRows = updated;
  newRows.forEach((r) => {
    if (r.slug) memorySlugs.add(r.slug);
  });

  const { localDataDir, localJsonPath, localExcelPath, tmpJsonPath, tmpExcelPath } = getStoragePaths();

  // Ensure directories exist
  try {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
  } catch {}

  const jsonString = JSON.stringify(updated, null, 2);

  // Write to local json and tmp json
  for (const p of [localJsonPath, tmpJsonPath]) {
    try {
      fs.writeFileSync(p, jsonString, "utf-8");
    } catch {}
  }

  // Also write legacy posted_history.json for backward compatibility
  const slugList = Array.from(memorySlugs);
  for (const p of [path.join(process.cwd(), "posted_history.json"), path.join("/tmp", "posted_history.json")]) {
    try {
      fs.writeFileSync(p, JSON.stringify(slugList, null, 2), "utf-8");
    } catch {}
  }

  // Generate Excel workbook
  generateExcelFile(updated, [localExcelPath, tmpExcelPath]);

  return updated;
}

/**
 * Build Excel workbook with "All Posted Jobs" and "Daily Summary" sheets
 */
function generateExcelFile(rows: SheetJobRow[], targets: string[]) {
  try {
    const wb = XLSX.utils.book_new();

    // 1. All Posted Jobs Sheet
    const allFormatted = rows.map((r) => ({
      "Posted Date": r.postedDate,
      "Posted Time (IST)": r.postedTime,
      "Category": (r.category || "").toUpperCase(),
      "Job Title": r.title,
      "Company": r.company,
      "Location": r.location,
      "Work Mode": r.workMode,
      "Job Type": r.jobType || "Full-Time",
      "Salary": r.salary,
      "Experience": r.experience,
      "Official Apply Link": r.applyUrl,
      "Delivered To (Chats Count)": r.deliveredToCount,
      "Chat IDs": (r.chatIds || []).join(", "),
      "Status": r.status,
    }));

    const wsAll = XLSX.utils.json_to_sheet(allFormatted);
    wsAll["!cols"] = [
      { wch: 14 }, // Date
      { wch: 18 }, // Time
      { wch: 14 }, // Category
      { wch: 32 }, // Title
      { wch: 28 }, // Company
      { wch: 25 }, // Location
      { wch: 16 }, // Work Mode
      { wch: 14 }, // Job Type
      { wch: 26 }, // Salary
      { wch: 15 }, // Experience
      { wch: 60 }, // URL
      { wch: 22 }, // Chat Count
      { wch: 35 }, // Chat IDs
      { wch: 12 }, // Status
    ];

    // 2. Daily Summary Sheet
    const summaryMap: Record<string, {
      Date: string;
      "Tech Jobs Posted": number;
      "Non-Tech Jobs Posted": number;
      "Healthcare Jobs Posted": number;
      "Total Jobs Done": number;
      "Total Telegram Deliveries": number;
      "Last Updated (IST)": string;
    }> = {};

    for (const r of rows) {
      if (!summaryMap[r.postedDate]) {
        summaryMap[r.postedDate] = {
          Date: r.postedDate,
          "Tech Jobs Posted": 0,
          "Non-Tech Jobs Posted": 0,
          "Healthcare Jobs Posted": 0,
          "Total Jobs Done": 0,
          "Total Telegram Deliveries": 0,
          "Last Updated (IST)": r.postedTime,
        };
      }
      const entry = summaryMap[r.postedDate];
      if (r.status === "Success") {
        if (r.category === "tech") entry["Tech Jobs Posted"]++;
        else if (r.category === "non_tech") entry["Non-Tech Jobs Posted"]++;
        else if (r.category === "healthcare") entry["Healthcare Jobs Posted"]++;
        entry["Total Jobs Done"]++;
        entry["Total Telegram Deliveries"] += r.deliveredToCount || 0;
        entry["Last Updated (IST)"] = r.postedTime;
      }
    }

    const wsSummary = XLSX.utils.json_to_sheet(Object.values(summaryMap));
    wsSummary["!cols"] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 24 },
      { wch: 20 },
    ];

    wb.Sheets["All Posted Jobs"] = wsAll;
    wb.Sheets["Daily Summary"] = wsSummary;
    wb.SheetNames = ["All Posted Jobs", "Daily Summary"];

    for (const target of targets) {
      try {
        XLSX.writeFile(wb, target);
      } catch {}
    }
  } catch (e) {
    console.error("Failed to generate Excel file:", e);
  }
}

/**
 * Return binary Excel buffer for download
 */
export function getExcelWorkbookBuffer(): Buffer {
  const rows = getSheetRows();
  const wb = XLSX.utils.book_new();

  const allFormatted = rows.map((r) => ({
    "Posted Date": r.postedDate,
    "Posted Time (IST)": r.postedTime,
    "Category": (r.category || "").toUpperCase(),
    "Job Title": r.title,
    "Company": r.company,
    "Location": r.location,
    "Work Mode": r.workMode,
    "Job Type": r.jobType || "Full-Time",
    "Salary": r.salary,
    "Experience": r.experience,
    "Official Apply Link": r.applyUrl,
    "Delivered To (Chats Count)": r.deliveredToCount,
    "Chat IDs": (r.chatIds || []).join(", "),
    "Status": r.status,
  }));

  const wsAll = XLSX.utils.json_to_sheet(allFormatted);
  wb.Sheets["All Posted Jobs"] = wsAll;
  wb.SheetNames = ["All Posted Jobs"];

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

/**
 * Compute summary statistics for the dashboard
 */
export function getSheetStats(): SheetSummaryStats {
  const rows = getSheetRows();
  let tech = 0;
  let nonTech = 0;
  let health = 0;
  let deliveries = 0;
  let lastTime = "No posts yet";

  rows.forEach((r) => {
    if (r.category === "tech") tech++;
    else if (r.category === "non_tech") nonTech++;
    else if (r.category === "healthcare") health++;
    deliveries += r.deliveredToCount || 0;
    if (r.postedTime) lastTime = `${r.postedDate} at ${r.postedTime}`;
  });

  return {
    totalJobs: rows.length,
    techCount: tech,
    nonTechCount: nonTech,
    healthcareCount: health,
    totalDeliveries: deliveries,
    lastUpdated: lastTime,
  };
}
