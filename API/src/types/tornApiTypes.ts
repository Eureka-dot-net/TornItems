/**
 * Torn API Response Type Definitions
 * These interfaces define the structure of responses from the Torn API v2
 */

/**
 * Response from /v2/user/bars endpoint
 */
export interface TornBarsResponse {
  bars: {
    energy: {
      current: number;
      maximum: number;
      increment: number;
      interval: number;
      tick_time: number;
      full_time: number;
    };
    happy: {
      current: number;
      maximum: number;
      increment: number;
      interval: number;
      tick_time: number;
      full_time: number;
    };
    nerve: {
      current: number;
      maximum: number;
      increment: number;
      interval: number;
      tick_time: number;
      full_time: number;
    };
    life: {
      current: number;
      maximum: number;
      increment: number;
      interval: number;
      tick_time: number;
      full_time: number;
    };
    chain: {
      id: number;
      current: number;
      max: number;
      timeout: number;
      modifier: number;
      cooldown: number;
      start: number;
      end: number;
    };
  };
}

/**
 * Response from /v2/user/battlestats endpoint
 */
export interface TornBattleStatsResponse {
  battlestats: {
    strength: {
      value: number;
      modifier: number;
      modifiers?: Array<{ effect: string; value: number; type: string }>;
    };
    defense: {
      value: number;
      modifier: number;
      modifiers?: Array<{ effect: string; value: number; type: string }>;
    };
    speed: {
      value: number;
      modifier: number;
      modifiers?: Array<{ effect: string; value: number; type: string }>;
    };
    dexterity: {
      value: number;
      modifier: number;
      modifiers?: Array<{ effect: string; value: number; type: string }>;
    };
    total: number;
  };
}

/**
 * Response from /v2/user?selections=perks endpoint
 */
export interface TornPerksResponse {
  faction_perks: string[];
  job_perks: string[];
  property_perks: string[];
  education_perks: string[];
  enhancer_perks: string[];
  book_perks: string[];
  stock_perks: string[];
  merit_perks: string[];
}

/**
 * Response from /v2/user?selections=gym endpoint
 */
export interface TornGymResponse {
  active_gym: number;
}

/**
 * Combined response from /v2/user?selections=battlestats,gym,perks
 */
export interface TornGymStatsResponse {
  active_gym: number;
  battlestats: {
    strength: {
      value: number;
      modifier: number;
      modifiers?: Array<{ effect: string; value: number; type: string }>;
    };
    defense: {
      value: number;
      modifier: number;
      modifiers?: Array<{ effect: string; value: number; type: string }>;
    };
    speed: {
      value: number;
      modifier: number;
      modifiers?: Array<{ effect: string; value: number; type: string }>;
    };
    dexterity: {
      value: number;
      modifier: number;
      modifiers?: Array<{ effect: string; value: number; type: string }>;
    };
    total: number;
  };
  faction_perks: string[];
  job_perks: string[];
  property_perks: string[];
  education_perks: string[];
  enhancer_perks: string[];
  book_perks: string[];
  stock_perks: string[];
  merit_perks: string[];
}

/**
 * Individual gym data from Torn API
 */
export interface TornGymData {
  name: string;
  stage: number;
  cost: number;
  energy: number;
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
  note: string;
}

/**
 * Response from /v2/torn?selections=gyms endpoint
 */
export interface TornGymsResponse {
  gyms: {
    [key: string]: TornGymData;
  };
}

/**
 * Travel status information
 */
export interface TravelStatus {
  destination: string;
  method: string;
  departed_at: number;
  arrival_at: number;
  time_left: number;
}

/**
 * Response from /v2/user/travel endpoint
 */
export interface TornTravelResponse {
  travel?: TravelStatus;
}

