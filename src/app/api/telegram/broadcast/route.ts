import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_TELEGRAM_CONFIG,
  formatTelegramCard,
  sendTelegramMessage,
  isStrictlyUS,
  getPostedHistory,
  savePostedHistory,
  cleanApplyUrl,
  cleanCompanyName,
  TelegramConfig,
} from "@/lib/telegram";
import { recordPostsToExcel, JobPostRecord } from "@/lib/excel_logger";
import { syncToGoogleSheet } from "@/lib/google_sheet_logger";
import { appendSheetRows, getPostedSlugs, SheetJobRow } from "@/lib/sheet_backend";
import { Job } from "@/types/job";

// Max duration for Vercel Serverless
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const FREEHIRE_API = "https://freehire.me/api/v1/agent/jobs/search";

async function fetchDomainJobs(
  query: string,
  extraParams: Record<string, string>,
  history: Set<string>,
  limit = 3
): Promise<Job[]> {
  const url = new URL(FREEHIRE_API);
  url.searchParams.set("q", query);
  url.searchParams.set("countries", "us"); // strict US filter
  url.searchParams.set("limit", "25");
  url.searchParams.set("description_format", "markdown");

  for (const [k, v] of Object.entries(extraParams)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "JobHunger-Web-Poster/1.0",
    },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const json = await res.json();
  const rawJobs: Job[] = json.data || [];

  const validated: Job[] = [];
  for (const j of rawJobs) {
    if (!j.public_slug || history.has(j.public_slug)) continue;
    if (isStrictlyUS(j)) {
      validated.push(j);
      if (validated.length >= limit) break;
    }
  }

  return validated;
}

