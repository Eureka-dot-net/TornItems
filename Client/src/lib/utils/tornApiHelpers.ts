/**
 * Shared helper functions for fetching data directly from Torn API
 * This ensures we don't duplicate code across wizard and gym comparison
 */

export interface TornGymStatsResponse {
  active_gym: number;
  bars: {
    happy: {
      current: number;
      maximum: number;
      increment: number;
      interval: number;
      tick_time: number;
      full_time: number;
    };
    energy: {
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
  faction_perks?: string[];
  job_perks?: string[];
  property_perks?: string[];
  education_perks?: string[];
  enhancer_perks?: string[];
  book_perks?: string[];
  stock_perks?: string[];
  merit_perks?: string[];
}

export interface PerkPercentages {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

/**
 * Fetch gym stats directly from Torn API
 * Includes battlestats, active gym, and bars (for base happy)
 * Optionally includes perks if fetchPerks is true
 */
export async function fetchGymStatsFromTorn(apiKey: string, fetchPerks: boolean = false): Promise<TornGymStatsResponse> {
  const selections = fetchPerks 
    ? 'battlestats,gym,bars,perks' 
    : 'battlestats,gym,bars';
    
  const response = await fetch(
    `https://api.torn.com/v2/user?selections=${selections}&key=${encodeURIComponent(apiKey)}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch gym stats from Torn API');
  }
  
  return response.json();
}

/**
 * Calculate perk percentages from Torn API perks data
 * Perks are multiplicative: 5% + 2% = (1.05) * (1.02) = 1.071 = 7.1%
 */
export function calculatePerkPercentages(data: TornGymStatsResponse): PerkPercentages {
  const perkMultipliers = {
    strength: 1,
    speed: 1,
    defense: 1,
    dexterity: 1
  };
  
  // Include all perk sources EXCEPT merit_perks
  const allPerks = [
    ...(data.faction_perks || []),
    ...(data.property_perks || []),
    ...(data.education_perks || []),
    ...(data.book_perks || []),
    ...(data.stock_perks || []),
    ...(data.enhancer_perks || []),
    ...(data.job_perks || [])
  ];
  
  // Extract and apply gym perk percentages per stat (multiplicative)
  allPerks.forEach(perk => {
    // Match specific stat gym gains (e.g., "+ 5% strength gym gains")
    const strengthMatch = perk.match(/\+\s*(\d+)%\s+strength\s+gym gains?/i);
    const speedMatch = perk.match(/\+\s*(\d+)%\s+speed\s+gym gains?/i);
    const defenseMatch = perk.match(/\+\s*(\d+)%\s+defense\s+gym gains?/i);
    const dexterityMatch = perk.match(/\+\s*(\d+)%\s+dexterity\s+gym gains?/i);
    
    // Match general gym gains (e.g., "+ 2% gym gains")
    const generalMatch = perk.match(/\+\s*(\d+)%\s+gym gains?$/i);
    
    if (strengthMatch) {
      const perc = parseInt(strengthMatch[1], 10);
      perkMultipliers.strength *= (1 + perc / 100);
    }
    if (speedMatch) {
      const perc = parseInt(speedMatch[1], 10);
      perkMultipliers.speed *= (1 + perc / 100);
    }
    if (defenseMatch) {
      const perc = parseInt(defenseMatch[1], 10);
      perkMultipliers.defense *= (1 + perc / 100);
    }
    if (dexterityMatch) {
      const perc = parseInt(dexterityMatch[1], 10);
      perkMultipliers.dexterity *= (1 + perc / 100);
    }
    
    // General gym gains apply to all stats (multiplicatively)
    if (generalMatch) {
      const perc = parseInt(generalMatch[1], 10);
      const multiplier = 1 + perc / 100;
      perkMultipliers.strength *= multiplier;
      perkMultipliers.speed *= multiplier;
      perkMultipliers.defense *= multiplier;
      perkMultipliers.dexterity *= multiplier;
    }
  });
  
  // Convert multipliers to percentages for display
  // e.g., 1.071 becomes 7.1
  return {
    strength: (perkMultipliers.strength - 1) * 100,
    speed: (perkMultipliers.speed - 1) * 100,
    defense: (perkMultipliers.defense - 1) * 100,
    dexterity: (perkMultipliers.dexterity - 1) * 100
  };
}

export interface TornUserProfile {
  profile: {
    id: number;
    name: string;
    signed_up: number; // Unix timestamp
    // Other fields exist but we only need signed_up
  };
}

/**
 * Fetch user profile from Torn API to get the signed_up timestamp
 * This is used to limit date pickers to valid date ranges
 */
export async function fetchUserProfile(apiKey: string): Promise<TornUserProfile> {
  const response = await fetch(
    `https://api.torn.com/v2/user/profile?striptags=true&key=${encodeURIComponent(apiKey)}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch user profile from Torn API');
  }
  
  return response.json();
}
