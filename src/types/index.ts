import { PlanSlug } from '@/lib/constants';

// ============================================
// User / Profile
// ============================================
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  plan: PlanSlug;
  total_searches_used: number;
  google_sheets_token: GoogleSheetsToken | null;
  google_sheets_refresh_token: string | null;
  notion_access_token: string | null;
  notion_workspace_name: string | null;
  notion_token: string | null;
  notion_database_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleSheetsToken {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

// ============================================
// Search
// ============================================
export interface SearchRequest {
  businessType: string;
  city: string;
}

export interface Search {
  id: string;
  user_id: string;
  query_business_type: string;
  query_city: string;
  raw_query: string;
  total_results: number;
  no_website_count: number;
  created_at: string;
}

export interface SearchResult {
  id: string;
  search_id: string;
  user_id: string;
  google_place_id: string;
  business_name: string;
  business_type: string | null;
  formatted_address: string | null;
  phone_national: string | null;
  phone_international: string | null;
  has_website: boolean;
  website_url: string | null;
  google_maps_uri: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  user_rating_count: number | null;
  created_at: string;
}

// Resultat envoye au client (plan gratuit = placeholder pour les floutes)
export interface SearchResultClient extends SearchResult {
  is_blurred: boolean;
}

export interface SearchResponse {
  searchId: string;
  totalFound: number;
  noWebsiteCount: number;
  results: SearchResultClient[];
  blurredCount: number;
  withWebsiteResults: SearchResultClient[];
  withWebsiteCount: number;
}

// ============================================
// Google Places API
// ============================================
export interface GooglePlace {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  reviews?: GooglePlaceReview[];
  photos?: GooglePlacePhoto[];
  editorialSummary?: {
    text: string;
    languageCode: string;
  };
  businessStatus?: string;
}

export interface GooglePlaceReview {
  name: string;
  rating: number;
  text: {
    text: string;
    languageCode: string;
  };
  authorAttribution: {
    displayName: string;
  };
  publishTime: string;
  relativePublishTimeDescription: string;
}

export interface GooglePlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
  authorAttributions: Array<{
    displayName: string;
    uri: string;
  }>;
}

export interface TextSearchResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
}

// ============================================
// Exports
// ============================================
export type ExportDestination = 'google_sheets' | 'notion' | 'csv';

export interface Export {
  id: string;
  user_id: string;
  search_id: string;
  destination: ExportDestination;
  destination_url: string | null;
  result_count: number;
  status: 'pending' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
}

// ============================================
// Subscription
// ============================================
export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  price_id: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Email Draft (Ultra)
// ============================================
export interface EmailDraft {
  id: string;
  user_id: string;
  search_result_id: string;
  subject: string;
  body: string;
  created_at: string;
}

// ============================================
// Call Analysis (Agence)
// ============================================
export interface CallAnalysisResult {
  summary: string;
  score_call: number;
  score_prospect: number;
  talk_ratio: { salesperson: number; prospect: number };
  questions_asked: number;
  filler_words: { count: number; words: string[] };
  what_went_well: string[];
  what_went_wrong: string[];
  objections: string[];
  objections_handled: string[];
  interest_signals: string[];
  communication_style: string;
  top_3_improvements: string[];
  next_step: string;
  model_reformulations: { original: string; better: string; context: string }[];
  bant: { budget: boolean; authority: boolean; need: boolean; timing: boolean };
  sentiment_timeline: { start: string; middle: string; end: string };
  follow_up_email: string;
  missed_opportunities: string[];
  key_topics: string[];
}

export interface CallAnalysis {
  id: string;
  user_id: string;
  audio_url: string | null;
  duration_seconds: number | null;
  prospect_name: string | null;
  prospect_company: string | null;
  transcript: string | null;
  analysis: CallAnalysisResult | null;
  status: 'processing' | 'done' | 'error';
  error_message: string | null;
  created_at: string;
}
