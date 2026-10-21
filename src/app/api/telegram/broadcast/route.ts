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
import { Job } from "@/types/job";

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

export async function POST(req: NextRequest) {
  try {
    let customConfig: Partial<TelegramConfig> = {};
    try {
      customConfig = await req.json();
    } catch {
      // no custom body provided
    }

    const botToken = customConfig.bot_token || DEFAULT_TELEGRAM_CONFIG.bot_token;
    const groups = {
      tech: customConfig.groups?.tech || DEFAULT_TELEGRAM_CONFIG.groups.tech,
      non_tech: customConfig.groups?.non_tech || DEFAULT_TELEGRAM_CONFIG.groups.non_tech,
      healthcare: customConfig.groups?.healthcare || DEFAULT_TELEGRAM_CONFIG.groups.healthcare,
    };

    const history = getPostedHistory();
    const newlyPosted: string[] = [];
    const results: Array<{ domain: string; title: string; company: string; status: string; chatCount: number }> = [];
    const excelRecords: JobPostRecord[] = [];

    // Helper to extract clean fields for Excel
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

    // 1. Tech jobs
    const techJobs = await fetchDomainJobs(
      "Software Engineer",
      { is_tech: "tech" },
      history,
      3
    );

    for (const job of techJobs) {
      const card = formatTelegramCard(job, "tech");
      let sentCount = 0;
      for (const chatId of groups.tech) {
        if (!chatId) continue;
        const res = await sendTelegramMessage(botToken, chatId, card);
        if (res.ok) sentCount++;
        await new Promise((r) => setTimeout(r, 1000));
      }
      history.add(job.public_slug);
      newlyPosted.push(job.public_slug);
      results.push({
        domain: "tech",
        title: job.title,
        company: job.company,
        status: sentCount > 0 ? "success" : "failed",
        chatCount: sentCount,
      });
      excelRecords.push(formatRecord(job, "tech", sentCount, groups.tech));
    }

    // 2. Non-Tech jobs
    const nonTechJobs = await fetchDomainJobs(
      "Operations Coordinator",
      { is_tech: "non_tech" },
      history,
      3
    );

    for (const job of nonTechJobs) {
      const card = formatTelegramCard(job, "non_tech");
      let sentCount = 0;
      for (const chatId of groups.non_tech) {
        if (!chatId) continue;
        const res = await sendTelegramMessage(botToken, chatId, card);
        if (res.ok) sentCount++;
        await new Promise((r) => setTimeout(r, 1000));
      }
      history.add(job.public_slug);
      newlyPosted.push(job.public_slug);
      results.push({
        domain: "non_tech",
        title: job.title,
        company: job.company,
        status: sentCount > 0 ? "success" : "failed",
        chatCount: sentCount,
      });
      excelRecords.push(formatRecord(job, "non_tech", sentCount, groups.non_tech));
    }

    // 3. Healthcare jobs
    const healthJobs = await fetchDomainJobs(
      "Registered Nurse",
      { category: "healthcare" },
      history,
      3
    );

    for (const job of healthJobs) {
      const card = formatTelegramCard(job, "healthcare");
      let sentCount = 0;
      for (const chatId of groups.healthcare) {
        if (!chatId) continue;
        const res = await sendTelegramMessage(botToken, chatId, card);
        if (res.ok) sentCount++;
        await new Promise((r) => setTimeout(r, 1000));
      }
      history.add(job.public_slug);
      newlyPosted.push(job.public_slug);
      results.push({
        domain: "healthcare",
        title: job.title,
        company: job.company,
        status: sentCount > 0 ? "success" : "failed",
        chatCount: sentCount,
      });
      excelRecords.push(formatRecord(job, "healthcare", sentCount, groups.healthcare));
    }

    savePostedHistory(newlyPosted);
    recordPostsToExcel(excelRecords);

    // Sync to Google Sheet if GOOGLE_SHEET_WEBHOOK_URL is configured
    try {
      await syncToGoogleSheet(excelRecords);
    } catch (sheetErr) {
      console.warn("Google Sheet sync warning:", sheetErr);
    }

    return NextResponse.json({
      ok: true,
      message: `Successfully broadcasted ${results.filter((r) => r.status === "success").length} fresh U.S. positions!`,
      totalDelivered: results.reduce((acc, r) => acc + r.chatCount, 0),
      jobs: results,
    });
  } catch (err: any) {
    console.error("Broadcast error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// Vercel Cron trigger at 8:40 PM IST (15:10 UTC)
export async function GET(req: NextRequest) {
  return POST(req);
}
