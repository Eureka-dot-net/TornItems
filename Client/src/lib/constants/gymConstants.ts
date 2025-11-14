/**
 * Centralized constants for the Gym Comparison tool
 * This ensures values are defined only once and can be easily updated
 */

// Default quantities for various items
export const DEFAULT_CANDY_QUANTITY = 48;
export const DEFAULT_ENERGY_DRINK_QUANTITY = 12;
export const DEFAULT_FHC_QUANTITY = 4;
export const DEFAULT_EDVD_FREQUENCY_DAYS = 7;
export const DEFAULT_EDVD_DVDS = 1;

// Item IDs for candies
export const CANDY_ITEM_IDS = {
  HAPPY_25: 310,
  HAPPY_35: 36,
  HAPPY_75: 528,
  HAPPY_100: 529,
  HAPPY_150: 151,
} as const;

// Item IDs for energy drinks
export const ENERGY_ITEM_IDS = {
  ENERGY_5: 985,
  ENERGY_10: 986,
  ENERGY_15: 987,
  ENERGY_20: 530,
  ENERGY_25: 532,
  ENERGY_30: 533,
  FHC: 367, // Feathery Hotel Coupon - refills energy bar
} as const;

// Item IDs for other consumables
export const CONSUMABLE_ITEM_IDS = {
  DVD: 366,
  XANAX: 206,
  ECSTASY_EDVD: 196,
  ECSTASY_CANDY: 197,
} as const;

// Energy values for energy items
export const ENERGY_VALUES: Record<number, number> = {
  [ENERGY_ITEM_IDS.ENERGY_5]: 5,
  [ENERGY_ITEM_IDS.ENERGY_10]: 10,
  [ENERGY_ITEM_IDS.ENERGY_15]: 15,
  [ENERGY_ITEM_IDS.ENERGY_20]: 20,
  [ENERGY_ITEM_IDS.ENERGY_25]: 25,
  [ENERGY_ITEM_IDS.ENERGY_30]: 30,
  [ENERGY_ITEM_IDS.FHC]: 0, // Special case - refills energy bar
};

// Happy values for candy items
export const CANDY_HAPPINESS_VALUES: Record<number, number> = {
  [CANDY_ITEM_IDS.HAPPY_25]: 25,
  [CANDY_ITEM_IDS.HAPPY_35]: 35,
  [CANDY_ITEM_IDS.HAPPY_75]: 75,
  [CANDY_ITEM_IDS.HAPPY_100]: 100,
  [CANDY_ITEM_IDS.HAPPY_150]: 150,
};

// Chart colors for multiple comparison states
// First 10 colors are distinctly different to support better visual comparison
export const CHART_COLORS = [
  '#8884d8', // blue/purple (original)
  '#82ca9d', // green (original)
  '#ffc658', // yellow/orange (original)
  '#ff8042', // orange/red (original)
  '#ff4444', // bright red
  '#ff69b4', // hot pink
  '#9370db', // medium purple
  '#8b4513', // saddle brown
  '#a9a9a9', // dark gray
  '#f0f0f0', // light gray (high contrast with black background)
];

// Max number of comparison states allowed
export const MAX_COMPARISON_STATES = 999; // Effectively unlimited

// Default stat weights
export const DEFAULT_STAT_WEIGHTS = {
  strength: 1,
  speed: 1,
  defense: 1,
  dexterity: 1,
};

// Default perk percentages
export const DEFAULT_PERK_PERCS = {
  strength: 2,
  speed: 2,
  defense: 2,
  dexterity: 2,
};

// Energy constants
export const XANAX_ENERGY = 250;
export const MAX_ENERGY_DEFAULT = 150;
export const MAX_ENERGY_ALTERNATIVE = 100;

// Default happy value
export const DEFAULT_HAPPY = 5025;

// Default initial stats
export const DEFAULT_INITIAL_STATS = {
  strength: 1000,
  speed: 1000,
  defense: 1000,
  dexterity: 1000,
};

// Default simulation duration in months
export const DEFAULT_SIMULATION_MONTHS = 12;

// Default hours played per day
export const DEFAULT_HOURS_PER_DAY = 16;

// Default xanax per day
export const DEFAULT_XANAX_PER_DAY = 3;

// Company benefit types
export const COMPANY_BENEFIT_TYPES = {
  NONE: 'none',
  MUSIC_STORE: 'musicStore',
  CANDLE_SHOP: 'candleShop',
  FITNESS_CENTER: 'fitnessCenter',
} as const;

// Default candle shop stars
export const DEFAULT_CANDLE_SHOP_STARS = 10;

// Loss/Revive defaults
export const DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY = 1;
export const DEFAULT_LOSS_REVIVE_ENERGY_COST = 25;
export const DEFAULT_LOSS_REVIVE_DAYS_BETWEEN = 7;
export const DEFAULT_LOSS_REVIVE_PRICE = 10000000; // $10M default

// Island cost defaults
export const DEFAULT_ISLAND_COST_PER_DAY = 1000000; // $1M default (rent + staff)
