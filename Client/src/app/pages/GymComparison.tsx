import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  simulateGymProgression,
  type Gym,
  type SimulationInputs,
  type CompanyBenefit,
  type SimulationResult,
  type StatWeights,
} from '../../lib/utils/gymProgressionCalculator';
import { useGymStats } from '../../lib/hooks/useGymStats';
import { useItemPrices } from '../../lib/hooks/useItemPrices';
import { formatCurrency, formatDaysToHumanReadable } from '../../lib/utils/gymHelpers';
import {
  CANDY_ITEM_IDS,
  ENERGY_ITEM_IDS,
  CONSUMABLE_ITEM_IDS,
  CHART_COLORS,
  MAX_COMPARISON_STATES,
  DEFAULT_STAT_WEIGHTS,
  DEFAULT_PERK_PERCS,
  DEFAULT_HAPPY,
  DEFAULT_INITIAL_STATS,
  DEFAULT_SIMULATION_MONTHS,
  DEFAULT_HOURS_PER_DAY,
  DEFAULT_XANAX_PER_DAY,
  COMPANY_BENEFIT_TYPES,
  DEFAULT_CANDLE_SHOP_STARS,
  DEFAULT_CANDY_QUANTITY,
  DEFAULT_ENERGY_DRINK_QUANTITY,
  DEFAULT_EDVD_FREQUENCY_DAYS,
  DEFAULT_EDVD_DVDS,
  MAX_ENERGY_DEFAULT,
  DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY,
  DEFAULT_LOSS_REVIVE_ENERGY_COST,
  DEFAULT_LOSS_REVIVE_DAYS_BETWEEN,
  DEFAULT_LOSS_REVIVE_PRICE,
} from '../../lib/constants/gymConstants';
import StatWeightsSection from '../components/gymComparison/StatWeightsSection';
import EnergySourcesSection from '../components/gymComparison/EnergySourcesSection';
import HappyPerksSection from '../components/gymComparison/HappyPerksSection';
import BenefitsEventsSection from '../components/gymComparison/BenefitsEventsSection';
import StatJumpsSection from '../components/gymComparison/StatJumpsSection';
import BuyMeXanaxCard from '../components/gymComparison/BuyMeXanaxCard';
import ReportProblemCard from '../components/gymComparison/ReportProblemCard';
import LoadSettingsButton from '../components/gymComparison/LoadSettingsButton';
import { exportGymComparisonData, type ExportData } from '../../lib/utils/exportHelpers';

// Hardcoded gym data
const GYMS: Gym[] = [
  { name: "premierfitness", displayName: "Premier Fitness", strength: 2, speed: 2, defense: 2, dexterity: 2, energyPerTrain: 5, costToUnlock: 10, energyToUnlock: 0 },
  { name: "averagejoes", displayName: "Average Joes", strength: 2.4, speed: 2.4, defense: 2.7, dexterity: 2.4, energyPerTrain: 5, costToUnlock: 100, energyToUnlock: 200 },
  { name: "woodysworkout", displayName: "Woody's Workout", strength: 2.7, speed: 3.2, defense: 3, dexterity: 2.7, energyPerTrain: 5, costToUnlock: 250, energyToUnlock: 700 },
  { name: "beachbods", displayName: "Beach Bods", strength: 3.2, speed: 3.2, defense: 3.2, dexterity: null, energyPerTrain: 5, costToUnlock: 500, energyToUnlock: 1700 },
  { name: "silvergym", displayName: "Silver Gym", strength: 3.4, speed: 3.6, defense: 3.4, dexterity: 3.2, energyPerTrain: 5, costToUnlock: 1000, energyToUnlock: 3700 },
  { name: "pourfemme", displayName: "Pour Femme", strength: 3.4, speed: 3.6, defense: 3.6, dexterity: 3.8, energyPerTrain: 5, costToUnlock: 2500, energyToUnlock: 6450 },
  { name: "daviesden", displayName: "Davies Den", strength: 3.7, speed: null, defense: 3.7, dexterity: 3.7, energyPerTrain: 5, costToUnlock: 5000, energyToUnlock: 9450 },
  { name: "globalgym", displayName: "Global Gym", strength: 4, speed: 4, defense: 4, dexterity: 4, energyPerTrain: 5, costToUnlock: 10000, energyToUnlock: 12950 },
  { name: "knuckleheads", displayName: "Knuckle Heads", strength: 4.8, speed: 4.4, defense: 4, dexterity: 4.2, energyPerTrain: 10, costToUnlock: 50000, energyToUnlock: 16950 },
  { name: "pioneerfitness", displayName: "Pioneer Fitness", strength: 4.4, speed: 4.6, defense: 4.8, dexterity: 4.4, energyPerTrain: 10, costToUnlock: 100000, energyToUnlock: 22950 },
  { name: "anabolicanomalies", displayName: "Anabolic Anomalies", strength: 5, speed: 4.6, defense: 5.2, dexterity: 4.6, energyPerTrain: 10, costToUnlock: 250000, energyToUnlock: 29950 },
  { name: "core", displayName: "Core", strength: 5, speed: 5.2, defense: 5, dexterity: 5, energyPerTrain: 10, costToUnlock: 500000, energyToUnlock: 37950 },
  { name: "racingfitness", displayName: "Racing Fitness", strength: 5, speed: 5.4, defense: 4.8, dexterity: 5.2, energyPerTrain: 10, costToUnlock: 1000000, energyToUnlock: 48950 },
  { name: "completecardio", displayName: "Complete Cardio", strength: 5.5, speed: 5.7, defense: 5.5, dexterity: 5.2, energyPerTrain: 10, costToUnlock: 2000000, energyToUnlock: 61370 },
  { name: "legsbumsandtums", displayName: "Legs, Bums and Tums", strength: null, speed: 5.5, defense: 5.5, dexterity: 5.7, energyPerTrain: 10, costToUnlock: 3000000, energyToUnlock: 79370 },
  { name: "deepburn", displayName: "Deep Burn", strength: 6, speed: 6, defense: 6, dexterity: 6, energyPerTrain: 10, costToUnlock: 5000000, energyToUnlock: 97470 },
  { name: "apollogym", displayName: "Apollo Gym", strength: 6, speed: 6.2, defense: 6.4, dexterity: 6.2, energyPerTrain: 10, costToUnlock: 7500000, energyToUnlock: 121610 },
  { name: "gunshop", displayName: "Gun Shop", strength: 6.5, speed: 6.4, defense: 6.2, dexterity: 6.2, energyPerTrain: 10, costToUnlock: 10000000, energyToUnlock: 152870 },
  { name: "forcetraining", displayName: "Force Training", strength: 6.4, speed: 6.5, defense: 6.4, dexterity: 6.8, energyPerTrain: 10, costToUnlock: 15000000, energyToUnlock: 189480 },
  { name: "chachas", displayName: "Cha Cha's", strength: 6.4, speed: 6.4, defense: 6.8, dexterity: 7, energyPerTrain: 10, costToUnlock: 20000000, energyToUnlock: 236120 },
  { name: "atlas", displayName: "Atlas", strength: 7, speed: 6.4, defense: 6.4, dexterity: 6.5, energyPerTrain: 10, costToUnlock: 30000000, energyToUnlock: 292640 },
  { name: "lastround", displayName: "Last Round", strength: 6.8, speed: 6.5, defense: 7, dexterity: 6.5, energyPerTrain: 10, costToUnlock: 50000000, energyToUnlock: 360415 },
  { name: "theedge", displayName: "The Edge", strength: 6.8, speed: 7, defense: 7, dexterity: 6.8, energyPerTrain: 10, costToUnlock: 75000000, energyToUnlock: 444950 },
  { name: "georges", displayName: "George's", strength: 7.3, speed: 7.3, defense: 7.3, dexterity: 7.3, energyPerTrain: 10, costToUnlock: 100000000, energyToUnlock: 551255 },
  // Specialty gyms - unlocked when Cha Cha's is unlocked
  { 
    name: "balboasgym", 
    displayName: "Balboa's Gym", 
    strength: null, 
    speed: null, 
    defense: 7.5, 
    dexterity: 7.5, 
    energyPerTrain: 25, 
    costToUnlock: 50000000, 
    energyToUnlock: 236120, // Same as Cha Cha's
    specialtyRequirement: (stats) => {
      // Defense + Dexterity must be 25% higher than Strength + Speed
      const defDex = stats.defense + stats.dexterity;
      const strSpd = stats.strength + stats.speed;
      return defDex >= strSpd * 1.25;
    }
  },
  { 
    name: "frontlinefitness", 
    displayName: "Frontline Fitness", 
    strength: 7.5, 
    speed: 7.5, 
    defense: null, 
    dexterity: null, 
    energyPerTrain: 25, 
    costToUnlock: 50000000, 
    energyToUnlock: 236120, // Same as Cha Cha's
    specialtyRequirement: (stats) => {
      // Strength + Speed must be 25% higher than Dexterity + Defense
      const strSpd = stats.strength + stats.speed;
      const defDex = stats.defense + stats.dexterity;
      return strSpd >= defDex * 1.25;
    }
  },
  // Specialty gyms - unlocked when George's is unlocked
  { 
    name: "gym3000", 
    displayName: "Gym 3000", 
    strength: 8.0, 
    speed: null, 
    defense: null, 
    dexterity: null, 
    energyPerTrain: 50, 
    costToUnlock: 100000000, 
    energyToUnlock: 551255, // Same as George's
    specialtyRequirement: (stats) => {
      // Strength must be 25% higher than second highest stat
      const sortedStats = [stats.speed, stats.defense, stats.dexterity].sort((a, b) => b - a);
      const secondHighest = sortedStats[0];
      return stats.strength >= secondHighest * 1.25;
    }
  },
  { 
    name: "mrisoyamas", 
    displayName: "Mr. Isoyama's", 
    strength: null, 
    speed: null, 
    defense: 8.0, 
    dexterity: null, 
    energyPerTrain: 50, 
    costToUnlock: 100000000, 
    energyToUnlock: 551255, // Same as George's
    specialtyRequirement: (stats) => {
      // Defense must be 25% higher than second highest stat
      const sortedStats = [stats.strength, stats.speed, stats.dexterity].sort((a, b) => b - a);
      const secondHighest = sortedStats[0];
      return stats.defense >= secondHighest * 1.25;
    }
  },
  { 
    name: "totalrebound", 
    displayName: "Total Rebound", 
    strength: null, 
    speed: 8.0, 
    defense: null, 
    dexterity: null, 
    energyPerTrain: 50, 
    costToUnlock: 100000000, 
    energyToUnlock: 551255, // Same as George's
    specialtyRequirement: (stats) => {
      // Speed must be 25% higher than second highest stat
      const sortedStats = [stats.strength, stats.defense, stats.dexterity].sort((a, b) => b - a);
      const secondHighest = sortedStats[0];
      return stats.speed >= secondHighest * 1.25;
    }
  },
  { 
    name: "elites", 
    displayName: "Elites", 
    strength: null, 
    speed: null, 
    defense: null, 
    dexterity: 8.0, 
    energyPerTrain: 50, 
    costToUnlock: 100000000, 
    energyToUnlock: 551255, // Same as George's
    specialtyRequirement: (stats) => {
      // Dexterity must be 25% higher than second highest stat
      const sortedStats = [stats.strength, stats.speed, stats.defense].sort((a, b) => b - a);
      const secondHighest = sortedStats[0];
      return stats.dexterity >= secondHighest * 1.25;
    }
  },
];

