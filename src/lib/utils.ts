import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================
// LinkedIn Sales Navigator URL builder
// =============================================
// Sales Nav's filter URL is NOT a JSON blob — it's a structured query in
// LinkedIn's internal list DSL:
//   ?query=(filters:List((type:CURRENT_TITLE,values:List((text:Freelancer,selectionType:INCLUDED)))),keywords:foo)
// Text-based facets (CURRENT_TITLE, PAST_TITLE, keywords) accept free text.
// ID-based facets (INDUSTRY, SENIORITY_LEVEL, COMPANY_HEADCOUNT, GEOGRAPHY)
// require LinkedIn's internal numeric IDs / URNs — passing display names
// silently fails. The maps below cover the values the app's filter builder
// exposes. If a filter stops applying after a LinkedIn update, the ID drift
// is almost certainly here.

const INDUSTRY_IDS: Record<string, string> = {
  // Primary values (used in the app's filter builder UI)
  'Technology': '96',
  'SaaS': '4',
  'FinTech': '43',
  'E-Commerce': '27',
  'Healthcare': '14',
  'Marketing & Advertising': '80',
  'Real Estate': '44',
  'Education': '69',
  'Consulting': '11',
  'Manufacturing': '135',
  'Retail': '27',
  'Media': '3131',
  'Legal': '10',
  'Legal Services': '10',
  'Construction': '48',
  // Aliases — common AI / LinkedIn variations that map to the same IDs
  'Information Technology and Services': '96',
  'Information Technology & Services': '96',
  'IT Services': '96',
  'Computer Software': '4',
  'Software': '4',
  'Financial Services': '43',
  'Finance': '43',
  'Banking': '41',
  'Hospital & Health Care': '14',
  'Health Care': '14',
  'Marketing and Advertising': '80',
  'Marketing': '80',
  'Advertising': '80',
  'Design': '36',
  'Graphic Design': '36',
  'Education Management': '69',
  'Higher Education': '68',
  'Management Consulting': '11',
  'Online Media': '3131',
  'Entertainment': '18',
  'Internet': '6',
  'Telecommunications': '8',
  'Insurance': '42',
  'Automotive': '53',
  'Food & Beverages': '34',
  'Hospitality': '31',
  'Human Resources': '137',
  'Staffing and Recruiting': '104',
  'Logistics and Supply Chain': '150',
  'Non-profit': '13',
  'Government': '75',
  'Pharmaceuticals': '15',
  'Biotechnology': '12',
  'Mechanical or Industrial Engineering': '135',
  'Civil Engineering': '51',
  'Architecture & Planning': '107',
};

const SENIORITY_IDS: Record<string, string> = {
  // Primary values (used in the app's filter builder UI)
  'Individual Contributor': '4',
  'Manager': '5',
  'Director': '6',
  'VP': '7',
  'C-Suite': '8',
  'Partner': '9',
  'Owner': '10',
  // Aliases — common AI variations
  'CXO': '8',
  'C-Level': '8',
  'Executive': '8',
  'CEO': '8',
  'CTO': '8',
  'CFO': '8',
  'COO': '8',
  'CMO': '8',
  'Vice President': '7',
  'Senior': '4',
  'Entry': '3',
  'Entry Level': '3',
  'Intern': '1',
  'Training': '2',
  'Founder': '10',
  'Co-Founder': '10',
};

const COMPANY_HEADCOUNT_IDS: Record<string, string> = {
  '1-10': 'A',
  '11-50': 'B',
  '51-200': 'C',
  '201-500': 'D',
  '501-1000': 'E',
  '1001-5000': 'F',
  '5001-10000': 'G',
  '10000+': 'H',
};

// Commas and parens are structural in the Sales Nav query DSL.
// Strip them from text values so they can't break the parse.
function sanitizeText(v: string): string {
  return v.replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim();
}

type SalesNavFilter = {
  jobTitles?: string[];
  industries?: string[];
  companySize?: string[];
  locations?: string[];
  seniorityLevels?: string[];
  keywords?: string[];
};

function buildQueryClauses(filter: SalesNavFilter): string[] {
  const clauses: string[] = [];

  const textClause = (type: string, values: string[]) =>
    `(type:${type},values:List(${values
      .map((v) => `(text:${sanitizeText(v)},selectionType:INCLUDED)`)
      .join(',')}))`;

  const idClause = (type: string, ids: string[]) =>
    `(type:${type},values:List(${ids
      .map((id) => `(id:${id},selectionType:INCLUDED)`)
      .join(',')}))`;

  if (filter.jobTitles?.length) {
    clauses.push(textClause('CURRENT_TITLE', filter.jobTitles));
  }

  if (filter.industries?.length) {
    const ids = filter.industries.map((i) => INDUSTRY_IDS[i]).filter(Boolean);
    if (ids.length) clauses.push(idClause('INDUSTRY', ids));
  }

  if (filter.seniorityLevels?.length) {
    const ids = filter.seniorityLevels.map((s) => SENIORITY_IDS[s]).filter(Boolean);
    if (ids.length) clauses.push(idClause('SENIORITY_LEVEL', ids));
  }

  if (filter.companySize?.length) {
    const ids = filter.companySize.map((s) => COMPANY_HEADCOUNT_IDS[s]).filter(Boolean);
    if (ids.length) clauses.push(idClause('COMPANY_HEADCOUNT', ids));
  }

  return clauses;
}

