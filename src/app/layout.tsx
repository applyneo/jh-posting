import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreeHire Web — Search 3.6M+ Live ATS Job Postings",
  description:
    "Open-source live search engine for software engineers and tech talent. Filter live jobs across 300+ ATS platforms including Greenhouse, Lever, Workday, and Ashby.",
  keywords: [
    "freehire",
    "job search",
    "tech jobs",
    "remote software engineer",
    "ats job scraper",
    "greenhouse jobs",
    "lever jobs",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-300">
        {children}
      </body>
    </html>
  );
}
