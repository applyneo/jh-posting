import { JobPostRecord } from "./excel_logger";

export interface GoogleSheetSyncResult {
  ok: boolean;
  message: string;
}

/**
 * Synchronize posted jobs to a live Google Sheet via Google Apps Script Webhook.
 * 
 * To set up Google Sheets:
 * 1. Open Google Sheets -> Extensions -> Apps Script
 * 2. Paste the snippet provided in instructions
 * 3. Deploy as Web App -> Access: Anyone
 * 4. Add GOOGLE_SHEET_WEBHOOK_URL in Vercel Environment Variables.
 */
export async function syncToGoogleSheet(
  records: JobPostRecord[],
  customWebhookUrl?: string
): Promise<GoogleSheetSyncResult> {
  const webhookUrl = customWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) {
    return { ok: false, message: "No GOOGLE_SHEET_WEBHOOK_URL configured" };
  }

  try {
    const payload = {
      action: "append_jobs",
      timestamp: new Date().toISOString(),
      jobs: records.map((r) => ({
        domain: r.domain,
        title: r.title,
        company: r.company,
        location: r.location,
        workMode: r.workMode,
        jobType: r.jobType,
        salary: r.salary,
        experience: r.experience,
        applyUrl: r.applyUrl,
        chatCount: r.chatCount,
        status: r.status,
      })),
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (res.ok) {
      return { ok: true, message: "Successfully synced to Google Sheet" };
    } else {
      return { ok: false, message: `Google Sheet webhook error: ${res.statusText}` };
    }
  } catch (err: any) {
    return { ok: false, message: err?.message || "Failed to call Google Sheet webhook" };
  }
}

/**
 * Fetch already posted job URLs / slugs from Google Sheet for 100% deduplication.
 */
export async function fetchSlugsFromGoogleSheet(customWebhookUrl?: string): Promise<string[]> {
  const webhookUrl = customWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return [];

  try {
    const res = await fetch(`${webhookUrl}?action=get_slugs`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.slugs) ? data.slugs : [];
  } catch {
    return [];
  }
}