export function buildSalesNavURL(filter: SalesNavFilter): string {
  const base = 'https://www.linkedin.com/sales/search/people';
  const clauses = buildQueryClauses(filter);

  const parts: string[] = [];
  if (clauses.length) parts.push(`filters:List(${clauses.join(',')})`);
  if (filter.keywords?.length) {
    parts.push(`keywords:${sanitizeText(filter.keywords.join(' '))}`);
  }

  if (!parts.length) return base;

  const query = `(${parts.join(',')})`;
  return `${base}?query=${encodeURIComponent(query)}`;
}

// Placeholder strings that users (or the AI generator) sometimes submit
// verbatim instead of a real value. These break the Sales Nav URL silently.
const PLACEHOLDER_VALUES = new Set([
  'city, country',
  'city',
  'country',
  'location',
  'example',
  'placeholder',
  'your city',
  'your country',
  'n/a',
  'none',
  'tbd',
]);

export function isPlaceholderValue(v: string): boolean {
  const trimmed = v.trim().toLowerCase();
  if (!trimmed) return true;
  if (PLACEHOLDER_VALUES.has(trimmed)) return true;
  if (trimmed.startsWith('e.g.') || trimmed.startsWith('eg ')) return true;
  return false;
}

// Strips placeholder / empty strings from a tag array.
export function cleanTagList(values: string[] | undefined): string[] {
  if (!values) return [];
  return values.filter((v) => !isPlaceholderValue(v));
}

// Validates a filter before saving or opening in Sales Navigator.
// Returns an empty array when the filter is valid, otherwise a list of
// human-readable error messages.
export function validateFilter(filter: {
  name?: string;
  jobTitles?: string[];
  industries?: string[];
  companySize?: string[];
  locations?: string[];
  seniorityLevels?: string[];
  keywords?: string[];
}): string[] {
  const errors: string[] = [];

  if (!filter.name?.trim()) {
    errors.push('Give this filter a name.');
  }

  const hasCriterion =
    (filter.jobTitles?.length ?? 0) > 0 ||
    (filter.industries?.length ?? 0) > 0 ||
    (filter.seniorityLevels?.length ?? 0) > 0 ||
    (filter.companySize?.length ?? 0) > 0 ||
    (filter.keywords?.length ?? 0) > 0;

  if (!hasCriterion) {
    errors.push('Add at least one job title, industry, seniority, company size, or keyword.');
  }

  const badLocations = (filter.locations ?? []).filter(isPlaceholderValue);
  if (badLocations.length) {
    errors.push(`Location "${badLocations[0]}" looks like a placeholder — enter a real city or country.`);
  }

  return errors;
}

// Returns human-readable notes about filter fields that were dropped from the
// deep link because Sales Nav can't receive them via URL (unmapped industry,
// location, etc.). Callers can surface these as toasts.
export function getSalesNavFilterWarnings(filter: SalesNavFilter): string[] {
  const warnings: string[] = [];

  if (filter.industries?.length) {
    const unmapped = filter.industries.filter((i) => !INDUSTRY_IDS[i]);
    if (unmapped.length) {
      warnings.push(`Industry not recognized: ${unmapped.join(', ')}. Set it in Sales Nav.`);
    }
  }

  if (filter.seniorityLevels?.length) {
    const unmapped = filter.seniorityLevels.filter((s) => !SENIORITY_IDS[s]);
    if (unmapped.length) {
      warnings.push(`Seniority not recognized: ${unmapped.join(', ')}.`);
    }
  }

  if (filter.companySize?.length) {
    const unmapped = filter.companySize.filter((s) => !COMPANY_HEADCOUNT_IDS[s]);
    if (unmapped.length) {
      warnings.push(`Company size not recognized: ${unmapped.join(', ')}.`);
    }
  }

  if (filter.locations?.length) {
    warnings.push('Location deep-linking is not supported — set it in Sales Nav after opening.');
  }

  return warnings;
}

// LinkedIn's share URL truncates the text= param at ~1300 encoded chars.
// For short posts, include the text in the URL. For long posts, return the
// base composer URL — callers should copy to clipboard first and toast the user.
const LINKEDIN_TEXT_LIMIT = 700; // pre-encoding char limit (safe threshold)

export function buildLinkedInPostURL(content: string): string {
  const base = 'https://www.linkedin.com/feed/?shareActive=true';
  if (content.length <= LINKEDIN_TEXT_LIMIT) {
    return `${base}&text=${encodeURIComponent(content)}`;
  }
  return base;
}

export function isPostTooLongForURL(content: string): boolean {
  return content.length > LINKEDIN_TEXT_LIMIT;
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export const SENIORITY_LEVELS = [
  'Individual Contributor',
  'Manager',
  'Director',
  'VP',
  'C-Suite',
  'Owner',
  'Partner',
];

export const COMPANY_SIZES = [
  '1-10', '11-50', '51-200', '201-500',
  '501-1000', '1001-5000', '5001-10000', '10000+',
];

export const INDUSTRIES = [
  'Technology', 'SaaS', 'FinTech', 'E-Commerce', 'Healthcare',
  'Marketing & Advertising', 'Real Estate', 'Education', 'Consulting',
  'Manufacturing', 'Retail', 'Media', 'Legal', 'Construction',
];

export const TONES = [
  { value: 'professional', label: 'Professional', description: 'Formal, polished, trust-building' },
  { value: 'casual', label: 'Casual', description: 'Friendly, conversational, approachable' },
  { value: 'value-driven', label: 'Value-Driven', description: 'Lead with ROI and outcomes' },
  { value: 'problem-solving', label: 'Problem-Solving', description: 'Address their pain points directly' },
];
