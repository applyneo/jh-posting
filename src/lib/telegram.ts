import { Job } from "@/types/job";
import fs from "fs";
import path from "path";

export interface TelegramConfig {
  bot_token: string;
  groups: {
    tech: string[];
    non_tech: string[];
    healthcare: string[];
  };
  contact: {
    phone: string;
    email: string;
  };
}

export const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  bot_token: process.env.TELEGRAM_BOT_TOKEN || "8874114044:AAG90TZQB42JdZEH17Ngdeu1hJysQgwF4NU",
  groups: {
    tech: ["-1004456666849", "-5336777738"],
    non_tech: ["-1004474267352", "-5460771499"],
    healthcare: ["-1004461057036", "-5508137058"],
  },
  contact: {
    phone: "8886883699",
    email: "info@jobhunger.ai",
  },
};

// Strict U.S. location validator: rejects India, overseas, and non-US listings
export function isStrictlyUS(job: Job): boolean {
  // If countries are present, US must be included
  if (job.countries && job.countries.length > 0 && !job.countries.includes("us")) {
    return false;
  }

  const loc = (job.location || "").toLowerCase();
  const desc = (job.description || "").toLowerCase();

  // Negative blacklist for non-US keywords
  const nonUSKeywords = [
    "india", "bangalore", "bengaluru", "hyderabad", "pune", "delhi", "noida",
    "gurugram", "gurgaon", "mumbai", "chennai", "kolkata", "ahmedabad", "karnataka",
    "maharashtra", "telangana", "tamil nadu", "philippines", "nigeria", "ukraine",
    "poland", "germany", "singapore", "australia"
  ];

  for (const kw of nonUSKeywords) {
    if (loc.includes(kw)) return false;
  }

  return true;
}

// Strip out any referral or tracking tags from freehire.me
export function cleanApplyUrl(url: string): string {
  if (!url) return "https://jobhunger.ai";
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("utm_source");
    parsed.searchParams.delete("utm_medium");
    parsed.searchParams.delete("utm_campaign");
    return parsed.toString();
  } catch {
    return url.replace(/[?&]utm_source=freehire\.me(&|$)/g, "").replace(/\?$/, "");
  }
}

// Format company name cleanly
export function cleanCompanyName(name?: string): string {
  if (!name) return "Confidential";
  let cleaned = name.replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "");
  cleaned = cleaned.replace(/^governmentjobs\.com\//i, "");
  cleaned = cleaned.replace(/-/g, " ");
  // Title case
  cleaned = cleaned.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  cleaned = cleaned.replace(/\bLlc\b/g, "LLC").replace(/\bPllc\b/g, "PLLC").replace(/\bInc\b/g, "Inc.");
  return cleaned.trim();
}

