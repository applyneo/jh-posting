/**
 * JobHunger 24/7 Cloud Automated Telegram Poster
 * Runs via GitHub Actions Cron every day at 8:40 PM IST (15:10 UTC)
 */

const fs = require("fs");
const path = require("path");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8874114044:AAG90TZQB42JdZEH17Ngdeu1hJysQgwF4NU";

const GROUPS = {
  tech: [
    "-1004456666849", // USA Tech Jobs Channel
    "-1004428862449", // US JOBS IN IT Channel (@usjobsinit)
    "-1004318742358", // USA Tech Jobs Community Group
    "-1003882722879", // US JOBS AND OPT - IT DOMAIN (@usafulltimejobs)
  ],
  non_tech: [
    "-1004474267352", // USA Non-Tech Channel
    "-1004406851780", // US JOBS, H1B - FULL TIME JOBS (@nonitjobsinus)
    "-1004462814167", // USA Non-Tech Career Hub Group
    "-1004305785977", // US JOB OPORTUNITY - NON IT Group
  ],
  healthcare: [
    "-1004461057036", // USA Healthcare Channel
    "-1003942741539", // US JOBS MEDICAL DOMAIN, H1B (@usjobsjobs)
    "-1004475061975", // USA Healthcare Group
    "-1003899747167", // US IT JOBS - OPT - HEALTHCARE (@Jobhungerai)
  ],
};

const FREEHIRE_API = "https://freehire.me/api/v1/agent/jobs/search";

function cleanApplyUrl(url) {
  if (!url) return "https://jobhunger.ai";
  try {
    const parsed = new URL(url);
    for (const key of Array.from(parsed.searchParams.keys())) {
      const val = parsed.searchParams.get(key) || "";
      if (key.toLowerCase().includes("freehire") || val.toLowerCase().includes("freehire")) {
        parsed.searchParams.delete(key);
      }
    }
    return parsed.toString();
  } catch {
    return url.replace(/[?&]utm_source=freehire\.me(&|$)/g, "").replace(/\?$/, "");
  }
}

function cleanCompanyName(name) {
  if (!name) return "Confidential";
  let cleaned = name.replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "");
  cleaned = cleaned.replace(/^governmentjobs\.com\//i, "");
  cleaned = cleaned.replace(/-/g, " ");
  cleaned = cleaned.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  cleaned = cleaned.replace(/\bLlc\b/g, "LLC").replace(/\bPllc\b/g, "PLLC").replace(/\bInc\b/g, "Inc.");
  return cleaned.trim();
}