// Fast broadcast to a list of chats with safe 150ms pacing
async function sendToChatList(botToken: string, chatIds: string[], card: string): Promise<number> {
  let sentCount = 0;
  for (const chatId of chatIds) {
    if (!chatId) continue;
    try {
      const res = await sendTelegramMessage(botToken, chatId, card);
      if (res.ok) sentCount++;
    } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  return sentCount;
}

async function executeBroadcast(customConfig: Partial<TelegramConfig> = {}) {
  const botToken = customConfig.bot_token || DEFAULT_TELEGRAM_CONFIG.bot_token;
  const groups = {
    tech: customConfig.groups?.tech || DEFAULT_TELEGRAM_CONFIG.groups.tech,
    non_tech: customConfig.groups?.non_tech || DEFAULT_TELEGRAM_CONFIG.groups.non_tech,
    healthcare: customConfig.groups?.healthcare || DEFAULT_TELEGRAM_CONFIG.groups.healthcare,
  };

  const history = new Set([...getPostedSlugs(), ...getPostedHistory()]);
  const newlyPosted: string[] = [];
  const results: Array<{ domain: string; title: string; company: string; status: string; chatCount: number }> = [];
  const excelRecords: JobPostRecord[] = [];
  const sheetRows: SheetJobRow[] = [];

  const formatRecord = (job: Job, domain: "tech" | "non_tech" | "healthcare", sentCount: number, targets: string[]): JobPostRecord => {
    const enrichment = job.enrichment || {};
    const isRemote =
      (job.location || "").toLowerCase().includes("remote") ||
      (job.description || "").toLowerCase().includes("work_mode=remote");
    const workMode = isRemote ? "Remote" : "On-site / Hybrid";
    const empType = (enrichment.employment_type || "Full-Time").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    let salaryStr = "Competitive / Dependent on experience";
    if (enrichment.salary_min && enrichment.salary_max) {
      salaryStr = `$${enrichment.salary_min.toLocaleString()} - $${enrichment.salary_max.toLocaleString()}/${enrichment.salary_period || "year"}`;
    } else if (enrichment.salary_min) {
      salaryStr = `From $${enrichment.salary_min.toLocaleString()}/${enrichment.salary_period || "year"}`;
    }

    let expStr = "2+ Years";
    if (enrichment.experience_years_min) {
      expStr = `${enrichment.experience_years_min}+ Years`;
    } else if (enrichment.seniority) {
      expStr = `${enrichment.seniority.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Level`;
    }

    return {
      domain,
      title: job.title || "Open Position",
      company: cleanCompanyName(job.company),
      location: job.location || "United States",
      workMode,
      jobType: empType,
      salary: salaryStr,
      experience: expStr,
      applyUrl: cleanApplyUrl(job.url),
      chatCount: sentCount,
      chatIds: targets,
      status: sentCount > 0 ? "Success" : "Failed",
    };
  };

  const toSheetRow = (rec: JobPostRecord, slug: string): SheetJobRow => {
    const now = new Date();
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

    return {
      id: `jh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      slug,
      postedDate: istDate,
      postedTime: `${istTime} IST`,
      category: rec.domain,
      title: rec.title,
      company: rec.company,
      location: rec.location,
      workMode: rec.workMode,
      jobType: rec.jobType,
      salary: rec.salary,
      experience: rec.experience,
      applyUrl: rec.applyUrl,
      deliveredToCount: rec.chatCount,
      chatIds: rec.chatIds,
      status: rec.status,
    };
  };

  // 1. Fetch all domains in parallel for instant speed
  const [techJobs, nonTechJobs, healthJobs] = await Promise.all([
    fetchDomainJobs("Software Engineer", { is_tech: "tech" }, history, 3),
    fetchDomainJobs("Operations Coordinator", { is_tech: "non_tech" }, history, 3),
    fetchDomainJobs("Registered Nurse", { category: "healthcare" }, history, 3),
  ]);

  // 2. Broadcast Tech jobs
  for (const job of techJobs) {
    const card = formatTelegramCard(job, "tech");
    const sentCount = await sendToChatList(botToken, groups.tech, card);
    history.add(job.public_slug);
    newlyPosted.push(job.public_slug);
    results.push({
      domain: "tech",
      title: job.title,
      company: job.company,
      status: sentCount > 0 ? "success" : "failed",
      chatCount: sentCount,
    });
    const rec = formatRecord(job, "tech", sentCount, groups.tech);
    excelRecords.push(rec);
    sheetRows.push(toSheetRow(rec, job.public_slug));
  }

  // 3. Broadcast Non-Tech jobs
  for (const job of nonTechJobs) {
    const card = formatTelegramCard(job, "non_tech");
    const sentCount = await sendToChatList(botToken, groups.non_tech, card);
    history.add(job.public_slug);
    newlyPosted.push(job.public_slug);
    results.push({
      domain: "non_tech",
      title: job.title,
      company: job.company,
      status: sentCount > 0 ? "success" : "failed",
      chatCount: sentCount,
    });
    const rec = formatRecord(job, "non_tech", sentCount, groups.non_tech);
    excelRecords.push(rec);
    sheetRows.push(toSheetRow(rec, job.public_slug));
  }

  // 4. Broadcast Healthcare jobs
  for (const job of healthJobs) {
    const card = formatTelegramCard(job, "healthcare");
    const sentCount = await sendToChatList(botToken, groups.healthcare, card);
    history.add(job.public_slug);
    newlyPosted.push(job.public_slug);
    results.push({
      domain: "healthcare",
      title: job.title,
      company: job.company,
      status: sentCount > 0 ? "success" : "failed",
      chatCount: sentCount,
    });
    const rec = formatRecord(job, "healthcare", sentCount, groups.healthcare);
    excelRecords.push(rec);
    sheetRows.push(toSheetRow(rec, job.public_slug));
  }

  // Append to backend sheet database directly
  appendSheetRows(sheetRows);
  savePostedHistory(newlyPosted);
  recordPostsToExcel(excelRecords);

  // Sync to Google Sheet if GOOGLE_SHEET_WEBHOOK_URL is configured
  try {
    await syncToGoogleSheet(excelRecords);
  } catch (sheetErr) {
    console.warn("Google Sheet sync warning:", sheetErr);
  }

  return {
    ok: true,
    message: `Successfully broadcasted ${results.filter((r) => r.status === "success").length} fresh U.S. positions!`,
    totalDelivered: results.reduce((acc, r) => acc + r.chatCount, 0),
    jobs: results,
  };
}

export async function POST(req: NextRequest) {
  try {
    let customConfig: Partial<TelegramConfig> = {};
    try {
      customConfig = await req.json();
    } catch {}

    const result = await executeBroadcast(customConfig);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Broadcast error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// Vercel Cron trigger at 8:40 PM IST (15:10 UTC)
export async function GET(req: NextRequest) {
  try {
    const result = await executeBroadcast();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Cron broadcast error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
