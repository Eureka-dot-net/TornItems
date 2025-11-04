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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
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
  calculateDailyEnergy,
  type Gym,
  type SimulationInputs,
  type CompanyBenefit,
  type SimulationResult,
  type StatWeights,
} from '../../lib/utils/gymProgressionCalculator';
import { useGymStats } from '../../lib/hooks/useGymStats';

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
  perkPercs: { strength: number; speed: number; defense: number; dexterity: number };
  happyJumpEnabled: boolean;
  happyJumpFrequency: number;
  happyJumpDvds: number;
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
    case 'none':
      return {
        name: 'No Benefits',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
    case 'musicStore':
      return {
        name: '3★ Music Store',
        gymUnlockSpeedMultiplier: 1.3, // 30% faster (unchanged)
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
    case 'candleShop':
      return {
        name: `${candleShopStars}★ Candle Shop`,
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: candleShopStars * 5, // 5 energy per star
        gymGainMultiplier: 1.0,
      };
    case 'fitnessCenter':
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

// Balanced High build - for dex and def only (what users call "whore" build)
// This is someone who does weighing like 1/1/0/1.25 or 1/1/1.25/1
const getBalancedHighRatio = (primaryStat: 'defense' | 'dexterity'): StatWeights => {
  if (primaryStat === 'defense') {
    // 1/1/1.25/1 - high defense
    return { strength: 1, speed: 1, defense: 1.25, dexterity: 1 };
  } else {
    // 1/1/1/1.25 - high dexterity
    return { strength: 1, speed: 1, defense: 1, dexterity: 1.25 };
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
  const [manualCompanyBenefitKey, setManualCompanyBenefitKey] = useState<string>(() => loadSavedValue('manualCompanyBenefitKey', 'none'));
  const [manualCandleShopStars, setManualCandleShopStars] = useState<number>(() => loadSavedValue('manualCandleShopStars', 10));
  const [manualPerkPercs, setManualPerkPercs] = useState(() => 
    loadSavedValue('manualPerkPercs', { strength: 0, speed: 0, defense: 0, dexterity: 0 })
  );
  
  // Shared player stats
  const [apiKey, setApiKey] = useState<string>(() => loadSavedValue('apiKey', ''));
  const [initialStats, setInitialStats] = useState(() => 
    loadSavedValue('initialStats', { strength: 1000, speed: 1000, defense: 1000, dexterity: 1000 })
  );
  const [currentGymIndex, setCurrentGymIndex] = useState<number>(() => loadSavedValue('currentGymIndex', 0));
  const [months, setMonths] = useState<number>(() => loadSavedValue('months', 6));
  
  // Comparison states
  const [comparisonStates, setComparisonStates] = useState<ComparisonState[]>(() => 
    loadSavedValue('comparisonStates', [
      {
        id: '1',
        name: 'State 1',
        statWeights: { strength: 1, speed: 1, defense: 1, dexterity: 1 },
        hoursPlayedPerDay: 8,
        xanaxPerDay: 0,
        hasPointsRefill: false,
        perkPercs: { strength: 0, speed: 0, defense: 0, dexterity: 0 },
        happyJumpEnabled: false,
        happyJumpFrequency: 7,
        happyJumpDvds: 1,
        diabetesDayEnabled: false,
        diabetesDayNumberOfJumps: 1,
        diabetesDayFHC: 0,
        diabetesDayGreenEgg: 0,
        diabetesDaySeasonalMail: false,
        diabetesDayLogoClick: false,
        companyBenefitKey: 'none',
        candleShopStars: 10,
        happy: 5000,
        daysSkippedPerMonth: 0,
      },
    ])
  );
  
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [error, setError] = useState<string | null>(null);
  
  const { data: gymStatsData, isLoading: isLoadingGymStats, error: gymStatsError, refetch: refetchGymStats } = useGymStats(apiKey || null);
  
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
  }, [comparisonStates, initialStats, months]);
  
  useEffect(() => {
    if (mode === 'manual') {
      handleSimulate();
    }
  }, [manualEnergy, autoUpgradeGyms, manualHappy, initialStats, currentGymIndex, manualStatWeights, manualCompanyBenefitKey, manualCandleShopStars, manualPerkPercs]);
  
  const handleFetchStats = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }
    setError(null);
    refetchGymStats();
  };
  
  const handleAddState = () => {
    if (comparisonStates.length >= 4) {
      setError('Maximum 4 comparison states allowed');
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
      perkPercs: { ...sourceState.perkPercs },
      happyJumpEnabled: sourceState.happyJumpEnabled,
      happyJumpFrequency: sourceState.happyJumpFrequency,
      happyJumpDvds: sourceState.happyJumpDvds,
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
            companyBenefit: benefit,
            apiKey,
            initialStats,
            happy: state.diabetesDayEnabled ? 99999 : state.happy, // DD overrides happy to 99999
            perkPercs: state.perkPercs,
            currentGymIndex: currentGymIndex, // Start from current/selected gym and auto-upgrade
            lockGym: false, // Always use auto-upgrade in future mode to allow unlock speed multiplier to work
            happyJump: state.happyJumpEnabled ? {
              enabled: true,
              frequencyDays: state.happyJumpFrequency,
              dvdsUsed: state.happyJumpDvds,
            } : undefined,
            diabetesDay: state.diabetesDayEnabled ? {
              enabled: true,
              numberOfJumps: state.diabetesDayNumberOfJumps,
              featheryHotelCoupon: state.diabetesDayFHC,
              greenEgg: state.diabetesDayGreenEgg,
              seasonalMail: state.diabetesDaySeasonalMail,
              logoEnergyClick: state.diabetesDayLogoClick,
            } : undefined,
            daysSkippedPerMonth: state.daysSkippedPerMonth,
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
  
  // Helper function to format days into human-readable time
  const formatDaysToHumanReadable = (days: number): string => {
    const years = Math.floor(days / 365);
    const remainingAfterYears = days % 365;
    const months = Math.floor(remainingAfterYears / 30);
    const remainingDays = remainingAfterYears % 30;
    
    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (remainingDays > 0 || parts.length === 0) parts.push(`${remainingDays} day${remainingDays !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
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
                  <Typography variant="caption" sx={{ color: '#aaa', display: 'block', ml: 1 }}>
                    Gym: {snapshot.currentGym}
                  </Typography>
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
    results[Object.keys(results)[0]].dailySnapshots.map((_,index) => {
      const dataPoint: Record<string, number> = { 
        day: results[Object.keys(results)[0]].dailySnapshots[index].day 
      };
      
      for (const state of comparisonStates) {
        if (results[state.id]) {
          const snapshot = results[state.id].dailySnapshots[index];
          const totalStats = snapshot.strength + snapshot.speed + snapshot.defense + snapshot.dexterity;
          dataPoint[state.name] = totalStats;
        }
      }
      
      return dataPoint;
    }) : [];
  
  const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
  const activeState = comparisonStates[activeTabIndex];
  
  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gym Comparison Tool
      </Typography>
      
      <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
        Compare gym stat gains with different configurations
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button variant={mode === 'future' ? 'contained' : 'outlined'} onClick={() => setMode('future')}>
          Future Comparison
        </Button>
        <Button variant={mode === 'manual' ? 'contained' : 'outlined'} onClick={() => setMode('manual')}>
          Manual Testing
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Player Stats</Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              A Limited API Key is sufficient for fetching your stats. Get one from{' '}
              <a href="https://www.torn.com/preferences.php#tab=api" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                Torn Settings → API Key
              </a>
            </Alert>
            
            <TextField
              label="Torn API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              fullWidth
              margin="dense"
              size="small"
              helperText="Optional: Fetch your current stats"
            />
            <Button variant="outlined" fullWidth sx={{ mt: 1, mb: 2 }} onClick={handleFetchStats} disabled={isLoadingGymStats || !apiKey.trim()}>
              {isLoadingGymStats ? <CircularProgress size={20} /> : 'Fetch My Stats'}
            </Button>
            
            <TextField label="Initial Strength" type="number" value={initialStats.strength ?? ''} onChange={(e) => setInitialStats({ ...initialStats, strength: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
            <TextField label="Initial Speed" type="number" value={initialStats.speed ?? ''} onChange={(e) => setInitialStats({ ...initialStats, speed: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
            <TextField label="Initial Defense" type="number" value={initialStats.defense ?? ''} onChange={(e) => setInitialStats({ ...initialStats, defense: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
            <TextField label="Initial Dexterity" type="number" value={initialStats.dexterity ?? ''} onChange={(e) => setInitialStats({ ...initialStats, dexterity: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
            
            {mode === 'future' && (
              <>
                <TextField label="Simulation Duration (months)" type="number" value={months ?? ''} onChange={(e) => setMonths(e.target.value === '' ? 1 : Math.max(1, Math.min(36, Number(e.target.value))))} fullWidth margin="dense" size="small" helperText="1-36 months" inputProps={{ step: 'any' }} />
                
                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel>Starting Gym</InputLabel>
                  <Select value={currentGymIndex} label="Starting Gym" onChange={(e) => setCurrentGymIndex(Number(e.target.value))}>
                    {GYMS.map((gym, index) => (
                      <MenuItem key={gym.name} value={index}>{gym.displayName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
            
            {mode === 'manual' && (
              <>
                <TextField label="Total Energy" type="number" value={manualEnergy ?? ''} onChange={(e) => setManualEnergy(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))} fullWidth margin="dense" size="small" helperText="Energy to spend on training" inputProps={{ step: 'any', min: 0 }} />
                <TextField label="Happy" type="number" value={manualHappy ?? ''} onChange={(e) => setManualHappy(e.target.value === '' ? 0 : Math.max(0, Math.min(99999, Number(e.target.value))))} fullWidth margin="dense" size="small" helperText="Maximum: 99,999" inputProps={{ step: 'any', min: 0 }} />
                <FormControlLabel control={<Switch checked={autoUpgradeGyms} onChange={(e) => setAutoUpgradeGyms(e.target.checked)} />} label="Auto-upgrade gyms" sx={{ mt: 1 }} />
                
                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel>{autoUpgradeGyms ? 'Starting Gym' : 'Current Gym'}</InputLabel>
                  <Select value={currentGymIndex} label={autoUpgradeGyms ? 'Starting Gym' : 'Current Gym'} onChange={(e) => setCurrentGymIndex(Number(e.target.value))}>
                    {GYMS.map((gym, index) => (
                      <MenuItem key={gym.name} value={index}>{gym.displayName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Stat Target Ratios (Desired Build)</Typography>
                <TextField label="Strength Target" type="number" value={manualStatWeights.strength ?? ''} onChange={(e) => setManualStatWeights({ ...manualStatWeights, strength: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} helperText="Set to 0 to not train this stat" />
                <TextField label="Speed Target" type="number" value={manualStatWeights.speed ?? ''} onChange={(e) => setManualStatWeights({ ...manualStatWeights, speed: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} helperText="Set to 0 to not train this stat" />
                <TextField label="Defense Target" type="number" value={manualStatWeights.defense ?? ''} onChange={(e) => setManualStatWeights({ ...manualStatWeights, defense: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} helperText="Set to 0 to not train this stat" />
                <TextField label="Dexterity Target" type="number" value={manualStatWeights.dexterity ?? ''} onChange={(e) => setManualStatWeights({ ...manualStatWeights, dexterity: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} helperText="Set to 0 to not train this stat" />
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  These values represent your desired stat ratios (e.g., 1:1:1.25:0 means equal strength/speed, 25% more dex, no defense). Each train goes to the stat furthest from its target ratio.
                </Alert>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Quick Presets</Typography>
                <Alert severity="info" sx={{ mb: 1 }}>
                  Choose a formula for each stat to quickly set up your build. Hank's Ratio maximizes gym efficiency with one very low stat. Baldr's Ratio is more balanced. Balanced High is a slight boost to one stat (Dex/Def only).
                </Alert>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" fontWeight="bold" display="block">Strength Build</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Button size="small" variant="outlined" onClick={() => setManualStatWeights(getHanksRatio('strength'))}>Hank's</Button>
                    <Button size="small" variant="outlined" onClick={() => setManualStatWeights(getBaldrsRatio('strength'))}>Baldr's</Button>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" fontWeight="bold" display="block">Speed Build</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Button size="small" variant="outlined" onClick={() => setManualStatWeights(getHanksRatio('speed'))}>Hank's</Button>
                    <Button size="small" variant="outlined" onClick={() => setManualStatWeights(getBaldrsRatio('speed'))}>Baldr's</Button>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" fontWeight="bold" display="block">Defense Build</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Button size="small" variant="outlined" onClick={() => setManualStatWeights(getHanksRatio('defense'))}>Hank's</Button>
                    <Button size="small" variant="outlined" onClick={() => setManualStatWeights(getBaldrsRatio('defense'))}>Baldr's</Button>
                    <Button size="small" variant="outlined" onClick={() => setManualStatWeights(getBalancedHighRatio('defense'))}>Balanced High</Button>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" fontWeight="bold" display="block">Dexterity Build</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Button size="small" variant="outlined" onClick={() => setManualStatWeights(getHanksRatio('dexterity'))}>Hank's</Button>
                    <Button size="small" variant="outlined" onClick={() => setManualStatWeights(getBaldrsRatio('dexterity'))}>Baldr's</Button>
                    <Button size="small" variant="outlined" onClick={() => setManualStatWeights(getBalancedHighRatio('dexterity'))}>Balanced High</Button>
                  </Box>
                </Box>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Perk % Bonus</Typography>
                <TextField label="Strength Perk %" type="number" value={manualPerkPercs.strength ?? ''} onChange={(e) => setManualPerkPercs({ ...manualPerkPercs, strength: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
                <TextField label="Speed Perk %" type="number" value={manualPerkPercs.speed ?? ''} onChange={(e) => setManualPerkPercs({ ...manualPerkPercs, speed: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
                <TextField label="Defense Perk %" type="number" value={manualPerkPercs.defense ?? ''} onChange={(e) => setManualPerkPercs({ ...manualPerkPercs, defense: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
                <TextField label="Dexterity Perk %" type="number" value={manualPerkPercs.dexterity ?? ''} onChange={(e) => setManualPerkPercs({ ...manualPerkPercs, dexterity: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Company Benefit</Typography>
                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel>Benefit Type</InputLabel>
                  <Select value={manualCompanyBenefitKey} label="Benefit Type" onChange={(e) => setManualCompanyBenefitKey(e.target.value)}>
                    <MenuItem value="none">No Benefits</MenuItem>
                    <MenuItem value="musicStore">3★ Music Store</MenuItem>
                    <MenuItem value="candleShop">Candle Shop</MenuItem>
                    <MenuItem value="fitnessCenter">10★ Fitness Center</MenuItem>
                  </Select>
                </FormControl>
                
                {manualCompanyBenefitKey === 'candleShop' && (
                  <TextField label="Candle Shop Stars" type="number" value={manualCandleShopStars ?? ''} onChange={(e) => setManualCandleShopStars(e.target.value === '' ? 1 : Math.max(1, Math.min(10, Number(e.target.value))))} fullWidth margin="dense" size="small" helperText="1-10 stars, 5 energy per star" inputProps={{ step: 'any' }} />
                )}
              </>
            )}
            
            {mode === 'future' && (
              <>
                <Box sx={{ mt: 3, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Comparison States</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={handleAddState} disabled={comparisonStates.length >= 4}>Add State</Button>
                </Box>
                
                <Tabs value={activeTabIndex} onChange={(_, newValue) => setActiveTabIndex(newValue)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  {comparisonStates.map((state) => (<Tab key={state.id} label={state.name} />))}
                </Tabs>
                
                {activeState && (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField label="State Name" value={activeState.name} onChange={(e) => updateState(activeState.id, { name: e.target.value })} fullWidth size="small" />
                      {comparisonStates.length > 1 && (<IconButton color="error" onClick={() => handleRemoveState(activeState.id)} size="small"><DeleteIcon /></IconButton>)}
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Stat Target Ratios (Desired Build)</Typography>
                    <TextField label="Strength Target" type="number" value={activeState.statWeights.strength ?? ''} onChange={(e) => updateState(activeState.id, { statWeights: { ...activeState.statWeights, strength: e.target.value === '' ? 0 : Number(e.target.value) }})} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} helperText="Set to 0 to not train this stat" />
                    <TextField label="Speed Target" type="number" value={activeState.statWeights.speed ?? ''} onChange={(e) => updateState(activeState.id, { statWeights: { ...activeState.statWeights, speed: e.target.value === '' ? 0 : Number(e.target.value) }})} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} helperText="Set to 0 to not train this stat" />
                    <TextField label="Defense Target" type="number" value={activeState.statWeights.defense ?? ''} onChange={(e) => updateState(activeState.id, { statWeights: { ...activeState.statWeights, defense: e.target.value === '' ? 0 : Number(e.target.value) }})} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} helperText="Set to 0 to not train this stat" />
                    <TextField label="Dexterity Target" type="number" value={activeState.statWeights.dexterity ?? ''} onChange={(e) => updateState(activeState.id, { statWeights: { ...activeState.statWeights, dexterity: e.target.value === '' ? 0 : Number(e.target.value) }})} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} helperText="Set to 0 to not train this stat" />
                    
                    <Alert severity="info" sx={{ mt: 2 }}>
                      These values represent your desired stat ratios (e.g., 1:1:1.25:0 means equal strength/speed, 25% more dex, no defense). Each train goes to the stat furthest from its target ratio.
                    </Alert>
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Quick Presets</Typography>
                    <Alert severity="info" sx={{ mb: 1 }}>
                      Choose a formula for each stat to quickly set up your build. Hank's Ratio maximizes gym efficiency with one very low stat. Baldr's Ratio is more balanced. Balanced High is a slight boost to one stat (Dex/Def only).
                    </Alert>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" fontWeight="bold" display="block">Strength Build</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Button size="small" variant="outlined" onClick={() => updateState(activeState.id, { statWeights: getHanksRatio('strength') })}>Hank's</Button>
                        <Button size="small" variant="outlined" onClick={() => updateState(activeState.id, { statWeights: getBaldrsRatio('strength') })}>Baldr's</Button>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" fontWeight="bold" display="block">Speed Build</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Button size="small" variant="outlined" onClick={() => updateState(activeState.id, { statWeights: getHanksRatio('speed') })}>Hank's</Button>
                        <Button size="small" variant="outlined" onClick={() => updateState(activeState.id, { statWeights: getBaldrsRatio('speed') })}>Baldr's</Button>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" fontWeight="bold" display="block">Defense Build</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Button size="small" variant="outlined" onClick={() => updateState(activeState.id, { statWeights: getHanksRatio('defense') })}>Hank's</Button>
                        <Button size="small" variant="outlined" onClick={() => updateState(activeState.id, { statWeights: getBaldrsRatio('defense') })}>Baldr's</Button>
                        <Button size="small" variant="outlined" onClick={() => updateState(activeState.id, { statWeights: getBalancedHighRatio('defense') })}>Balanced High</Button>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" fontWeight="bold" display="block">Dexterity Build</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Button size="small" variant="outlined" onClick={() => updateState(activeState.id, { statWeights: getHanksRatio('dexterity') })}>Hank's</Button>
                        <Button size="small" variant="outlined" onClick={() => updateState(activeState.id, { statWeights: getBaldrsRatio('dexterity') })}>Baldr's</Button>
                        <Button size="small" variant="outlined" onClick={() => updateState(activeState.id, { statWeights: getBalancedHighRatio('dexterity') })}>Balanced High</Button>
                      </Box>
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Energy Sources</Typography>
                    <TextField label="Hours Played Per Day" type="number" value={activeState.hoursPlayedPerDay ?? ''} onChange={(e) => updateState(activeState.id, { hoursPlayedPerDay: e.target.value === '' ? 0 : Math.max(0, Math.min(24, Number(e.target.value)))})} fullWidth margin="dense" size="small" helperText="0-24 hours" inputProps={{ step: 'any', min: 0 }} />
                    <TextField label="Xanax Per Day" type="number" value={activeState.xanaxPerDay ?? ''} onChange={(e) => updateState(activeState.id, { xanaxPerDay: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value))})} fullWidth margin="dense" size="small" helperText="Each xanax = +250 energy" inputProps={{ step: 'any', min: 0 }} />
                    <FormControlLabel control={<Switch checked={activeState.hasPointsRefill} onChange={(e) => updateState(activeState.id, { hasPointsRefill: e.target.checked })} />} label="Points Refill (+150 energy)" />
                    <TextField label="Days Skipped Per Month" type="number" value={activeState.daysSkippedPerMonth ?? ''} onChange={(e) => updateState(activeState.id, { daysSkippedPerMonth: e.target.value === '' ? 0 : Math.max(0, Math.min(30, Number(e.target.value)))})} fullWidth margin="dense" size="small" helperText="0-30 days (wars, vacations, etc.)" inputProps={{ step: 'any', min: 0 }} />
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Base Happy</Typography>
                    <TextField label="Happy" type="number" value={activeState.happy ?? ''} onChange={(e) => updateState(activeState.id, { happy: e.target.value === '' ? 0 : Math.max(0, Math.min(99999, Number(e.target.value)))})} fullWidth margin="dense" size="small" helperText="Maximum: 99,999" inputProps={{ step: 'any', min: 0 }} />
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Perk % Bonus</Typography>
                    <TextField label="Strength Perk %" type="number" value={activeState.perkPercs.strength ?? ''} onChange={(e) => updateState(activeState.id, { perkPercs: { ...activeState.perkPercs, strength: e.target.value === '' ? 0 : Number(e.target.value)}})} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
                    <TextField label="Speed Perk %" type="number" value={activeState.perkPercs.speed ?? ''} onChange={(e) => updateState(activeState.id, { perkPercs: { ...activeState.perkPercs, speed: e.target.value === '' ? 0 : Number(e.target.value)}})} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
                    <TextField label="Defense Perk %" type="number" value={activeState.perkPercs.defense ?? ''} onChange={(e) => updateState(activeState.id, { perkPercs: { ...activeState.perkPercs, defense: e.target.value === '' ? 0 : Number(e.target.value)}})} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
                    <TextField label="Dexterity Perk %" type="number" value={activeState.perkPercs.dexterity ?? ''} onChange={(e) => updateState(activeState.id, { perkPercs: { ...activeState.perkPercs, dexterity: e.target.value === '' ? 0 : Number(e.target.value)}})} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Happy Jump</Typography>
                    <FormControlLabel control={<Switch checked={activeState.happyJumpEnabled} onChange={(e) => updateState(activeState.id, { happyJumpEnabled: e.target.checked })} />} label="Enable Happy Jumps" />
                    {activeState.happyJumpEnabled && (
                      <>
                        <TextField label="Jump Frequency (days)" type="number" value={activeState.happyJumpFrequency ?? ''} onChange={(e) => updateState(activeState.id, { happyJumpFrequency: e.target.value === '' ? 1 : Math.max(1, Number(e.target.value))})} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
                        <TextField label="DVDs Used Per Jump" type="number" value={activeState.happyJumpDvds ?? ''} onChange={(e) => updateState(activeState.id, { happyJumpDvds: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value))})} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
                      </>
                    )}
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Diabetes Day Event</Typography>
                    <FormControlLabel 
                      control={<Switch checked={activeState.diabetesDayEnabled} onChange={(e) => updateState(activeState.id, { diabetesDayEnabled: e.target.checked })} />} 
                      label="Enable Diabetes Day" 
                    />
                    <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                      Diabetes Day provides 99999 happy jumps with special energy bonuses. Jumps occur on day 7 for 1 jump, or days 5 and 7 for 2 jumps.
                    </Alert>
                    {activeState.diabetesDayEnabled && (
                      <>
                        <FormControl fullWidth margin="dense" size="small">
                          <InputLabel>Number of Jumps</InputLabel>
                          <Select 
                            value={activeState.diabetesDayNumberOfJumps} 
                            label="Number of Jumps" 
                            onChange={(e) => updateState(activeState.id, { diabetesDayNumberOfJumps: Number(e.target.value) as 1 | 2 })}
                          >
                            <MenuItem value={1}>1 Jump</MenuItem>
                            <MenuItem value={2}>2 Jumps</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <FormControl fullWidth margin="dense" size="small">
                          <InputLabel>FHC (Feathery Hotel Coupon)</InputLabel>
                          <Select 
                            value={activeState.diabetesDayFHC} 
                            label="FHC (Feathery Hotel Coupon)" 
                            onChange={(e) => updateState(activeState.id, { diabetesDayFHC: Number(e.target.value) as 0 | 1 | 2 })}
                          >
                            <MenuItem value={0}>0 (No FHC)</MenuItem>
                            <MenuItem value={1}>1 (+150 energy)</MenuItem>
                            <MenuItem value={2}>2 (+150 energy each)</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <FormControl fullWidth margin="dense" size="small">
                          <InputLabel>Green Egg</InputLabel>
                          <Select 
                            value={activeState.diabetesDayGreenEgg} 
                            label="Green Egg" 
                            onChange={(e) => updateState(activeState.id, { diabetesDayGreenEgg: Number(e.target.value) as 0 | 1 | 2 })}
                          >
                            <MenuItem value={0}>0 (No Green Egg)</MenuItem>
                            <MenuItem value={1}>1 (+500 energy)</MenuItem>
                            <MenuItem value={2}>2 (+500 energy each)</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <Alert severity="warning" sx={{ mt: 1, mb: 1, fontSize: '0.75rem' }}>
                          Note: Only 1 FHC OR Green Egg can be used per jump. With 2 jumps, you can use one item per jump.
                        </Alert>
                        
                        <FormControlLabel 
                          control={<Switch checked={activeState.diabetesDaySeasonalMail} onChange={(e) => updateState(activeState.id, { diabetesDaySeasonalMail: e.target.checked })} />} 
                          label="Seasonal Mail (+250 energy, first jump only)" 
                        />
                        
                        <FormControlLabel 
                          control={<Switch checked={activeState.diabetesDayLogoClick} onChange={(e) => updateState(activeState.id, { diabetesDayLogoClick: e.target.checked })} />} 
                          label="Logo Energy Click (+50 energy, second jump only)" 
                        />
                      </>
                    )}
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Company Benefit</Typography>
                    <FormControl fullWidth margin="dense" size="small">
                      <InputLabel>Benefit Type</InputLabel>
                      <Select value={activeState.companyBenefitKey} label="Benefit Type" onChange={(e) => updateState(activeState.id, { companyBenefitKey: e.target.value })}>
                        <MenuItem value="none">No Benefits</MenuItem>
                        <MenuItem value="musicStore">3★ Music Store</MenuItem>
                        <MenuItem value="candleShop">Candle Shop</MenuItem>
                        <MenuItem value="fitnessCenter">10★ Fitness Center</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {activeState.companyBenefitKey === 'candleShop' && (
                      <TextField label="Candle Shop Stars" type="number" value={activeState.candleShopStars ?? ''} onChange={(e) => updateState(activeState.id, { candleShopStars: e.target.value === '' ? 1 : Math.max(1, Math.min(10, Number(e.target.value)))})} fullWidth margin="dense" size="small" helperText="1-10 stars, 5 energy per star" inputProps={{ step: 'any' }} />
                    )}
                    
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Daily Energy: {calculateDailyEnergy(activeState.hoursPlayedPerDay, activeState.xanaxPerDay, activeState.hasPointsRefill, getCompanyBenefit(activeState.companyBenefitKey, activeState.candleShopStars).bonusEnergyPerDay).toLocaleString()} E
                    </Alert>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 8 }}>
          {error && (<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>)}
          
          {mode === 'manual' && results.manual && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Training Results</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 3 }}><Card><CardContent><Typography variant="subtitle2" color="text.secondary">Strength</Typography><Typography variant="h5">{Math.round(results.manual.finalStats.strength).toLocaleString()}</Typography><Typography variant="caption" color="success.main">+{Math.round(results.manual.finalStats.strength - initialStats.strength).toLocaleString()}</Typography></CardContent></Card></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Card><CardContent><Typography variant="subtitle2" color="text.secondary">Speed</Typography><Typography variant="h5">{Math.round(results.manual.finalStats.speed).toLocaleString()}</Typography><Typography variant="caption" color="success.main">+{Math.round(results.manual.finalStats.speed - initialStats.speed).toLocaleString()}</Typography></CardContent></Card></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Card><CardContent><Typography variant="subtitle2" color="text.secondary">Defense</Typography><Typography variant="h5">{Math.round(results.manual.finalStats.defense).toLocaleString()}</Typography><Typography variant="caption" color="success.main">+{Math.round(results.manual.finalStats.defense - initialStats.defense).toLocaleString()}</Typography></CardContent></Card></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Card><CardContent><Typography variant="subtitle2" color="text.secondary">Dexterity</Typography><Typography variant="h5">{Math.round(results.manual.finalStats.dexterity).toLocaleString()}</Typography><Typography variant="caption" color="success.main">+{Math.round(results.manual.finalStats.dexterity - initialStats.dexterity).toLocaleString()}</Typography></CardContent></Card></Grid>
              </Grid>
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ mt: 3 }}
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
          
          {mode === 'future' && Object.keys(results).length > 0 && (
            <>
              {/* Show Diabetes Day Gains Grid if any state has DD enabled */}
              {comparisonStates.some(state => state.diabetesDayEnabled) && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Diabetes Day Jump Gains</Typography>
                  <Grid container spacing={2}>
                    {comparisonStates.filter(state => state.diabetesDayEnabled).map((state) => {
                      const result = results[state.id];
                      if (!result || !result.diabetesDayTotalGains) return null;
                      
                      const ddGains = result.diabetesDayTotalGains;
                      const totalGain = ddGains.strength + ddGains.speed + ddGains.defense + ddGains.dexterity;
                      
                      return (
                        <Grid size={{ xs: 12, sm: 6 }} key={state.id}>
                          <Card sx={{ borderLeft: 4, borderColor: CHART_COLORS[comparisonStates.indexOf(state) % CHART_COLORS.length] }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>{state.name}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                {state.diabetesDayNumberOfJumps} Jump{state.diabetesDayNumberOfJumps > 1 ? 's' : ''}
                              </Typography>
                              
                              {/* Jump 1 Gains */}
                              {result.diabetesDayJump1Gains && (
                                <>
                                  <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
                                    Jump 1 (Day {state.diabetesDayNumberOfJumps === 1 ? '7' : '5'}):
                                  </Typography>
                                  <Typography variant="body2">Str: +{result.diabetesDayJump1Gains.strength.toLocaleString()}</Typography>
                                  <Typography variant="body2">Spd: +{result.diabetesDayJump1Gains.speed.toLocaleString()}</Typography>
                                  <Typography variant="body2">Def: +{result.diabetesDayJump1Gains.defense.toLocaleString()}</Typography>
                                  <Typography variant="body2">Dex: +{result.diabetesDayJump1Gains.dexterity.toLocaleString()}</Typography>
                                  <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                    Subtotal: +{(result.diabetesDayJump1Gains.strength + result.diabetesDayJump1Gains.speed + result.diabetesDayJump1Gains.defense + result.diabetesDayJump1Gains.dexterity).toLocaleString()}
                                  </Typography>
                                </>
                              )}
                              
                              {/* Jump 2 Gains */}
                              {result.diabetesDayJump2Gains && (
                                <>
                                  <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>Jump 2 (Day 7):</Typography>
                                  <Typography variant="body2">Str: +{result.diabetesDayJump2Gains.strength.toLocaleString()}</Typography>
                                  <Typography variant="body2">Spd: +{result.diabetesDayJump2Gains.speed.toLocaleString()}</Typography>
                                  <Typography variant="body2">Def: +{result.diabetesDayJump2Gains.defense.toLocaleString()}</Typography>
                                  <Typography variant="body2">Dex: +{result.diabetesDayJump2Gains.dexterity.toLocaleString()}</Typography>
                                  <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                    Subtotal: +{(result.diabetesDayJump2Gains.strength + result.diabetesDayJump2Gains.speed + result.diabetesDayJump2Gains.defense + result.diabetesDayJump2Gains.dexterity).toLocaleString()}
                                  </Typography>
                                </>
                              )}
                              
                              {/* Total Gains */}
                              <Typography variant="h6" color="success.main" sx={{ mt: 2 }}>
                                Total DD Gain: +{totalGain.toLocaleString()}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Paper>
              )}
              
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Total Battle Stats Over Time</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Total Battle Stats', angle: -90, position: 'insideLeft' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {comparisonStates.map((state, index) => (
                      <Line key={state.id} type="monotone" dataKey={state.name} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
              
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Final Stats Comparison</Typography>
                <Grid container spacing={2}>
                  {comparisonStates.map((state, index) => {
                    const result = results[state.id];
                    if (!result) return null;
                    
                    const totalGain = (result.finalStats.strength - initialStats.strength) + (result.finalStats.speed - initialStats.speed) + (result.finalStats.defense - initialStats.defense) + (result.finalStats.dexterity - initialStats.dexterity);
                    
                    const handleUseAsInitialStats = () => {
                      setInitialStats({
                        strength: Math.round(result.finalStats.strength),
                        speed: Math.round(result.finalStats.speed),
                        defense: Math.round(result.finalStats.defense),
                        dexterity: Math.round(result.finalStats.dexterity),
                      });
                    };
                    
                    return (
                      <Grid size={{ xs: 12, sm: 6 }} key={state.id}>
                        <Card sx={{ borderLeft: 4, borderColor: CHART_COLORS[index % CHART_COLORS.length] }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>{state.name}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              {getCompanyBenefit(state.companyBenefitKey, state.candleShopStars).name}
                            </Typography>
                            <Typography variant="body2">Str: {result.finalStats.strength.toLocaleString()} | Spd: {result.finalStats.speed.toLocaleString()}</Typography>
                            <Typography variant="body2">Def: {result.finalStats.defense.toLocaleString()} | Dex: {result.finalStats.dexterity.toLocaleString()}</Typography>
                            <Typography variant="h6" color="success.main" sx={{ mt: 1 }}>Total Gain: +{totalGain.toLocaleString()}</Typography>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              fullWidth 
                              sx={{ mt: 2 }}
                              onClick={handleUseAsInitialStats}
                            >
                              Use as Initial Stats
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            </>
          )}
          
          {Object.keys(results).length === 0 && !error && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {mode === 'future' ? 'Results will appear automatically as you configure your comparison states' : 'Results will appear automatically as you adjust the energy amount'}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