function isStrictlyUS(job) {
  if (job.countries && job.countries.length > 0 && !job.countries.includes("us")) return false;
  const loc = (job.location || "").toLowerCase();
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

function formatTelegramCard(job, category) {
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

  let salaryStr = "Competitive / Dependent on experience";
  const salMin = enrichment.salary_min;
  const salMax = enrichment.salary_max;
  const salPeriod = enrichment.salary_period || "year";

  if (salMin && salMax) {
    salaryStr = `$${salMin.toLocaleString()} – $${salMax.toLocaleString()}/${salPeriod}`;
  } else if (salMin) {
    salaryStr = `From $${salMin.toLocaleString()}/${salPeriod}`;
  } else if (salMax) {
    salaryStr = `Up to $${salMax.toLocaleString()}/${salPeriod}`;
  }

  let expStr = "2+ Years";
  if (enrichment.experience_years_min) {
    expStr = `${enrichment.experience_years_min}+ Years`;
  } else if (enrichment.seniority) {
    expStr = `${enrichment.seniority.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Level`;
  }

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

  const skills = job.skills || [];
  let skillsLines = "✅ Relevant Industry Experience\n✅ Strong Communication Skills\n✅ Problem-Solving & Execution\n✅ Team Collaboration";
  if (skills.length > 0) {
    skillsLines = skills
      .slice(0, 7)
      .map((s) => `✅ ${s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`)
      .join("\n");
  }

  const bullets = [];
  const desc = job.description || "";
  for (const line of desc.split("\n")) {
    const trimmed = line.trim();
    if ((trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) && trimmed.length > 10) {
      const cleanBullet = trimmed.replace(/^[-*•]\s*/, "").replace(/\*\*/g, "").replace(/\*/g, "").trim();
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

  let mandatoryNote = "";
  const lowerDesc = desc.toLowerCase();
  if (lowerDesc.includes("polygraph") || lowerDesc.includes("ts/sci") || lowerDesc.includes("top secret")) {
    mandatoryNote = "\n\n🔐 MANDATORY REQUIREMENT\nActive U.S. Security Clearance (TS/SCI or Secret with Polygraph).";
  } else if (title.toLowerCase().includes("registered nurse") || lowerDesc.includes("rn license")) {
    mandatoryNote = "\n\n🔐 MANDATORY REQUIREMENT\nActive State RN Licensure and BLS/CPR Certification.";
  }

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

async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
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
    return data.ok;
  } catch (err) {
    return false;
  }
}

async function fetchJobs(query, extraParams, history, limit = 3) {
  const url = new URL(FREEHIRE_API);
  url.searchParams.set("q", query);
  url.searchParams.set("countries", "us");
  url.searchParams.set("limit", "25");
  url.searchParams.set("description_format", "markdown");
  for (const [k, v] of Object.entries(extraParams)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": "JobHunger-Cloud-Runner/1.0" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const jobs = data.data || [];

  const valid = [];
  for (const j of jobs) {
    if (!j.public_slug || history.has(j.public_slug)) continue;
    if (isStrictlyUS(j)) {
      valid.push(j);
      if (valid.length >= limit) break;
    }
  }
  return valid;
}

async function main() {
  console.log("=================================================");
  console.log("    JOBHUNGER 24/7 CLOUD BROADCASTER EXECUTING   ");
  console.log(`    Time (UTC): ${new Date().toISOString()}`);
  console.log("=================================================");

  // Load history
  const historyPath = path.join(__dirname, "..", "data", "jobs_ledger.json");
  const legacyHistoryPath = path.join(__dirname, "..", "posted_history.json");
  const history = new Set();

  let ledgerRows = [];
  try {
    if (fs.existsSync(historyPath)) {
      ledgerRows = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
      ledgerRows.forEach(r => r.slug && history.add(r.slug));
    }
    if (fs.existsSync(legacyHistoryPath)) {
      const raw = JSON.parse(fs.readFileSync(legacyHistoryPath, "utf-8"));
      raw.forEach(s => history.add(s));
    }
  } catch {}

  console.log(`Existing history loaded: ${history.size} positions.`);

  // Fetch 3 domains in parallel
  console.log("Fetching fresh U.S. positions across domains...");
  const [techJobs, nonTechJobs, healthJobs] = await Promise.all([
    fetchJobs("Software Engineer", { is_tech: "tech" }, history, 3),
    fetchJobs("Operations Coordinator", { is_tech: "non_tech" }, history, 3),
    fetchJobs("Registered Nurse", { category: "healthcare" }, history, 3),
  ]);

  console.log(`Found: ${techJobs.length} Tech, ${nonTechJobs.length} Non-Tech, ${healthJobs.length} Healthcare.`);

  const now = new Date();
  const istDate = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const istTime = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(now);

  const newRows = [];
  let totalDelivered = 0;

  async function postDomain(domainKey, jobs) {
    const targets = GROUPS[domainKey] || [];
    for (const job of jobs) {
      const card = formatTelegramCard(job, domainKey);
      let sentCount = 0;
      for (const chatId of targets) {
        const ok = await sendTelegramMessage(chatId, card);
        if (ok) {
          sentCount++;
          totalDelivered++;
        }
        await new Promise(r => setTimeout(r, 150));
      }
      history.add(job.public_slug);
      console.log(`[${domainKey.toUpperCase()}] Posted "${job.title}" to ${sentCount}/${targets.length} chats.`);
      newRows.push({
        id: `jh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        slug: job.public_slug,
        postedDate: istDate,
        postedTime: `${istTime} IST`,
        category: domainKey,
        title: job.title,
        company: cleanCompanyName(job.company),
        location: job.location || "USA",
        workMode: (job.location || "").toLowerCase().includes("remote") ? "Remote" : "On-site / Hybrid",
        jobType: "Full-Time",
        salary: "Competitive",
        experience: "2+ Years",
        applyUrl: cleanApplyUrl(job.url),
        deliveredToCount: sentCount,
        chatIds: targets,
        status: sentCount > 0 ? "Success" : "Failed",
      });
    }
  }

  await postDomain("tech", techJobs);
  await postDomain("non_tech", nonTechJobs);
  await postDomain("healthcare", healthJobs);

  // Save updated ledger
  if (newRows.length > 0) {
    const updatedLedger = [...ledgerRows, ...newRows];
    try {
      fs.writeFileSync(historyPath, JSON.stringify(updatedLedger, null, 2), "utf-8");
      fs.writeFileSync(legacyHistoryPath, JSON.stringify(Array.from(history), null, 2), "utf-8");
      console.log(`Saved ${newRows.length} new records to backend ledger. Total records: ${updatedLedger.length}.`);
    } catch (e) {
      console.error("Ledger save error:", e);
    }
  }

  console.log(`\nDONE! Broadcasted ${newRows.length} jobs. Total Telegram deliveries: ${totalDelivered}.`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
