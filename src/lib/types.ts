export type NeedCategory =
  | 'su'
  | 'yiyecek'
  | 'ilac'
  | 'ilkyardim'
  | 'barinак'
  | 'isik'
  | 'bebek'
  | 'tasima'
  | 'sarj'
  | 'kan'
  | 'enkaz'
  | 'giysi';

export interface NeedItem {
  id: NeedCategory;
  emoji: string;
  label: string;
  description: string;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface HelpRequest {
  id: string;
  type: 'need' | 'offer';
  needs: NeedCategory[];
  location: Location;
  note?: string;
  timestamp: number;
  matched?: boolean;
  contact?: string;
}

export interface MatchResult {
  helper: HelpRequest;
  distance: number;
  matchScore: number;
  matchReason: string;
}