// Comparison state interface
interface ComparisonState {
  id: string;
  name: string;
  statWeights: { strength: number; speed: number; defense: number; dexterity: number };
  hoursPlayedPerDay: number;
  xanaxPerDay: number;
  hasPointsRefill: boolean;
  maxEnergy: number; // 150 or 100
  perkPercs: { strength: number; speed: number; defense: number; dexterity: number };
  edvdJumpEnabled: boolean;
  edvdJumpFrequency: number;
  edvdJumpDvds: number;
  edvdJumpLimit: 'indefinite' | 'count' | 'stat';
  edvdJumpCount: number; // Used when edvdJumpLimit is 'count'
  edvdJumpStatTarget: number; // Used when edvdJumpLimit is 'stat' - now per individual stat
  edvdJumpAdultNovelties: boolean; // If true, double happiness from DVDs (10★ Adult Novelties)
  candyJumpEnabled: boolean;
  candyJumpItemId: number; // Item ID: 310 (25 happy), 36 (35 happy), 528 (75 happy), 529 (100 happy), 151 (150 happy)
  candyJumpUseEcstasy: boolean; // If true, use ecstasy to double happiness after candy
  candyJumpQuantity: number; // Number of candies used per day (default 48)
  candyJumpFactionBenefit: number; // % increase in happiness from chocolate faction benefits
  energyJumpEnabled: boolean;
  energyJumpItemId: number; // Item ID: 985 (5 energy), 986 (10 energy), 987 (15 energy), 530 (20 energy), 532 (25 energy), 533 (30 energy), 357 (FHC)
  energyJumpQuantity: number; // Number of energy items used per day (default 12 for drinks, 4 for FHC)
  energyJumpFactionBenefit: number; // % increase in energy from faction benefits
  lossReviveEnabled: boolean;
  lossReviveNumberPerDay: number; // Number of losses/revives per day
  lossReviveEnergyCost: number; // Energy cost per loss/revive (default 25)
  lossReviveDaysBetween: number; // Days between loss/revive events
  lossRevivePricePerLoss: number; // Price paid per loss/revive (income)
  diabetesDayEnabled: boolean;
  diabetesDayNumberOfJumps: 1 | 2;
  diabetesDayFHC: 0 | 1 | 2;
  diabetesDayGreenEgg: 0 | 1 | 2;
  diabetesDaySeasonalMail: boolean;
  diabetesDayLogoClick: boolean;
  companyBenefitKey: string;
  candleShopStars: number;
  happy: number;
  daysSkippedPerMonth: number;
}