// Generate the exact broadcast post
export function formatTelegramCard(job: Job, category: "tech" | "non_tech" | "healthcare"): string {
  const title = (job.title || "Open Position").trim();
  const company = cleanCompanyName(job.company);
  const location = job.location || "United States";
  const applyUrl = cleanApplyUrl(job.url);

  const enrichment = job.enrichment || {};
  const isRemote =
    location.toLowerCase().includes("remote") ||
    (job.description || "").toLowerCase().includes("work_mode=remote");
  const workMode = isRemote ? "Remote" : "On-site / Hybrid";

  const empType = (enrichment.employment_type || "Full-Time")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Salary
  let salaryStr = "Competitive / Dependent on experience";
  const salMin = enrichment.salary_min;
  const salMax = enrichment.salary_max;
  const salCurr = enrichment.salary_currency || "USD";
  const salPeriod = enrichment.salary_period || "year";

  if (salMin && salMax) {
    salaryStr = `$${salMin.toLocaleString()} – $${salMax.toLocaleString()}/${salPeriod}`;
  } else if (salMin) {
    salaryStr = `From $${salMin.toLocaleString()}/${salPeriod}`;
  } else if (salMax) {
    salaryStr = `Up to $${salMax.toLocaleString()}/${salPeriod}`;
  }

  // Experience
  let expStr = "2+ Years";
  if (enrichment.experience_years_min) {
    expStr = `${enrichment.experience_years_min}+ Years`;
  } else if (enrichment.seniority) {
    expStr = `${enrichment.seniority.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Level`;
  }

  // Domain icons & headers
  let domainIcon = "💼";
  let skillHeader = "📋 KEY SKILLS";
  let categoryTag = "#NonTechJobs #Operations";

  if (category === "tech") {
    domainIcon = "💻";
    skillHeader = "💻 KEY SKILLS";
    categoryTag = "#TechJobs #SoftwareEngineer";
  } else if (category === "healthcare") {
    domainIcon = "🩺";
    skillHeader = "🩺 KEY SKILLS";
    categoryTag = "#HealthcareJobs #NursingJobs";
  }

  // Skills
  const skills = job.skills || [];
  let skillsLines = "✅ Relevant Industry Experience\n✅ Strong Communication Skills\n✅ Problem-Solving & Execution\n✅ Team Collaboration";
  if (skills.length > 0) {
    skillsLines = skills
      .slice(0, 7)
      .map((s) => `✅ ${s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`)
      .join("\n");
  }

  // Extract clean bullet points for ABOUT THE ROLE
  const bullets: string[] = [];
  const desc = job.description || "";
  for (const line of desc.split("\n")) {
    const trimmed = line.trim();
    if ((trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) && trimmed.length > 10) {
      const cleanBullet = trimmed
        .replace(/^[-*•]\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .trim();
      if (cleanBullet.length < 130 && !bullets.includes(cleanBullet)) {
        bullets.push(`🔹 ${cleanBullet}`);
      }
      if (bullets.length >= 4) break;
    }
  }

  if (bullets.length === 0) {
    if (enrichment.summary) {
      bullets.push(`🔹 ${enrichment.summary}`);
    } else {
      bullets.push(
        `🔹 Deliver high-impact results for ${company}`,
        `🔹 Collaborate cross-functionally to achieve business objectives`,
        `🔹 Uphold professional quality and industry best practices`
      );
    }
  }
  const roleBullets = bullets.join("\n");

  // Mandatory requirement / clearance check
  let mandatoryNote = "";
  const lowerDesc = desc ? desc.toLowerCase() : "";
  if (lowerDesc.includes("polygraph") || lowerDesc.includes("ts/sci") || lowerDesc.includes("top secret")) {
    mandatoryNote = "\n🔐 MANDATORY REQUIREMENT\nActive U.S. Security Clearance (TS/SCI or Secret with Polygraph).";
  } else if (title.toLowerCase().includes("registered nurse") || lowerDesc.includes("rn license")) {
    mandatoryNote = "\n🔐 MANDATORY REQUIREMENT\nActive State RN Licensure and BLS/CPR Certification.";
  }

  // Hashtags
  const cleanTitleWords = title.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/);
  const roleTag = cleanTitleWords.slice(0, 2).join("");
  const hashtags = `#Hiring #${roleTag} #USAJobs ${categoryTag} #JobHunger`;

  return `🇺🇸 🔥 NEW JOB OPENING — USA
${domainIcon} ${title.toUpperCase()}
🏢 Company: ${company}
📍 Location: ${location}
💼 Job Type: ${empType}
🏢 Work Mode: ${workMode}
💰 Salary: ${salaryStr}
🎯 Experience: ${expStr}
━━━━━━━━━━━━━━━━━━
${skillHeader}
${skillsLines}
━━━━━━━━━━━━━━━━━━
📋 ABOUT THE ROLE
Join ${company} to support mission-critical goals and drive excellence.
${roleBullets}${mandatoryNote}
━━━━━━━━━━━━━━━━━━
🎯 INTERESTED? APPLY NOW!
🔗 OFFICIAL APPLICATION LINK
👇 Apply here:
${applyUrl}
━━━━━━━━━━━━━━━━━━
🤝 NEED JOB ASSISTANCE?
🌐 Website: https://jobhunger.ai
📞 Contact: 8886883699
📧 Email: info@jobhunger.ai
🚀 Find your next opportunity with JobHunger!
${hashtags}`;
}

// Send a single message to a chat via Telegram Bot API
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  retries = 3
): Promise<{ ok: boolean; message?: string }> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          disable_web_page_preview: false,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        return { ok: true, message: "Sent successfully" };
      } else {
        if (attempt === retries) return { ok: false, message: data.description };
      }
    } catch (err: any) {
      if (attempt === retries) return { ok: false, message: err.message };
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { ok: false, message: "Max retries exceeded" };
}

// Deduplication store in memory or local file
let memoryHistory: Set<string> = new Set();

export function getPostedHistory(): Set<string> {
  const historyFile = path.join(process.cwd(), "posted_history.json");
  try {
    if (fs.existsSync(historyFile)) {
      const data = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
      data.forEach((s: string) => memoryHistory.add(s));
    }
  } catch {
    // serverless filesystem may be read-only or ephemeral
  }
  return memoryHistory;
}

export function savePostedHistory(newSlugs: string[]) {
  newSlugs.forEach((s) => memoryHistory.add(s));
  const historyFile = path.join(process.cwd(), "posted_history.json");
  try {
    fs.writeFileSync(historyFile, JSON.stringify(Array.from(memoryHistory), null, 2), "utf-8");
  } catch {
    // ephemeral environment fallback
  }
}
