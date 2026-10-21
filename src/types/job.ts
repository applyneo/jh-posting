export interface JobEnrichment {
  category?: string;
  seniority?: string;
  employment_type?: string;
  posting_language?: string;
  summary?: string;
  requirements?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;
  experience_years_min?: number;
}

export interface JobReality {
  class: string; // "fresh", "stale", "likely-evergreen"
  age_days: number;
  repost_count: number;
  mass_posting_count: number;
  fake_freshness: boolean;
}

export interface Job {
  public_slug: string;
  source: string;
  url: string;
  title: string;
  company: string;
  company_slug?: string;
  location: string;
  description: string;
  countries?: string[];
  regions?: string[];
  skills?: string[];
  cities?: string[];
  is_tech?: string;
  posted_at?: string;
  created_at?: string;
  enrichment?: JobEnrichment;
  reality?: JobReality;
}

export interface SearchMeta {
  limit: number;
  offset: number;
  total: number;
}

export interface SearchResponse {
  data: Job[];
  meta: SearchMeta;
  error?: string;
}

export interface FacetCount {
  [key: string]: number;
}

export interface FacetsResponse {
  data: {
    category?: FacetCount;
    seniority?: FacetCount;
    countries?: FacetCount;
    regions?: FacetCount;
    skills?: FacetCount;
    employment_type?: FacetCount;
    work_mode?: FacetCount;
    [key: string]: any;
  };
  meta?: {
    total?: number;
  };
}
