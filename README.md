# FreeHire Web Portal

A high-performance, modern web application and live job portal connecting directly to the [FreeHire](https://freehire.me) ATS search engine API (aggregating over 3.6M+ live vacancies across Greenhouse, Lever, Workday, Ashby, and 300+ ATS feeds).

![FreeHire Web Preview](public/preview.png)

## Features

- **3.6M+ Live Job Postings:** Continuous live crawl across company applicant tracking systems.
- **Instant Search & Debounced Filtering:** Search by job title, skill tags, company name, or keywords.
- **Multi-Facet Filters:** Filter by Remote only, Role categories (Frontend, Backend, AI/ML, DevOps), Seniority, and Country.
- **Rich Markdown Job Descriptions:** Clean markdown rendering of responsibilities, requirements, and tech stacks.
- **Local Bookmarking:** Save favorite listings locally in browser storage for quick review.
- **Direct Application Links:** Bypasses third-party redirect traps and sends candidates directly to official ATS job forms.
- **Built for Vercel:** Zero-config serverless API routes that handle rate-limiting and bypass CORS restrictions.

---

## Local Development

1. **Install dependencies:**
   ```bash
   pnpm install
   # or: npm install
   ```

2. **Start the development server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build for production:**
   ```bash
   pnpm build
   ```

---

## Deploying to Vercel

### Option 1: Deploy with Vercel CLI

Run this command inside the `freehire-web` directory:

```bash
npx vercel
```

Follow the prompts to link to your Vercel account and deploy. For production:
```bash
npx vercel --prod
```

### Option 2: Deploy via GitHub / Vercel Dashboard

1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for FreeHire Web"
   ```
2. Push to your GitHub account:
   ```bash
   git remote add origin https://github.com/<your-username>/freehire-web.git
   git branch -M main
   git push -u origin main
   ```
3. Go to [vercel.com/new](https://vercel.com/new), import your repository, and click **Deploy**.
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (or `freehire-web` if part of a monorepo)
   - Zero environment variables required for public search!