// Get company benefit - keeps Music Store and Fitness Center unchanged
const getCompanyBenefit = (benefitKey: string, candleShopStars: number): CompanyBenefit => {
  switch (benefitKey) {
    case COMPANY_BENEFIT_TYPES.NONE:
      return {
        name: 'No Benefits',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
    case COMPANY_BENEFIT_TYPES.MUSIC_STORE:
      return {
        name: '3★ Music Store',
        gymUnlockSpeedMultiplier: 1.3, // 30% faster (unchanged)
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
    case COMPANY_BENEFIT_TYPES.CANDLE_SHOP:
      return {
        name: `${candleShopStars}★ Candle Shop`,
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: candleShopStars * 5, // 5 energy per star
        gymGainMultiplier: 1.0,
      };
    case COMPANY_BENEFIT_TYPES.FITNESS_CENTER:
      return {
        name: '10★ Fitness Center',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.03, // 3% gym gains (unchanged)
      };
    default:
      return {
        name: 'No Benefits',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
  }
};

// Preset stat weight formulas
type StatType = 'strength' | 'speed' | 'defense' | 'dexterity';

// Hank's Ratio presets - focuses on one high stat (using 50e gym) and two medium stats (using 25e gym)
const getHanksRatio = (primaryStat: StatType): StatWeights => {
  // Based on the description, if defense is high (100m), the ratios are:
  // Str: 80m (27.78%), Def: 100m (34.72%), Spd: 80m (27.78%), Dex: 28m (9.72%)
  // These percentages are: 0.2778, 0.3472, 0.2778, 0.0972
  // Normalized to weights: 2.86, 3.57, 2.86, 1.00
  // Simplified to approximately: 2.86, 3.57, 2.86, 1
  
  if (primaryStat === 'defense') {
    return { strength: 2.86, speed: 2.86, defense: 3.57, dexterity: 1 };
  } else if (primaryStat === 'dexterity') {
    return { strength: 2.86, speed: 2.86, defense: 1, dexterity: 3.57 };
  } else if (primaryStat === 'strength') {
    return { strength: 3.57, speed: 1, defense: 2.86, dexterity: 2.86 };
  } else { // speed
    return { strength: 1, speed: 3.57, defense: 2.86, dexterity: 2.86 };
  }
};

// Baldr's Ratio presets - more balanced, focuses on two stats (one using 50e gym, one using 25e gym)
const getBaldrsRatio = (primaryStat: StatType): StatWeights => {
  // Based on the description, if strength is high (100m), the ratios are:
  // Str: 100m (30.86%), Def: 72m (22.22%), Spd: 80m (24.69%), Dex: 72m (22.22%)
  // These percentages are: 0.3086, 0.2222, 0.2469, 0.2222
  // Normalized to weights: 1.389, 1.000, 1.111, 1.000
  // Simplified to approximately: 1.39, 1, 1.11, 1
  
  if (primaryStat === 'strength') {
    return { strength: 1.39, speed: 1.11, defense: 1, dexterity: 1 };
  } else if (primaryStat === 'speed') {
    return { strength: 1.11, speed: 1.39, defense: 1, dexterity: 1 };
  } else if (primaryStat === 'defense') {
    return { strength: 1, speed: 1, defense: 1.39, dexterity: 1.11 };
  } else { // dexterity
    return { strength: 1, speed: 1, defense: 1.11, dexterity: 1.39 };
  }
};

// Dex or Def build - for dex and def only
// If Dex build: 1.25 dex, 0 def, 1 str, 1 spd
// If Def build: 1.25 def, 0 dex, 1 str, 1 spd
const getDefensiveBuildRatio = (primaryStat: 'defense' | 'dexterity'): StatWeights => {
  if (primaryStat === 'defense') {
    // 1/1/1.25/0 - high defense, no dexterity
    return { strength: 1, speed: 1, defense: 1.25, dexterity: 0 };
  } else {
    // 1/1/0/1.25 - high dexterity, no defense
    return { strength: 1, speed: 1, defense: 0, dexterity: 1.25 };
  }
};

export default function GymComparison() {
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymComparison_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Mode
  const [mode, setMode] = useState<'future' | 'manual'>(() => loadSavedValue('mode', 'future'));
  
  // Manual testing state
  const [manualEnergy, setManualEnergy] = useState<number>(() => loadSavedValue('manualEnergy', 1000));
  const [autoUpgradeGyms, setAutoUpgradeGyms] = useState<boolean>(() => loadSavedValue('autoUpgradeGyms', true));
  const [manualHappy, setManualHappy] = useState<number>(() => loadSavedValue('manualHappy', 5000));
  const [manualStatWeights, setManualStatWeights] = useState(() => 
    loadSavedValue('manualStatWeights', { strength: 1, speed: 1, defense: 1, dexterity: 1 })
  );
  const [manualCompanyBenefitKey, setManualCompanyBenefitKey] = useState<string>(() => loadSavedValue('manualCompanyBenefitKey', COMPANY_BENEFIT_TYPES.NONE));
  const [manualCandleShopStars, setManualCandleShopStars] = useState<number>(() => loadSavedValue('manualCandleShopStars', DEFAULT_CANDLE_SHOP_STARS));
  const [manualPerkPercs, setManualPerkPercs] = useState(() => 
    loadSavedValue('manualPerkPercs', { strength: 0, speed: 0, defense: 0, dexterity: 0 })
  );
  
  // Shared player stats
  const [apiKey, setApiKey] = useState<string>(() => loadSavedValue('apiKey', ''));
  const [initialStats, setInitialStats] = useState(() => 
    loadSavedValue('initialStats', DEFAULT_INITIAL_STATS)
  );
  const [currentGymIndex, setCurrentGymIndex] = useState<number>(() => loadSavedValue('currentGymIndex', 0));
  const [months, setMonths] = useState<number>(() => loadSavedValue('months', DEFAULT_SIMULATION_MONTHS));
  
  // Comparison states
  const [comparisonStates, setComparisonStates] = useState<ComparisonState[]>(() => 
    loadSavedValue('comparisonStates', [
      {
        id: '1',
        name: 'State 1',
        statWeights: DEFAULT_STAT_WEIGHTS,
        hoursPlayedPerDay: DEFAULT_HOURS_PER_DAY,
        xanaxPerDay: DEFAULT_XANAX_PER_DAY,
        hasPointsRefill: true,
        maxEnergy: MAX_ENERGY_DEFAULT,
        perkPercs: DEFAULT_PERK_PERCS,
        edvdJumpEnabled: false,
        edvdJumpFrequency: DEFAULT_EDVD_FREQUENCY_DAYS,
        edvdJumpDvds: DEFAULT_EDVD_DVDS,
        edvdJumpLimit: 'indefinite',
        edvdJumpCount: 10,
        edvdJumpStatTarget: 10000000,
        edvdJumpAdultNovelties: false,
        candyJumpEnabled: false,
        candyJumpItemId: CANDY_ITEM_IDS.HAPPY_25,
        candyJumpUseEcstasy: false,
        candyJumpQuantity: DEFAULT_CANDY_QUANTITY,
        candyJumpFactionBenefit: 0,
        energyJumpEnabled: false,
        energyJumpItemId: ENERGY_ITEM_IDS.ENERGY_5,
        energyJumpQuantity: DEFAULT_ENERGY_DRINK_QUANTITY,
        energyJumpFactionBenefit: 0,
        lossReviveEnabled: false,
        lossReviveNumberPerDay: DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY,
        lossReviveEnergyCost: DEFAULT_LOSS_REVIVE_ENERGY_COST,
        lossReviveDaysBetween: DEFAULT_LOSS_REVIVE_DAYS_BETWEEN,
        lossRevivePricePerLoss: DEFAULT_LOSS_REVIVE_PRICE,
        diabetesDayEnabled: false,
        diabetesDayNumberOfJumps: 1,
        diabetesDayFHC: 0,
        diabetesDayGreenEgg: 0,
        diabetesDaySeasonalMail: false,
        diabetesDayLogoClick: false,
        companyBenefitKey: COMPANY_BENEFIT_TYPES.NONE,
        candleShopStars: DEFAULT_CANDLE_SHOP_STARS,
        happy: DEFAULT_HAPPY,
        daysSkippedPerMonth: 0,
      },
    ])
  );
  
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [showCosts, setShowCosts] = useState<boolean>(() => loadSavedValue('showCosts', false));
  
  const { data: gymStatsData, isLoading: isLoadingGymStats, error: gymStatsError, refetch: refetchGymStats } = useGymStats(apiKey || null);
  
  // Fetch item prices for EDVD jumps, xanax, candy items, and energy items - only if costs should be shown
  const { data: itemPricesData } = useItemPrices(showCosts ? [
    CONSUMABLE_ITEM_IDS.DVD,
    CONSUMABLE_ITEM_IDS.XANAX,
    CONSUMABLE_ITEM_IDS.ECSTASY_EDVD,
    CONSUMABLE_ITEM_IDS.ECSTASY_CANDY,
    CANDY_ITEM_IDS.HAPPY_25,
    CANDY_ITEM_IDS.HAPPY_35,
    CANDY_ITEM_IDS.HAPPY_75,
    CANDY_ITEM_IDS.HAPPY_100,
    CANDY_ITEM_IDS.HAPPY_150,
    ENERGY_ITEM_IDS.ENERGY_5,
    ENERGY_ITEM_IDS.ENERGY_10,
    ENERGY_ITEM_IDS.ENERGY_15,
    ENERGY_ITEM_IDS.ENERGY_20,
    ENERGY_ITEM_IDS.ENERGY_25,
    ENERGY_ITEM_IDS.ENERGY_30,
    ENERGY_ITEM_IDS.FHC,
  ] : []);
  
  // Auto-populate stats when fetched
  useEffect(() => {
    if (gymStatsData) {
      setInitialStats({
        strength: gymStatsData.battlestats.strength,
        speed: gymStatsData.battlestats.speed,
        defense: gymStatsData.battlestats.defense,
        dexterity: gymStatsData.battlestats.dexterity,
      });
      setCurrentGymIndex(Math.max(0, gymStatsData.activeGym - 1));
      
      // Update manual mode perk percs
      setManualPerkPercs(gymStatsData.perkPercs);
      
      setComparisonStates((prev) => prev.map((state) => ({
        ...state,
        perkPercs: gymStatsData.perkPercs,
      })));
    }
  }, [gymStatsData]);
  
  useEffect(() => {
    if (gymStatsError) {
      setError(gymStatsError instanceof Error ? gymStatsError.message : 'Failed to fetch gym stats');
    }
  }, [gymStatsError]);
  
  // Save to localStorage
  useEffect(() => { localStorage.setItem('gymComparison_mode', JSON.stringify(mode)); setResults({}); }, [mode]);
  useEffect(() => { localStorage.setItem('gymComparison_showCosts', JSON.stringify(showCosts)); }, [showCosts]);
  useEffect(() => { localStorage.setItem('gymComparison_manualEnergy', JSON.stringify(manualEnergy)); }, [manualEnergy]);
  useEffect(() => { localStorage.setItem('gymComparison_autoUpgradeGyms', JSON.stringify(autoUpgradeGyms)); }, [autoUpgradeGyms]);
  useEffect(() => { localStorage.setItem('gymComparison_manualHappy', JSON.stringify(manualHappy)); }, [manualHappy]);
  useEffect(() => { localStorage.setItem('gymComparison_manualStatWeights', JSON.stringify(manualStatWeights)); }, [manualStatWeights]);
  useEffect(() => { localStorage.setItem('gymComparison_manualCompanyBenefitKey', JSON.stringify(manualCompanyBenefitKey)); }, [manualCompanyBenefitKey]);
  useEffect(() => { localStorage.setItem('gymComparison_manualCandleShopStars', JSON.stringify(manualCandleShopStars)); }, [manualCandleShopStars]);
  useEffect(() => { localStorage.setItem('gymComparison_manualPerkPercs', JSON.stringify(manualPerkPercs)); }, [manualPerkPercs]);
  useEffect(() => { localStorage.setItem('gymComparison_apiKey', JSON.stringify(apiKey)); }, [apiKey]);
  useEffect(() => { localStorage.setItem('gymComparison_initialStats', JSON.stringify(initialStats)); }, [initialStats]);
  useEffect(() => { localStorage.setItem('gymComparison_currentGymIndex', JSON.stringify(currentGymIndex)); }, [currentGymIndex]);
  useEffect(() => { localStorage.setItem('gymComparison_months', JSON.stringify(months)); }, [months]);
  useEffect(() => { localStorage.setItem('gymComparison_comparisonStates', JSON.stringify(comparisonStates)); }, [comparisonStates]);
  
  // Auto-simulate when data changes
  useEffect(() => {
    if (mode === 'future' && comparisonStates.length > 0) {
      handleSimulate();
    }
  }, [comparisonStates, initialStats, months, showCosts, itemPricesData]);
  
  useEffect(() => {
    if (mode === 'manual') {
      handleSimulate();
    }
  }, [manualEnergy, autoUpgradeGyms, manualHappy, initialStats, currentGymIndex, manualStatWeights, manualCompanyBenefitKey, manualCandleShopStars, manualPerkPercs, showCosts, itemPricesData]);
  
  const handleFetchStats = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }
    setError(null);
    const result = await refetchGymStats();
    
    // Force update the values even if they were manually changed
    if (result.isSuccess && result.data) {
      setInitialStats({
        strength: result.data.battlestats.strength,
        speed: result.data.battlestats.speed,
        defense: result.data.battlestats.defense,
        dexterity: result.data.battlestats.dexterity,
      });
      setCurrentGymIndex(Math.max(0, result.data.activeGym - 1));
      
      // Update manual mode perk percs
      setManualPerkPercs(result.data.perkPercs);
      
      setComparisonStates((prev) => prev.map((state) => ({
        ...state,
        perkPercs: result.data.perkPercs,
      })));
    }
  };
  
  const handleAddState = () => {
    if (comparisonStates.length >= MAX_COMPARISON_STATES) {
      setError(`Maximum ${MAX_COMPARISON_STATES} comparison states allowed`);
      return;
    }
    
    // Copy values from the current/last state
    const sourceState = comparisonStates[activeTabIndex] || comparisonStates[comparisonStates.length - 1];
    
    const newState: ComparisonState = {
      id: Date.now().toString(),
      name: `State ${comparisonStates.length + 1}`,
      statWeights: { ...sourceState.statWeights },
      hoursPlayedPerDay: sourceState.hoursPlayedPerDay,
      xanaxPerDay: sourceState.xanaxPerDay,
      hasPointsRefill: sourceState.hasPointsRefill,
      maxEnergy: sourceState.maxEnergy,
      perkPercs: { ...sourceState.perkPercs },
      edvdJumpEnabled: sourceState.edvdJumpEnabled,
      edvdJumpFrequency: sourceState.edvdJumpFrequency,
      edvdJumpDvds: sourceState.edvdJumpDvds,
      edvdJumpLimit: sourceState.edvdJumpLimit,
      edvdJumpCount: sourceState.edvdJumpCount,
      edvdJumpStatTarget: sourceState.edvdJumpStatTarget,
      edvdJumpAdultNovelties: sourceState.edvdJumpAdultNovelties,
      candyJumpEnabled: sourceState.candyJumpEnabled,
      candyJumpItemId: sourceState.candyJumpItemId,
      candyJumpUseEcstasy: sourceState.candyJumpUseEcstasy,
      candyJumpQuantity: sourceState.candyJumpQuantity,
      candyJumpFactionBenefit: sourceState.candyJumpFactionBenefit,
      energyJumpEnabled: sourceState.energyJumpEnabled,
      energyJumpItemId: sourceState.energyJumpItemId,
      energyJumpQuantity: sourceState.energyJumpQuantity,
      energyJumpFactionBenefit: sourceState.energyJumpFactionBenefit,
      lossReviveEnabled: sourceState.lossReviveEnabled,
      lossReviveNumberPerDay: sourceState.lossReviveNumberPerDay,
      lossReviveEnergyCost: sourceState.lossReviveEnergyCost,
      lossReviveDaysBetween: sourceState.lossReviveDaysBetween,
      lossRevivePricePerLoss: sourceState.lossRevivePricePerLoss,
      diabetesDayEnabled: sourceState.diabetesDayEnabled,
      diabetesDayNumberOfJumps: sourceState.diabetesDayNumberOfJumps,
      diabetesDayFHC: sourceState.diabetesDayFHC,
      diabetesDayGreenEgg: sourceState.diabetesDayGreenEgg,
      diabetesDaySeasonalMail: sourceState.diabetesDaySeasonalMail,
      diabetesDayLogoClick: sourceState.diabetesDayLogoClick,
      companyBenefitKey: sourceState.companyBenefitKey,
      candleShopStars: sourceState.candleShopStars,
      happy: sourceState.happy,
      daysSkippedPerMonth: sourceState.daysSkippedPerMonth,
    };
    
    setComparisonStates([...comparisonStates, newState]);
    setActiveTabIndex(comparisonStates.length);
  };
  
  const handleRemoveState = (stateId: string) => {
    if (comparisonStates.length <= 1) {
      setError('At least one comparison state is required');
      return;
    }
    
    setComparisonStates((prev) => prev.filter((s) => s.id !== stateId));
    if (activeTabIndex >= comparisonStates.length - 1) {
      setActiveTabIndex(Math.max(0, comparisonStates.length - 2));
    }
  };
  
  const updateState = (stateId: string, updates: Partial<ComparisonState>) => {
    setComparisonStates((prev) => prev.map((state) => 
      state.id === stateId ? { ...state, ...updates } : state
    ));
  };
  
  const handleSimulate = () => {
    setError(null);
    
    try {
      if (mode === 'manual') {
        const benefit = getCompanyBenefit(manualCompanyBenefitKey, manualCandleShopStars);
        const inputs: SimulationInputs = {
          statWeights: manualStatWeights,
          months: 0,
          xanaxPerDay: 0,
          hasPointsRefill: false,
          hoursPlayedPerDay: 0,
          companyBenefit: benefit,
          apiKey,
          initialStats,
          happy: manualHappy,
          perkPercs: manualPerkPercs,
          currentGymIndex: currentGymIndex,
          lockGym: !autoUpgradeGyms,
          manualEnergy,
        };
        
        const result = simulateGymProgression(GYMS, inputs);
        setResults({ manual: result });
      } else {
        const newResults: Record<string, SimulationResult> = {};
        
        for (const state of comparisonStates) {
          const benefit = getCompanyBenefit(state.companyBenefitKey, state.candleShopStars);
          
          const inputs: SimulationInputs = {
            statWeights: state.statWeights,
            months,
            xanaxPerDay: state.xanaxPerDay,
            hasPointsRefill: state.hasPointsRefill,
            hoursPlayedPerDay: state.hoursPlayedPerDay,
            maxEnergy: state.maxEnergy,
            companyBenefit: benefit,
            apiKey,
            initialStats,
            happy: state.happy, 
            perkPercs: state.perkPercs,
            currentGymIndex: currentGymIndex, // Start from current/selected gym and auto-upgrade
            lockGym: false, // Always use auto-upgrade in future mode to allow unlock speed multiplier to work
            edvdJump: state.edvdJumpEnabled ? {
              enabled: true,
              frequencyDays: state.edvdJumpFrequency,
              dvdsUsed: state.edvdJumpDvds,
              limit: state.edvdJumpLimit,
              count: state.edvdJumpCount,
              statTarget: state.edvdJumpStatTarget,
              adultNovelties: state.edvdJumpAdultNovelties,
            } : undefined,
            diabetesDay: state.diabetesDayEnabled ? {
              enabled: true,
              numberOfJumps: state.diabetesDayNumberOfJumps,
              featheryHotelCoupon: state.diabetesDayFHC,
              greenEgg: state.diabetesDayGreenEgg,
              seasonalMail: state.diabetesDaySeasonalMail,
              logoEnergyClick: state.diabetesDayLogoClick,
            } : undefined,
            candyJump: state.candyJumpEnabled ? {
              enabled: true,
              itemId: state.candyJumpItemId,
              useEcstasy: state.candyJumpUseEcstasy,
              quantity: state.candyJumpQuantity,
              factionBenefitPercent: state.candyJumpFactionBenefit,
            } : undefined,
            energyJump: state.energyJumpEnabled ? {
              enabled: true,
              itemId: state.energyJumpItemId,
              quantity: state.energyJumpQuantity,
              factionBenefitPercent: state.energyJumpFactionBenefit,
            } : undefined,
            lossRevive: state.lossReviveEnabled ? {
              enabled: true,
              numberPerDay: state.lossReviveNumberPerDay,
              energyCost: state.lossReviveEnergyCost,
              daysBetween: state.lossReviveDaysBetween,
              pricePerLoss: state.lossRevivePricePerLoss,
            } : undefined,
            daysSkippedPerMonth: state.daysSkippedPerMonth,
            itemPrices: (showCosts && itemPricesData) ? {
              dvdPrice: itemPricesData.prices[366],
              xanaxPrice: itemPricesData.prices[206],
              ecstasyPrice: itemPricesData.prices[196],
              candyEcstasyPrice: itemPricesData.prices[197],
              candyPrices: {
                310: itemPricesData.prices[310],
                36: itemPricesData.prices[36],
                528: itemPricesData.prices[528],
                529: itemPricesData.prices[529],
                151: itemPricesData.prices[151],
              },
              energyPrices: {
                985: itemPricesData.prices[985],
                986: itemPricesData.prices[986],
                987: itemPricesData.prices[987],
                530: itemPricesData.prices[530],
                532: itemPricesData.prices[532],
                533: itemPricesData.prices[533],
                357: itemPricesData.prices[357],
              },
            } : undefined,
          };
          
          const result = simulateGymProgression(GYMS, inputs);
          newResults[state.id] = result;
        }
        
        setResults(newResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };
  
  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { day: number }; name: string; value: number; color: string }> }) => {
    if (active && payload && payload.length) {
      const day = payload[0].payload.day;
      const timeStr = formatDaysToHumanReadable(day);
      
      return (
        <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.9)', border: '1px solid #555' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Time: {timeStr}
          </Typography>
          {payload.map((entry, index: number) => {
            // Find the state that matches this entry
            const state = comparisonStates.find(s => s.name === entry.name);
            const snapshot = state && results[state.id] ? 
              results[state.id].dailySnapshots.find(s => s.day === day) : null;
            
            return (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography variant="body2" style={{ color: entry.color }}>
                  {entry.name}: {entry.value?.toLocaleString()}
                </Typography>
                {snapshot && (
                  <>
                    <Typography variant="caption" sx={{ color: '#aaa', display: 'block', ml: 1 }}>
                      Gym: {snapshot.currentGym}
                    </Typography>
                    {showCosts && state && results[state.id] && itemPricesData && (
                      <>
                        {(() => {
                          const edvdCosts = results[state.id].edvdJumpCosts;
                          const xanaxCosts = results[state.id].xanaxCosts;
                          return (
                            <>
                              {edvdCosts && (
                                <Typography variant="caption" sx={{ color: '#ffa726', display: 'block', ml: 1 }}>
                                  EDVD: {formatCurrency(edvdCosts.totalCost)} ({edvdCosts.totalJumps} jumps)
                                </Typography>
                              )}
                              {xanaxCosts && (
                                <Typography variant="caption" sx={{ color: '#ffa726', display: 'block', ml: 1 }}>
                                  Xanax: {formatCurrency(xanaxCosts.totalCost)}
                                </Typography>
                              )}
                            </>
                          );
                        })()}
                      </>
                    )}
                  </>
                )}
              </Box>
            );
          })}
        </Paper>
      );
    }
    return null;
  };
  
  const chartData = mode === 'future' && Object.keys(results).length > 0 ? 
    (() => {
      // Add day 0 with initial stats
      const initialTotal = initialStats.strength + initialStats.speed + initialStats.defense + initialStats.dexterity;
      const day0: Record<string, number> = { day: 0 };
      for (const state of comparisonStates) {
        day0[state.name] = initialTotal;
      }
      
      // Map the rest of the days
      const restOfDays = results[Object.keys(results)[0]].dailySnapshots.map((_,index) => {
        const dataPoint: Record<string, number> = { 
          day: results[Object.keys(results)[0]].dailySnapshots[index].day 
        };
        
        for (const state of comparisonStates) {
          if (results[state.id] && results[state.id].dailySnapshots[index]) {
            const snapshot = results[state.id].dailySnapshots[index];
            if (snapshot && snapshot.strength !== undefined) {
              const totalStats = snapshot.strength + snapshot.speed + snapshot.defense + snapshot.dexterity;
              dataPoint[state.name] = totalStats;
            }
          }
        }
        
        return dataPoint;
      });
      
      return [day0, ...restOfDays];
    })() : [];
  
  const activeState = comparisonStates[activeTabIndex];
  
  // Function to get current settings for problem reporting
  const getCurrentSettings = () => {
    return {
      mode,
      apiKey: apiKey ? '***REDACTED***' : '', // Don't include actual API key
      initialStats,
      currentGymIndex,
      months,
      comparisonStates: comparisonStates.map(state => ({
        ...state,
        id: 'redacted', // Don't include internal IDs
      })),
      activeTabIndex,
      showCosts,
      manualEnergy: mode === 'manual' ? manualEnergy : undefined,
      autoUpgradeGyms: mode === 'manual' ? autoUpgradeGyms : undefined,
      manualHappy: mode === 'manual' ? manualHappy : undefined,
      manualStatWeights: mode === 'manual' ? manualStatWeights : undefined,
      manualCompanyBenefitKey: mode === 'manual' ? manualCompanyBenefitKey : undefined,
      manualCandleShopStars: mode === 'manual' ? manualCandleShopStars : undefined,
      manualPerkPercs: mode === 'manual' ? manualPerkPercs : undefined,
    };
  };

  // Function to load settings from a problem report
  const loadSettingsFromReport = (settings: Record<string, unknown>) => {
    try {
      // Load mode
      if (settings.mode === 'future' || settings.mode === 'manual') {
        setMode(settings.mode);
      }

      // Load initial stats
      if (settings.initialStats && typeof settings.initialStats === 'object') {
        const stats = settings.initialStats as Record<string, number>;
        if (stats.strength !== undefined && stats.speed !== undefined && 
            stats.defense !== undefined && stats.dexterity !== undefined) {
          setInitialStats({
            strength: stats.strength,
            speed: stats.speed,
            defense: stats.defense,
            dexterity: stats.dexterity,
          });
        }
      }

      // Load gym index
      if (typeof settings.currentGymIndex === 'number') {
        setCurrentGymIndex(settings.currentGymIndex);
      }

      // Load months
      if (typeof settings.months === 'number') {
        setMonths(settings.months);
      }

      // Load show costs
      if (typeof settings.showCosts === 'boolean') {
        setShowCosts(settings.showCosts);
      }

      // Load comparison states (future mode)
      if (Array.isArray(settings.comparisonStates) && settings.comparisonStates.length > 0) {
        const loadedStates = settings.comparisonStates.map((state: unknown, index: number) => {
          if (typeof state === 'object' && state !== null) {
            const s = state as Record<string, unknown>;
            return {
              id: Date.now().toString() + index, // Generate new IDs
              name: typeof s.name === 'string' ? s.name : `State ${index + 1}`,
              statWeights: typeof s.statWeights === 'object' ? s.statWeights as StatWeights : DEFAULT_STAT_WEIGHTS,
              hoursPlayedPerDay: typeof s.hoursPlayedPerDay === 'number' ? s.hoursPlayedPerDay : DEFAULT_HOURS_PER_DAY,
              xanaxPerDay: typeof s.xanaxPerDay === 'number' ? s.xanaxPerDay : DEFAULT_XANAX_PER_DAY,
              hasPointsRefill: typeof s.hasPointsRefill === 'boolean' ? s.hasPointsRefill : true,
              maxEnergy: typeof s.maxEnergy === 'number' ? s.maxEnergy : MAX_ENERGY_DEFAULT,
              perkPercs: (typeof s.perkPercs === 'object' && s.perkPercs !== null && 
                         'strength' in s.perkPercs && 'speed' in s.perkPercs && 
                         'defense' in s.perkPercs && 'dexterity' in s.perkPercs) 
                         ? s.perkPercs as { strength: number; speed: number; defense: number; dexterity: number } 
                         : DEFAULT_PERK_PERCS,
              edvdJumpEnabled: typeof s.edvdJumpEnabled === 'boolean' ? s.edvdJumpEnabled : false,
              edvdJumpFrequency: typeof s.edvdJumpFrequency === 'number' ? s.edvdJumpFrequency : DEFAULT_EDVD_FREQUENCY_DAYS,
              edvdJumpDvds: typeof s.edvdJumpDvds === 'number' ? s.edvdJumpDvds : DEFAULT_EDVD_DVDS,
              edvdJumpLimit: (s.edvdJumpLimit === 'indefinite' || s.edvdJumpLimit === 'count' || s.edvdJumpLimit === 'stat') ? s.edvdJumpLimit as 'indefinite' | 'count' | 'stat' : 'indefinite',
              edvdJumpCount: typeof s.edvdJumpCount === 'number' ? s.edvdJumpCount : 10,
              edvdJumpStatTarget: typeof s.edvdJumpStatTarget === 'number' ? s.edvdJumpStatTarget : 10000000,
              edvdJumpAdultNovelties: typeof s.edvdJumpAdultNovelties === 'boolean' ? s.edvdJumpAdultNovelties : false,
              candyJumpEnabled: typeof s.candyJumpEnabled === 'boolean' ? s.candyJumpEnabled : false,
              candyJumpItemId: typeof s.candyJumpItemId === 'number' ? s.candyJumpItemId : CANDY_ITEM_IDS.HAPPY_25,
              candyJumpUseEcstasy: typeof s.candyJumpUseEcstasy === 'boolean' ? s.candyJumpUseEcstasy : false,
              candyJumpQuantity: typeof s.candyJumpQuantity === 'number' ? s.candyJumpQuantity : DEFAULT_CANDY_QUANTITY,
              candyJumpFactionBenefit: typeof s.candyJumpFactionBenefit === 'number' ? s.candyJumpFactionBenefit : 0,
              energyJumpEnabled: typeof s.energyJumpEnabled === 'boolean' ? s.energyJumpEnabled : false,
              energyJumpItemId: typeof s.energyJumpItemId === 'number' ? s.energyJumpItemId : ENERGY_ITEM_IDS.ENERGY_5,
              energyJumpQuantity: typeof s.energyJumpQuantity === 'number' ? s.energyJumpQuantity : DEFAULT_ENERGY_DRINK_QUANTITY,
              energyJumpFactionBenefit: typeof s.energyJumpFactionBenefit === 'number' ? s.energyJumpFactionBenefit : 0,
              lossReviveEnabled: typeof s.lossReviveEnabled === 'boolean' ? s.lossReviveEnabled : false,
              lossReviveNumberPerDay: typeof s.lossReviveNumberPerDay === 'number' ? s.lossReviveNumberPerDay : DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY,
              lossReviveEnergyCost: typeof s.lossReviveEnergyCost === 'number' ? s.lossReviveEnergyCost : DEFAULT_LOSS_REVIVE_ENERGY_COST,
              lossReviveDaysBetween: typeof s.lossReviveDaysBetween === 'number' ? s.lossReviveDaysBetween : DEFAULT_LOSS_REVIVE_DAYS_BETWEEN,
              lossRevivePricePerLoss: typeof s.lossRevivePricePerLoss === 'number' ? s.lossRevivePricePerLoss : DEFAULT_LOSS_REVIVE_PRICE,
              diabetesDayEnabled: typeof s.diabetesDayEnabled === 'boolean' ? s.diabetesDayEnabled : false,
              diabetesDayNumberOfJumps: (s.diabetesDayNumberOfJumps === 1 || s.diabetesDayNumberOfJumps === 2) ? s.diabetesDayNumberOfJumps as 1 | 2 : 1,
              diabetesDayFHC: (s.diabetesDayFHC === 0 || s.diabetesDayFHC === 1 || s.diabetesDayFHC === 2) ? s.diabetesDayFHC as 0 | 1 | 2 : 0,
              diabetesDayGreenEgg: (s.diabetesDayGreenEgg === 0 || s.diabetesDayGreenEgg === 1 || s.diabetesDayGreenEgg === 2) ? s.diabetesDayGreenEgg as 0 | 1 | 2 : 0,
              diabetesDaySeasonalMail: typeof s.diabetesDaySeasonalMail === 'boolean' ? s.diabetesDaySeasonalMail : false,
              diabetesDayLogoClick: typeof s.diabetesDayLogoClick === 'boolean' ? s.diabetesDayLogoClick : false,
              companyBenefitKey: typeof s.companyBenefitKey === 'string' ? s.companyBenefitKey : COMPANY_BENEFIT_TYPES.NONE,
              candleShopStars: typeof s.candleShopStars === 'number' ? s.candleShopStars : DEFAULT_CANDLE_SHOP_STARS,
              happy: typeof s.happy === 'number' ? s.happy : DEFAULT_HAPPY,
              daysSkippedPerMonth: typeof s.daysSkippedPerMonth === 'number' ? s.daysSkippedPerMonth : 0,
            };
          }
          return {
            id: Date.now().toString() + index,
            name: `State ${index + 1}`,
            statWeights: DEFAULT_STAT_WEIGHTS,
            hoursPlayedPerDay: DEFAULT_HOURS_PER_DAY,
            xanaxPerDay: DEFAULT_XANAX_PER_DAY,
            hasPointsRefill: true,
            maxEnergy: MAX_ENERGY_DEFAULT,
            perkPercs: DEFAULT_PERK_PERCS,
            edvdJumpEnabled: false,
            edvdJumpFrequency: DEFAULT_EDVD_FREQUENCY_DAYS,
            edvdJumpDvds: DEFAULT_EDVD_DVDS,
            edvdJumpLimit: 'indefinite' as const,
            edvdJumpCount: 10,
            edvdJumpStatTarget: 10000000,
            edvdJumpAdultNovelties: false,
            candyJumpEnabled: false,
            candyJumpItemId: CANDY_ITEM_IDS.HAPPY_25,
            candyJumpUseEcstasy: false,
            candyJumpQuantity: DEFAULT_CANDY_QUANTITY,
            candyJumpFactionBenefit: 0,
            energyJumpEnabled: false,
            energyJumpItemId: ENERGY_ITEM_IDS.ENERGY_5,
            energyJumpQuantity: DEFAULT_ENERGY_DRINK_QUANTITY,
            energyJumpFactionBenefit: 0,
            lossReviveEnabled: false,
            lossReviveNumberPerDay: DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY,
            lossReviveEnergyCost: DEFAULT_LOSS_REVIVE_ENERGY_COST,
            lossReviveDaysBetween: DEFAULT_LOSS_REVIVE_DAYS_BETWEEN,
            lossRevivePricePerLoss: DEFAULT_LOSS_REVIVE_PRICE,
            diabetesDayEnabled: false,
            diabetesDayNumberOfJumps: 1 as const,
            diabetesDayFHC: 0 as const,
            diabetesDayGreenEgg: 0 as const,
            diabetesDaySeasonalMail: false,
            diabetesDayLogoClick: false,
            companyBenefitKey: COMPANY_BENEFIT_TYPES.NONE,
            candleShopStars: DEFAULT_CANDLE_SHOP_STARS,
            happy: DEFAULT_HAPPY,
            daysSkippedPerMonth: 0,
          };
        });
        setComparisonStates(loadedStates);
      }

      // Load manual mode settings
      if (settings.mode === 'manual') {
        if (typeof settings.manualEnergy === 'number') {
          setManualEnergy(settings.manualEnergy);
        }
        if (typeof settings.autoUpgradeGyms === 'boolean') {
          setAutoUpgradeGyms(settings.autoUpgradeGyms);
        }
        if (typeof settings.manualHappy === 'number') {
          setManualHappy(settings.manualHappy);
        }
        if (settings.manualStatWeights && typeof settings.manualStatWeights === 'object') {
          setManualStatWeights(settings.manualStatWeights as StatWeights);
        }
        if (typeof settings.manualCompanyBenefitKey === 'string') {
          setManualCompanyBenefitKey(settings.manualCompanyBenefitKey);
        }
        if (typeof settings.manualCandleShopStars === 'number') {
          setManualCandleShopStars(settings.manualCandleShopStars);
        }
        if (settings.manualPerkPercs && typeof settings.manualPerkPercs === 'object' &&
            'strength' in settings.manualPerkPercs && 'speed' in settings.manualPerkPercs && 
            'defense' in settings.manualPerkPercs && 'dexterity' in settings.manualPerkPercs) {
          setManualPerkPercs(settings.manualPerkPercs as { strength: number; speed: number; defense: number; dexterity: number });
        }
      }

      // Load active tab index
      if (typeof settings.activeTabIndex === 'number') {
        setActiveTabIndex(Math.min(settings.activeTabIndex, comparisonStates.length - 1));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setError('Failed to load settings from report. Please check the format and try again.');
    }
  };

  // Function to handle data export
  const handleExportData = () => {
    if (mode === 'future' && Object.keys(results).length > 0) {
      const exportData: ExportData = {
        comparisonStates: comparisonStates.map(state => {
          const result = results[state.id];
          if (!result) {
            return {
              name: state.name,
              finalStats: { strength: 0, speed: 0, defense: 0, dexterity: 0 },
              statGains: { strength: 0, speed: 0, defense: 0, dexterity: 0 },
            };
          }
          
          const statGains = {
            strength: result.finalStats.strength - initialStats.strength,
            speed: result.finalStats.speed - initialStats.speed,
            defense: result.finalStats.defense - initialStats.defense,
            dexterity: result.finalStats.dexterity - initialStats.dexterity,
          };
          
          const costs = (showCosts && itemPricesData) ? {
            edvd: result.edvdJumpCosts?.totalCost || 0,
            xanax: result.xanaxCosts?.totalCost || 0,
            candy: result.candyJumpCosts?.totalCost || 0,
            energy: result.energyJumpCosts?.totalCost || 0,
            lossReviveIncome: result.lossReviveIncome?.totalIncome || 0,
            total: (result.edvdJumpCosts?.totalCost || 0) + 
                   (result.xanaxCosts?.totalCost || 0) + 
                   (result.candyJumpCosts?.totalCost || 0) + 
                   (result.energyJumpCosts?.totalCost || 0) - 
                   (result.lossReviveIncome?.totalIncome || 0),
          } : undefined;
          
          return {
            name: state.name,
            finalStats: result.finalStats,
            statGains,
            dailySnapshots: result.dailySnapshots,
            costs,
          };
        }),
        initialStats,
        months,
      };
      
      exportGymComparisonData(exportData);
    }
  };
  
  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom>
        Gym Comparison Tool
      </Typography>
      
      <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
        Compare gym stat gains with different configurations
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button variant={mode === 'future' ? 'contained' : 'outlined'} onClick={() => setMode('future')}>
          Future Comparison
        </Button>
        <Button variant={mode === 'manual' ? 'contained' : 'outlined'} onClick={() => setMode('manual')}>
          Manual Testing
        </Button>
        <LoadSettingsButton onLoadSettings={loadSettingsFromReport} />
        {mode === 'future' && Object.keys(results).length > 0 && (
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={handleExportData}
          >
            Export Data
          </Button>
        )}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
          <FormControlLabel 
            control={<Switch checked={showCosts} onChange={(e) => setShowCosts(e.target.checked)} />} 
            label="Include Cost Estimates" 
          />
        </Box>
      </Box>

      {mode === 'future' && (
        <>
          {/* Player Stats - HORIZONTAL COMPACT LAYOUT */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Player Stats</Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Optional: Enter a Limited API Key to auto-fetch your stats, or fill them in manually below. Get one from{' '}
                  <a href="https://www.torn.com/preferences.php#tab=api" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                    Torn Settings → API Key
                  </a>
                </Alert>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="Torn API Key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <Button variant="outlined" onClick={handleFetchStats} disabled={isLoadingGymStats || !apiKey.trim()}>
                    {isLoadingGymStats ? <CircularProgress size={20} /> : 'Fetch'}
                  </Button>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, md: 1.5 }}>
                <TextField 
                  label="Strength" 
                  type="number" 
                  value={initialStats.strength ?? ''} 
                  onChange={(e) => setInitialStats({ ...initialStats, strength: e.target.value === '' ? 0 : Number(e.target.value) })} 
                  size="small" 
                  fullWidth
                  inputProps={{ step: 'any', min: 0 }} 
                />
              </Grid>
              <Grid size={{ xs: 6, md: 1.5 }}>
                <TextField 
                  label="Speed" 
                  type="number" 
                  value={initialStats.speed ?? ''} 
                  onChange={(e) => setInitialStats({ ...initialStats, speed: e.target.value === '' ? 0 : Number(e.target.value) })} 
                  size="small" 
                  fullWidth
                  inputProps={{ step: 'any', min: 0 }} 
                />
              </Grid>
              <Grid size={{ xs: 6, md: 1.5 }}>
                <TextField 
                  label="Defense" 
                  type="number" 
                  value={initialStats.defense ?? ''} 
                  onChange={(e) => setInitialStats({ ...initialStats, defense: e.target.value === '' ? 0 : Number(e.target.value) })} 
                  size="small" 
                  fullWidth
                  inputProps={{ step: 'any', min: 0 }} 
                />
              </Grid>
              <Grid size={{ xs: 6, md: 1.5 }}>
                <TextField 
                  label="Dexterity" 
                  type="number" 
                  value={initialStats.dexterity ?? ''} 
                  onChange={(e) => setInitialStats({ ...initialStats, dexterity: e.target.value === '' ? 0 : Number(e.target.value) })} 
                  size="small" 
                  fullWidth
                  inputProps={{ step: 'any', min: 0 }} 
                />
              </Grid>
              
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField 
                  label="Duration (months)" 
                  type="number" 
                  value={months ?? ''} 
                  onChange={(e) => setMonths(e.target.value === '' ? 1 : Math.max(1, Math.min(36, Number(e.target.value))))} 
                  size="small" 
                  fullWidth
                  inputProps={{ step: 'any' }} 
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Starting Gym</InputLabel>
                  <Select value={currentGymIndex} label="Starting Gym" onChange={(e) => setCurrentGymIndex(Number(e.target.value))}>
                    {GYMS.map((gym, index) => (
                      <MenuItem key={gym.name} value={index}>{gym.displayName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Comparison Selector BELOW Player Stats */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Select Comparison</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={handleAddState} disabled={comparisonStates.length >= 4}>
                Add Comparison
              </Button>
            </Box>
            
            <Tabs 
              value={activeTabIndex} 
              onChange={(_, newValue) => setActiveTabIndex(newValue)} 
              variant="scrollable" 
              scrollButtons="auto"
            >
              {comparisonStates.map((state) => (
                <Tab key={state.id} label={state.name} />
              ))}
            </Tabs>
          </Paper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Comparison Configuration - COLUMNS LAYOUT */}
          {activeState && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <TextField 
                  label="Comparison Name" 
                  value={activeState.name} 
                  onChange={(e) => updateState(activeState.id, { name: e.target.value })} 
                  size="small"
                  sx={{ width: 250 }}
                />
                {comparisonStates.length > 1 && (
                  <IconButton color="error" onClick={() => handleRemoveState(activeState.id)} size="small">
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              <Grid container spacing={2}>
                {/* Stat Weights Column */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <StatWeightsSection
                    statWeights={activeState.statWeights}
                    onUpdate={(updates) => {
                      if ('strength' in updates || 'speed' in updates || 'defense' in updates || 'dexterity' in updates) {
                        updateState(activeState.id, { statWeights: { ...activeState.statWeights, ...updates } });
                      }
                    }}
                    getHanksRatio={getHanksRatio}
                    getBaldrsRatio={getBaldrsRatio}
                    getDefensiveBuildRatio={getDefensiveBuildRatio}
                  />
                </Grid>

                {/* Energy Sources Column */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <EnergySourcesSection
                    maxEnergy={activeState.maxEnergy}
                    hoursPlayedPerDay={activeState.hoursPlayedPerDay}
                    xanaxPerDay={activeState.xanaxPerDay}
                    hasPointsRefill={activeState.hasPointsRefill}
                    daysSkippedPerMonth={activeState.daysSkippedPerMonth}
                    companyBenefit={getCompanyBenefit(activeState.companyBenefitKey, activeState.candleShopStars)}
                    onUpdate={(updates) => updateState(activeState.id, updates)}
                  />
                </Grid>

                {/* Happy & Perks Column */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <HappyPerksSection
                    happy={activeState.happy}
                    perkPercs={activeState.perkPercs}
                    onUpdate={(updates) => {
                      if ('happy' in updates) {
                        updateState(activeState.id, { happy: updates.happy });
                      }
                      if ('perkPercs' in updates) {
                        updateState(activeState.id, { perkPercs: { ...activeState.perkPercs, ...updates.perkPercs } });
                      }
                    }}
                  />
                </Grid>

                {/* Company Benefits & Special Events Column */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <BenefitsEventsSection
                    companyBenefitKey={activeState.companyBenefitKey}
                    candleShopStars={activeState.candleShopStars}
                    diabetesDayEnabled={activeState.diabetesDayEnabled}
                    diabetesDayNumberOfJumps={activeState.diabetesDayNumberOfJumps}
                    diabetesDayFHC={activeState.diabetesDayFHC}
                    diabetesDayGreenEgg={activeState.diabetesDayGreenEgg}
                    diabetesDaySeasonalMail={activeState.diabetesDaySeasonalMail}
                    diabetesDayLogoClick={activeState.diabetesDayLogoClick}
                    onUpdate={(updates) => updateState(activeState.id, updates)}
                  />
                </Grid>
              </Grid>

              {/* Stat Jumps Section */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Stat Jumps</Typography>
              <StatJumpsSection
                edvdJumpEnabled={activeState.edvdJumpEnabled}
                edvdJumpFrequency={activeState.edvdJumpFrequency}
                edvdJumpDvds={activeState.edvdJumpDvds}
                edvdJumpLimit={activeState.edvdJumpLimit}
                edvdJumpCount={activeState.edvdJumpCount}
                edvdJumpStatTarget={activeState.edvdJumpStatTarget}
                edvdJumpAdultNovelties={activeState.edvdJumpAdultNovelties}
                candyJumpEnabled={activeState.candyJumpEnabled}
                candyJumpItemId={activeState.candyJumpItemId}
                candyJumpUseEcstasy={activeState.candyJumpUseEcstasy}
                candyJumpQuantity={activeState.candyJumpQuantity}
                candyJumpFactionBenefit={activeState.candyJumpFactionBenefit}
                energyJumpEnabled={activeState.energyJumpEnabled}
                energyJumpItemId={activeState.energyJumpItemId}
                energyJumpQuantity={activeState.energyJumpQuantity}
                energyJumpFactionBenefit={activeState.energyJumpFactionBenefit}
                lossReviveEnabled={activeState.lossReviveEnabled}
                lossReviveNumberPerDay={activeState.lossReviveNumberPerDay}
                lossReviveEnergyCost={activeState.lossReviveEnergyCost}
                lossReviveDaysBetween={activeState.lossReviveDaysBetween}
                lossRevivePricePerLoss={activeState.lossRevivePricePerLoss}
                hasPointsRefill={activeState.hasPointsRefill}
                xanaxPerDay={activeState.xanaxPerDay}
                maxEnergy={activeState.maxEnergy}
                showCosts={showCosts}
                itemPricesData={itemPricesData}
                onUpdate={(updates) => updateState(activeState.id, updates)}
              />
            </Paper>
          )}

          {/* Results Section */}
          {Object.keys(results).length > 0 && (
            <>
              {(() => {
                const hasCostEstimate = showCosts && itemPricesData;
                const hasDDEstimate = comparisonStates.some(state => state.diabetesDayEnabled);
                const hasExtraCards = hasCostEstimate || hasDDEstimate;

                if (hasExtraCards) {
                  // Layout: Graph full width, then cards below in a row
                  return (
                    <>
                      {/* Graph - Full Width */}
                      <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Total Battle Stats Over Time</Typography>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
                            <YAxis label={{ value: 'Total Stats', angle: -90, position: 'insideLeft' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {comparisonStates.map((state, index) => (
                              <Line key={state.id} type="monotone" dataKey={state.name} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} dot={false} />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </Paper>

                      {/* Cards Row: Final Stats | Cost Estimate | DD Estimate */}
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        {/* Final Stats Comparison */}
                        <Grid size={{ xs: 12, lg: hasCostEstimate && hasDDEstimate ? 4 : hasCostEstimate || hasDDEstimate ? 6 : 12 }}>
                          <Paper sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Final Stats Comparison</Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Stat</TableCell>
                                    {comparisonStates.map((state, index) => (
                                      <TableCell 
                                        key={state.id} 
                                        align="right" 
                                        sx={{ 
                                          fontWeight: 'bold',
                                          color: CHART_COLORS[index % CHART_COLORS.length]
                                        }}
                                      >
                                        {state.name}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(['strength', 'speed', 'defense', 'dexterity'] as const).map((statName) => (
                                    <TableRow key={statName}>
                                      <TableCell sx={{ textTransform: 'capitalize' }}>{statName}</TableCell>
                                      {comparisonStates.map((state) => {
                                        const result = results[state.id];
                                        if (!result) return <TableCell key={state.id} align="right">-</TableCell>;
                                        const finalValue = result.finalStats[statName];
                                        const difference = finalValue - initialStats[statName];
                                        return (
                                          <TableCell key={state.id} align="right">
                                            <Box>
                                              <Typography variant="body2">
                                                {finalValue.toLocaleString()}
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: 'success.main', display: 'block' }}>
                                                +{difference.toLocaleString()}
                                              </Typography>
                                            </Box>
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                  ))}
                                  <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                    {comparisonStates.map((state) => {
                                      const result = results[state.id];
                                      if (!result) return <TableCell key={state.id} align="right">-</TableCell>;
                                      const total = result.finalStats.strength + result.finalStats.speed + 
                                                  result.finalStats.defense + result.finalStats.dexterity;
                                      return (
                                        <TableCell key={state.id} align="right" sx={{ fontWeight: 'bold' }}>
                                          {total.toLocaleString()}
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>Difference</TableCell>
                                    {comparisonStates.map((state) => {
                                      const result = results[state.id];
                                      if (!result) return <TableCell key={state.id} align="right">-</TableCell>;
                                      const totalGain = (result.finalStats.strength - initialStats.strength) + 
                                                      (result.finalStats.speed - initialStats.speed) + 
                                                      (result.finalStats.defense - initialStats.defense) + 
                                                      (result.finalStats.dexterity - initialStats.dexterity);
                                      return (
                                        <TableCell key={state.id} align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                          +{totalGain.toLocaleString()}
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Paper>
                        </Grid>

                        {/* Cost Estimate Card */}
                        {hasCostEstimate && (
                          <Grid size={{ xs: 12, lg: hasDDEstimate ? 4 : 6 }}>
                            <Paper sx={{ p: 2, height: '100%' }}>
                              <Typography variant="h6" gutterBottom>Cost Estimate</Typography>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Cost Type</TableCell>
                                      {comparisonStates.map((state, index) => (
                                        <TableCell 
                                          key={state.id} 
                                          align="right" 
                                          sx={{ 
                                            fontWeight: 'bold',
                                            color: CHART_COLORS[index % CHART_COLORS.length]
                                          }}
                                        >
                                          {state.name}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold' }}>EDVD Cost</TableCell>
                                      {comparisonStates.map((state) => {
                                        const result = results[state.id];
                                        if (!result || !result.edvdJumpCosts) {
                                          return <TableCell key={state.id} align="right">-</TableCell>;
                                        }
                                        
                                        return (
                                          <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem' }}>
                                            {formatCurrency(result.edvdJumpCosts.totalCost)}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Xanax Cost</TableCell>
                                      {comparisonStates.map((state) => {
                                        const result = results[state.id];
                                        if (!result || !result.xanaxCosts) {
                                          return <TableCell key={state.id} align="right">-</TableCell>;
                                        }
                                        
                                        return (
                                          <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem' }}>
                                            {formatCurrency(result.xanaxCosts.totalCost)}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Candy Cost</TableCell>
                                      {comparisonStates.map((state) => {
                                        const result = results[state.id];
                                        if (!result || !result.candyJumpCosts) {
                                          return <TableCell key={state.id} align="right">-</TableCell>;
                                        }
                                        
                                        return (
                                          <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem' }}>
                                            {formatCurrency(result.candyJumpCosts.totalCost)}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Energy Cost</TableCell>
                                      {comparisonStates.map((state) => {
                                        const result = results[state.id];
                                        if (!result || !result.energyJumpCosts) {
                                          return <TableCell key={state.id} align="right">-</TableCell>;
                                        }
                                        
                                        return (
                                          <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem' }}>
                                            {formatCurrency(result.energyJumpCosts.totalCost)}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>Loss/Revive Income</TableCell>
                                      {comparisonStates.map((state) => {
                                        const result = results[state.id];
                                        if (!result || !result.lossReviveIncome) {
                                          return <TableCell key={state.id} align="right">-</TableCell>;
                                        }
                                        
                                        return (
                                          <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem', color: 'success.main' }}>
                                            {formatCurrency(result.lossReviveIncome.totalIncome)}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                    <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Total Cost</TableCell>
                                      {comparisonStates.map((state) => {
                                        const result = results[state.id];
                                        if (!result) {
                                          return <TableCell key={state.id} align="right">-</TableCell>;
                                        }
                                        
                                        const edvdCost = result.edvdJumpCosts?.totalCost || 0;
                                        const xanaxCost = result.xanaxCosts?.totalCost || 0;
                                        const candyCost = result.candyJumpCosts?.totalCost || 0;
                                        const energyCost = result.energyJumpCosts?.totalCost || 0;
                                        const lossReviveIncome = result.lossReviveIncome?.totalIncome || 0;
                                        const totalCost = edvdCost + xanaxCost + candyCost + energyCost - lossReviveIncome;
                                        
                                        return (
                                          <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                                            {formatCurrency(totalCost)}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Cost per Day</TableCell>
                                      {comparisonStates.map((state) => {
                                        const result = results[state.id];
                                        if (!result) {
                                          return <TableCell key={state.id} align="right">-</TableCell>;
                                        }
                                        
                                        const edvdCost = result.edvdJumpCosts?.totalCost || 0;
                                        const xanaxCost = result.xanaxCosts?.totalCost || 0;
                                        const candyCost = result.candyJumpCosts?.totalCost || 0;
                                        const energyCost = result.energyJumpCosts?.totalCost || 0;
                                        const lossReviveIncome = result.lossReviveIncome?.totalIncome || 0;
                                        const totalCost = edvdCost + xanaxCost + candyCost + energyCost - lossReviveIncome;
                                        
                                        // Calculate total days from months
                                        const totalDays = months * 30;
                                        const pricePerDay = totalDays > 0 ? totalCost / totalDays : 0;
                                        
                                        return (
                                          <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem' }}>
                                            {pricePerDay > 0 ? formatCurrency(pricePerDay) : '-'}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Cost per Stat Gain</TableCell>
                                      {(() => {
                                        // Helper function to calculate total stat gain
                                        const calculateTotalGain = (result: SimulationResult) => {
                                          return (result.finalStats.strength - initialStats.strength) + 
                                                 (result.finalStats.speed - initialStats.speed) + 
                                                 (result.finalStats.defense - initialStats.defense) + 
                                                 (result.finalStats.dexterity - initialStats.dexterity);
                                        };
                                        
                                        // Calculate max gain across all states once for baseline determination
                                        const maxGain = Math.max(...comparisonStates.map(s => {
                                          const r = results[s.id];
                                          return r ? calculateTotalGain(r) : 0;
                                        }));
                                        
                                        // Determine appropriate baseline (1k, 10k, or 100k)
                                        let baseline = 1000;
                                        let baselineLabel = '1k';
                                        if (maxGain >= 100000) {
                                          baseline = 100000;
                                          baselineLabel = '100k';
                                        } else if (maxGain >= 10000) {
                                          baseline = 10000;
                                          baselineLabel = '10k';
                                        }
                                        
                                        return comparisonStates.map((state) => {
                                          const result = results[state.id];
                                          if (!result) {
                                            return <TableCell key={state.id} align="right">-</TableCell>;
                                          }
                                          
                                          const edvdCost = result.edvdJumpCosts?.totalCost || 0;
                                          const xanaxCost = result.xanaxCosts?.totalCost || 0;
                                          const candyCost = result.candyJumpCosts?.totalCost || 0;
                                          const energyCost = result.energyJumpCosts?.totalCost || 0;
                                          const lossReviveIncome = result.lossReviveIncome?.totalIncome || 0;
                                          const totalCost = edvdCost + xanaxCost + candyCost + energyCost - lossReviveIncome;
                                          const totalGain = calculateTotalGain(result);
                                          
                                          if (totalGain === 0) {
                                            return <TableCell key={state.id} align="right">-</TableCell>;
                                          }
                                          
                                          const costPerBaseline = (totalCost / totalGain) * baseline;
                                          
                                          return (
                                            <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem' }}>
                                              {formatCurrency(costPerBaseline)}/{baselineLabel}
                                            </TableCell>
                                          );
                                        });
                                      })()}
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Paper>
                          </Grid>
                        )}

                        {/* DD Estimate Card */}
                        {hasDDEstimate && (
                          <Grid size={{ xs: 12, lg: hasCostEstimate ? 4 : 6 }}>
                            <Paper sx={{ p: 2, height: '100%' }}>
                              <Typography variant="h6" gutterBottom>Diabetes Day Gains</Typography>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Stat</TableCell>
                                      {comparisonStates.filter(s => s.diabetesDayEnabled).map((state) => {
                                        const stateIndex = comparisonStates.indexOf(state);
                                        return (
                                          <TableCell 
                                            key={state.id} 
                                            align="right" 
                                            sx={{ 
                                              fontWeight: 'bold',
                                              color: CHART_COLORS[stateIndex % CHART_COLORS.length]
                                            }}
                                          >
                                            {state.name}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {(['strength', 'speed', 'defense', 'dexterity'] as const).map((statName) => (
                                      <TableRow key={statName}>
                                        <TableCell sx={{ textTransform: 'capitalize' }}>{statName}</TableCell>
                                        {comparisonStates.filter(s => s.diabetesDayEnabled).map((state) => {
                                          const result = results[state.id];
                                          if (!result || !result.diabetesDayTotalGains) {
                                            return <TableCell key={state.id} align="right">-</TableCell>;
                                          }
                                          return (
                                            <TableCell key={state.id} align="right">
                                              +{result.diabetesDayTotalGains[statName].toLocaleString()}
                                            </TableCell>
                                          );
                                        })}
                                      </TableRow>
                                    ))}
                                    <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                      {comparisonStates.filter(s => s.diabetesDayEnabled).map((state) => {
                                        const result = results[state.id];
                                        if (!result || !result.diabetesDayTotalGains) {
                                          return <TableCell key={state.id} align="right">-</TableCell>;
                                        }
                                        const ddGains = result.diabetesDayTotalGains;
                                        const totalGain = ddGains.strength + ddGains.speed + ddGains.defense + ddGains.dexterity;
                                        return (
                                          <TableCell key={state.id} align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                            +{totalGain.toLocaleString()}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Paper>
                          </Grid>
                        )}
                      </Grid>
                      
                      {/* eDVD Jump Gains Table - Full Width Row Below */}
                      {comparisonStates.some(state => state.edvdJumpEnabled) && (
                        <Paper sx={{ p: 2, mb: 3 }}>
                          <Typography variant="h6" gutterBottom>eDVD Jump Stat Gains</Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 'bold' }}>Stat</TableCell>
                                  {comparisonStates.filter(s => s.edvdJumpEnabled).map((state) => {
                                    const stateIndex = comparisonStates.indexOf(state);
                                    return (
                                      <TableCell 
                                        key={state.id} 
                                        align="right" 
                                        sx={{ 
                                          fontWeight: 'bold',
                                          color: CHART_COLORS[stateIndex % CHART_COLORS.length]
                                        }}
                                      >
                                        {state.name}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(['strength', 'speed', 'defense', 'dexterity'] as const).map((statName) => (
                                  <TableRow key={statName}>
                                    <TableCell sx={{ textTransform: 'capitalize' }}>{statName} (avg/jump)</TableCell>
                                    {comparisonStates.filter(s => s.edvdJumpEnabled).map((state) => {
                                      const result = results[state.id];
                                      if (!result || !result.edvdJumpGains) {
                                        return <TableCell key={state.id} align="right">-</TableCell>;
                                      }
                                      return (
                                        <TableCell key={state.id} align="right">
                                          +{Math.round(result.edvdJumpGains.averagePerJump[statName]).toLocaleString()}
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                ))}
                                <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
                                  <TableCell sx={{ fontWeight: 'bold' }}>Total (avg/jump)</TableCell>
                                  {comparisonStates.filter(s => s.edvdJumpEnabled).map((state) => {
                                    const result = results[state.id];
                                    if (!result || !result.edvdJumpGains) {
                                      return <TableCell key={state.id} align="right">-</TableCell>;
                                    }
                                    const avgGains = result.edvdJumpGains.averagePerJump;
                                    const totalAvg = avgGains.strength + avgGains.speed + avgGains.defense + avgGains.dexterity;
                                    return (
                                      <TableCell key={state.id} align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                        +{Math.round(totalAvg).toLocaleString()}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 'bold' }}>Total Jumps</TableCell>
                                  {comparisonStates.filter(s => s.edvdJumpEnabled).map((state) => {
                                    const result = results[state.id];
                                    if (!result || !result.edvdJumpCosts) {
                                      return <TableCell key={state.id} align="right">-</TableCell>;
                                    }
                                    return (
                                      <TableCell key={state.id} align="right">
                                        {result.edvdJumpCosts.totalJumps}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 'bold' }}>Total Gains</TableCell>
                                  {comparisonStates.filter(s => s.edvdJumpEnabled).map((state) => {
                                    const result = results[state.id];
                                    if (!result || !result.edvdJumpGains) {
                                      return <TableCell key={state.id} align="right">-</TableCell>;
                                    }
                                    const totalGains = result.edvdJumpGains.totalGains;
                                    const total = totalGains.strength + totalGains.speed + totalGains.defense + totalGains.dexterity;
                                    return (
                                      <TableCell key={state.id} align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                        +{Math.round(total).toLocaleString()}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Paper>
                      )}
                    </>
                  );
                } else {
                  // Original layout: Graph and Final Stats side by side
                  return (
                    <>
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid size={{ xs: 12, lg: 8 }}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="h6" gutterBottom>Total Battle Stats Over Time</Typography>
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
                              <YAxis label={{ value: 'Total Stats', angle: -90, position: 'insideLeft' }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend />
                              {comparisonStates.map((state, index) => (
                                <Line key={state.id} type="monotone" dataKey={state.name} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} dot={false} />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </Paper>
                      </Grid>

                      <Grid size={{ xs: 12, lg: 4 }}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                          <Typography variant="h6" gutterBottom>Final Stats Comparison</Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 'bold' }}>Stat</TableCell>
                                  {comparisonStates.map((state, index) => (
                                    <TableCell 
                                      key={state.id} 
                                      align="right" 
                                      sx={{ 
                                        fontWeight: 'bold',
                                        color: CHART_COLORS[index % CHART_COLORS.length]
                                      }}
                                    >
                                      {state.name}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(['strength', 'speed', 'defense', 'dexterity'] as const).map((statName) => (
                                  <TableRow key={statName}>
                                    <TableCell sx={{ textTransform: 'capitalize' }}>{statName}</TableCell>
                                    {comparisonStates.map((state) => {
                                      const result = results[state.id];
                                      if (!result) return <TableCell key={state.id} align="right">-</TableCell>;
                                      const finalValue = result.finalStats[statName];
                                      const difference = finalValue - initialStats[statName];
                                      return (
                                        <TableCell key={state.id} align="right">
                                          <Box>
                                            <Typography variant="body2">
                                              {finalValue.toLocaleString()}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'success.main', display: 'block' }}>
                                              +{difference.toLocaleString()}
                                            </Typography>
                                          </Box>
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                ))}
                                <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
                                  <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                  {comparisonStates.map((state) => {
                                    const result = results[state.id];
                                    if (!result) return <TableCell key={state.id} align="right">-</TableCell>;
                                    const total = result.finalStats.strength + result.finalStats.speed + 
                                                result.finalStats.defense + result.finalStats.dexterity;
                                    return (
                                      <TableCell key={state.id} align="right" sx={{ fontWeight: 'bold' }}>
                                        {total.toLocaleString()}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>Difference</TableCell>
                                  {comparisonStates.map((state) => {
                                    const result = results[state.id];
                                    if (!result) return <TableCell key={state.id} align="right">-</TableCell>;
                                    const totalGain = (result.finalStats.strength - initialStats.strength) + 
                                                    (result.finalStats.speed - initialStats.speed) + 
                                                    (result.finalStats.defense - initialStats.defense) + 
                                                    (result.finalStats.dexterity - initialStats.dexterity);
                                    return (
                                      <TableCell key={state.id} align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                        +{totalGain.toLocaleString()}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Paper>
                      </Grid>
                    </Grid>
                    
                    {/* eDVD Jump Gains Table - Full Width Below */}
                    {comparisonStates.some(state => state.edvdJumpEnabled) && (
                      <Paper sx={{ p: 2, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>eDVD Jump Stat Gains</Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Stat</TableCell>
                                {comparisonStates.filter(s => s.edvdJumpEnabled).map((state) => {
                                  const stateIndex = comparisonStates.indexOf(state);
                                  return (
                                    <TableCell 
                                      key={state.id} 
                                      align="right" 
                                      sx={{ 
                                        fontWeight: 'bold',
                                        color: CHART_COLORS[stateIndex % CHART_COLORS.length]
                                      }}
                                    >
                                      {state.name}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(['strength', 'speed', 'defense', 'dexterity'] as const).map((statName) => (
                                <TableRow key={statName}>
                                  <TableCell sx={{ textTransform: 'capitalize' }}>{statName} (avg/jump)</TableCell>
                                  {comparisonStates.filter(s => s.edvdJumpEnabled).map((state) => {
                                    const result = results[state.id];
                                    if (!result || !result.edvdJumpGains) {
                                      return <TableCell key={state.id} align="right">-</TableCell>;
                                    }
                                    return (
                                      <TableCell key={state.id} align="right">
                                        +{Math.round(result.edvdJumpGains.averagePerJump[statName]).toLocaleString()}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              ))}
                              <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Total (avg/jump)</TableCell>
                                {comparisonStates.filter(s => s.edvdJumpEnabled).map((state) => {
                                  const result = results[state.id];
                                  if (!result || !result.edvdJumpGains) {
                                    return <TableCell key={state.id} align="right">-</TableCell>;
                                  }
                                  const avgGains = result.edvdJumpGains.averagePerJump;
                                  const totalAvg = avgGains.strength + avgGains.speed + avgGains.defense + avgGains.dexterity;
                                  return (
                                    <TableCell key={state.id} align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                      +{Math.round(totalAvg).toLocaleString()}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Total Jumps</TableCell>
                                {comparisonStates.filter(s => s.edvdJumpEnabled).map((state) => {
                                  const result = results[state.id];
                                  if (!result || !result.edvdJumpCosts) {
                                    return <TableCell key={state.id} align="right">-</TableCell>;
                                  }
                                  return (
                                    <TableCell key={state.id} align="right">
                                      {result.edvdJumpCosts.totalJumps}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Total Gains</TableCell>
                                {comparisonStates.filter(s => s.edvdJumpEnabled).map((state) => {
                                  const result = results[state.id];
                                  if (!result || !result.edvdJumpGains) {
                                    return <TableCell key={state.id} align="right">-</TableCell>;
                                  }
                                  const totalGains = result.edvdJumpGains.totalGains;
                                  const total = totalGains.strength + totalGains.speed + totalGains.defense + totalGains.dexterity;
                                  return (
                                    <TableCell key={state.id} align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                      +{Math.round(total).toLocaleString()}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    )}
                    </>
                  );
                }
              })()}
            </>
          )}

          {Object.keys(results).length === 0 && !error && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Configure your comparison states above to see results
              </Typography>
            </Paper>
          )}
        </>
      )}

      {mode === 'manual' && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Manual Test Configuration</Typography>
              
              {/* Starting Stats Display */}
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Starting Stats
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ flex: '1 1 45%' }}>
                    <Typography variant="caption" color="text.secondary">Str:</Typography>
                    <Typography variant="body2">{initialStats.strength.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 45%' }}>
                    <Typography variant="caption" color="text.secondary">Spd:</Typography>
                    <Typography variant="body2">{initialStats.speed.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 45%' }}>
                    <Typography variant="caption" color="text.secondary">Def:</Typography>
                    <Typography variant="body2">{initialStats.defense.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 45%' }}>
                    <Typography variant="caption" color="text.secondary">Dex:</Typography>
                    <Typography variant="body2">{initialStats.dexterity.toLocaleString()}</Typography>
                  </Box>
                </Box>
              </Box>
              
              <TextField 
                label="Total Energy" 
                type="number" 
                value={manualEnergy ?? ''} 
                onChange={(e) => setManualEnergy(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))} 
                fullWidth 
                margin="dense" 
                size="small" 
                inputProps={{ step: 'any', min: 0 }} 
              />
              <TextField 
                label="Happy" 
                type="number" 
                value={manualHappy ?? ''} 
                onChange={(e) => setManualHappy(e.target.value === '' ? 0 : Math.max(0, Math.min(99999, Number(e.target.value))))} 
                fullWidth 
                margin="dense" 
                size="small" 
                inputProps={{ step: 'any', min: 0, max: 99999 }} 
              />
              <FormControlLabel 
                control={<Switch checked={autoUpgradeGyms} onChange={(e) => setAutoUpgradeGyms(e.target.checked)} />} 
                label="Auto-upgrade gyms" 
              />
              
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel>{autoUpgradeGyms ? 'Starting Gym' : 'Current Gym'}</InputLabel>
                <Select value={currentGymIndex} label={autoUpgradeGyms ? 'Starting Gym' : 'Current Gym'} onChange={(e) => setCurrentGymIndex(Number(e.target.value))}>
                  {GYMS.map((gym, index) => (
                    <MenuItem key={gym.name} value={index}>{gym.displayName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Stat Targets</Typography>
              <TextField label="Str" type="number" value={manualStatWeights.strength ?? ''} onChange={(e) => setManualStatWeights({ ...manualStatWeights, strength: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
              <TextField label="Spd" type="number" value={manualStatWeights.speed ?? ''} onChange={(e) => setManualStatWeights({ ...manualStatWeights, speed: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
              <TextField label="Def" type="number" value={manualStatWeights.defense ?? ''} onChange={(e) => setManualStatWeights({ ...manualStatWeights, defense: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
              <TextField label="Dex" type="number" value={manualStatWeights.dexterity ?? ''} onChange={(e) => setManualStatWeights({ ...manualStatWeights, dexterity: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Perk %</Typography>
              <TextField label="Str %" type="number" value={manualPerkPercs.strength ?? ''} onChange={(e) => setManualPerkPercs({ ...manualPerkPercs, strength: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
              <TextField label="Spd %" type="number" value={manualPerkPercs.speed ?? ''} onChange={(e) => setManualPerkPercs({ ...manualPerkPercs, speed: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
              <TextField label="Def %" type="number" value={manualPerkPercs.defense ?? ''} onChange={(e) => setManualPerkPercs({ ...manualPerkPercs, defense: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
              <TextField label="Dex %" type="number" value={manualPerkPercs.dexterity ?? ''} onChange={(e) => setManualPerkPercs({ ...manualPerkPercs, dexterity: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Company Benefit</Typography>
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel>Benefit</InputLabel>
                <Select value={manualCompanyBenefitKey} label="Benefit" onChange={(e) => setManualCompanyBenefitKey(e.target.value)}>
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="musicStore">3★ Music Store</MenuItem>
                  <MenuItem value="candleShop">Candle Shop</MenuItem>
                  <MenuItem value="fitnessCenter">10★ Fitness Center</MenuItem>
                </Select>
              </FormControl>
              
              {manualCompanyBenefitKey === 'candleShop' && (
                <TextField label="Stars" type="number" value={manualCandleShopStars ?? ''} onChange={(e) => setManualCandleShopStars(e.target.value === '' ? 1 : Math.max(1, Math.min(10, Number(e.target.value))))} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 1, max: 10 }} />
              )}
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 8 }}>
            {results.manual && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Training Results</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">Strength</Typography>
                        <Typography variant="h6">{Math.round(results.manual.finalStats.strength).toLocaleString()}</Typography>
                        <Typography variant="caption" color="success.main">+{Math.round(results.manual.finalStats.strength - initialStats.strength).toLocaleString()}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">Speed</Typography>
                        <Typography variant="h6">{Math.round(results.manual.finalStats.speed).toLocaleString()}</Typography>
                        <Typography variant="caption" color="success.main">+{Math.round(results.manual.finalStats.speed - initialStats.speed).toLocaleString()}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">Defense</Typography>
                        <Typography variant="h6">{Math.round(results.manual.finalStats.defense).toLocaleString()}</Typography>
                        <Typography variant="caption" color="success.main">+{Math.round(results.manual.finalStats.defense - initialStats.defense).toLocaleString()}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">Dexterity</Typography>
                        <Typography variant="h6">{Math.round(results.manual.finalStats.dexterity).toLocaleString()}</Typography>
                        <Typography variant="caption" color="success.main">+{Math.round(results.manual.finalStats.dexterity - initialStats.dexterity).toLocaleString()}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  onClick={() => {
                    setInitialStats({
                      strength: Math.round(results.manual.finalStats.strength),
                      speed: Math.round(results.manual.finalStats.speed),
                      defense: Math.round(results.manual.finalStats.defense),
                      dexterity: Math.round(results.manual.finalStats.dexterity),
                    });
                  }}
                >
                  Use as Initial Stats
                </Button>
              </Paper>
            )}
            
            {!results.manual && (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Configure energy and options to see results
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}
      
      {/* Support and Problem Report Cards */}
      <Grid container spacing={2} sx={{ mt: 5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <BuyMeXanaxCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ReportProblemCard getCurrentSettings={getCurrentSettings} />
        </Grid>
      </Grid>
    </Box>
  );
}
