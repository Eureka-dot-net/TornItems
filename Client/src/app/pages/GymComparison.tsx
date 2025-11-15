import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  Paper,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  simulateGymProgression,
  type SimulationInputs,
  type SimulationResult,
  type DailySnapshot,
} from '../../lib/utils/gymProgressionCalculator';
import { type GymStatsResponse } from '../../lib/hooks/useGymStats';
import { useItemPrices, type ItemPrices } from '../../lib/hooks/useItemPrices';
import { getCompanyBenefit, type StatWeights } from '../../lib/utils/gymHelpers';
import { agent } from '../../lib/api/agent';
import {
  CANDY_ITEM_IDS,
  ENERGY_ITEM_IDS,
  CONSUMABLE_ITEM_IDS,
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
  DEFAULT_ISLAND_COST_PER_DAY,
} from '../../lib/constants/gymConstants';
import { GYMS } from '../../lib/data/gyms';

// All gyms are available - specialty gyms will be filtered by their requirements
const AVAILABLE_GYMS = GYMS;

import BuyMeXanaxCard from '../components/gymComparison/BuyMeXanaxCard';
import ReportProblemCard from '../components/gymComparison/ReportProblemCard';
import LoadSettingsButton from '../components/gymComparison/LoadSettingsButton';
import SaveConfigurationButton from '../components/gymComparison/SaveConfigurationButton';
import LoadConfigurationButton from '../components/gymComparison/LoadConfigurationButton';
import PlayerStatsSection from '../components/gymComparison/PlayerStatsSection';
import ComparisonSelector from '../components/gymComparison/ComparisonSelector';
import SectionedComparisonConfig from '../components/gymComparison/SectionedComparisonConfig';
import ManualTestingSection from '../components/gymComparison/ManualTestingSection';
import ResultsSection from '../components/gymComparison/ResultsSection';
import { exportGymComparisonData, type ExportData } from '../../lib/utils/exportHelpers';

// Training section interface - each section represents a time period with its own settings
interface TrainingSection {
  id: string;
  startDay: number;
  endDay: number;
  statWeights: { strength: number; speed: number; defense: number; dexterity: number };
  hoursPlayedPerDay: number;
  xanaxPerDay: number;
  hasPointsRefill: boolean;
  maxEnergy: number;
  perkPercs: { strength: number; speed: number; defense: number; dexterity: number };
  edvdJumpEnabled: boolean;
  edvdJumpFrequency: number;
  edvdJumpDvds: number;
  edvdJumpLimit: 'indefinite' | 'count' | 'stat';
  edvdJumpCount: number;
  edvdJumpStatTarget: number;
  edvdJumpAdultNovelties: boolean;
  candyJumpEnabled: boolean;
  candyJumpItemId: number;
  candyJumpUseEcstasy: boolean;
  candyJumpQuantity: number;
  candyJumpFactionBenefit: number;
  energyJumpEnabled: boolean;
  energyJumpItemId: number;
  energyJumpQuantity: number;
  energyJumpFactionBenefit: number;
  lossReviveEnabled: boolean;
  lossReviveNumberPerDay: number;
  lossReviveEnergyCost: number;
  lossReviveDaysBetween: number;
  lossRevivePricePerLoss: number;
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
  statDriftPercent: number;
  balanceAfterGymIndex: number;
  ignorePerksForGymSelection: boolean;
  islandCostPerDay?: number;
}

// Comparison state interface - now contains multiple sections
interface ComparisonState {
  id: string;
  name: string;
  sections: TrainingSection[];
  showIndividualStats: boolean; // Whether to show individual stats chart for this state
  [key: string]: unknown;
}

export default function GymComparison() {
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymComparison_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Migration function to convert old format to new format
  const migrateComparisonState = (state: Record<string, unknown>, totalDays: number): ComparisonState => {
    // Check if already in new format
    if ('sections' in state && Array.isArray(state.sections)) {
      return state as ComparisonState;
    }
    
    // Old format - convert to new format with a single section covering the entire duration
    const section: TrainingSection = {
      id: '1',
      startDay: 1,
      endDay: totalDays,
      statWeights: (state.statWeights as { strength: number; speed: number; defense: number; dexterity: number }) || DEFAULT_STAT_WEIGHTS,
      hoursPlayedPerDay: (state.hoursPlayedPerDay as number) || DEFAULT_HOURS_PER_DAY,
      xanaxPerDay: (state.xanaxPerDay as number) || DEFAULT_XANAX_PER_DAY,
      hasPointsRefill: (state.hasPointsRefill as boolean) ?? true,
      maxEnergy: (state.maxEnergy as number) || MAX_ENERGY_DEFAULT,
      perkPercs: (state.perkPercs as { strength: number; speed: number; defense: number; dexterity: number }) || DEFAULT_PERK_PERCS,
      edvdJumpEnabled: (state.edvdJumpEnabled as boolean) || false,
      edvdJumpFrequency: (state.edvdJumpFrequency as number) || DEFAULT_EDVD_FREQUENCY_DAYS,
      edvdJumpDvds: (state.edvdJumpDvds as number) || DEFAULT_EDVD_DVDS,
      edvdJumpLimit: (state.edvdJumpLimit as 'indefinite' | 'count' | 'stat') || 'indefinite',
      edvdJumpCount: (state.edvdJumpCount as number) || 10,
      edvdJumpStatTarget: (state.edvdJumpStatTarget as number) || 10000000,
      edvdJumpAdultNovelties: (state.edvdJumpAdultNovelties as boolean) || false,
      candyJumpEnabled: (state.candyJumpEnabled as boolean) || false,
      candyJumpItemId: (state.candyJumpItemId as number) || CANDY_ITEM_IDS.HAPPY_25,
      candyJumpUseEcstasy: (state.candyJumpUseEcstasy as boolean) || false,
      candyJumpQuantity: (state.candyJumpQuantity as number) || DEFAULT_CANDY_QUANTITY,
      candyJumpFactionBenefit: (state.candyJumpFactionBenefit as number) || 0,
      energyJumpEnabled: (state.energyJumpEnabled as boolean) || false,
      energyJumpItemId: (state.energyJumpItemId as number) || ENERGY_ITEM_IDS.ENERGY_5,
      energyJumpQuantity: (state.energyJumpQuantity as number) || DEFAULT_ENERGY_DRINK_QUANTITY,
      energyJumpFactionBenefit: (state.energyJumpFactionBenefit as number) || 0,
      lossReviveEnabled: (state.lossReviveEnabled as boolean) || false,
      lossReviveNumberPerDay: (state.lossReviveNumberPerDay as number) || DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY,
      lossReviveEnergyCost: (state.lossReviveEnergyCost as number) || DEFAULT_LOSS_REVIVE_ENERGY_COST,
      lossReviveDaysBetween: (state.lossReviveDaysBetween as number) || DEFAULT_LOSS_REVIVE_DAYS_BETWEEN,
      lossRevivePricePerLoss: (state.lossRevivePricePerLoss as number) || DEFAULT_LOSS_REVIVE_PRICE,
      diabetesDayEnabled: (state.diabetesDayEnabled as boolean) || false,
      diabetesDayNumberOfJumps: (state.diabetesDayNumberOfJumps as 1 | 2) || 1,
      diabetesDayFHC: (state.diabetesDayFHC as 0 | 1 | 2) || 0,
      diabetesDayGreenEgg: (state.diabetesDayGreenEgg as 0 | 1 | 2) || 0,
      diabetesDaySeasonalMail: (state.diabetesDaySeasonalMail as boolean) || false,
      diabetesDayLogoClick: (state.diabetesDayLogoClick as boolean) || false,
      companyBenefitKey: (state.companyBenefitKey as string) || COMPANY_BENEFIT_TYPES.NONE,
      candleShopStars: (state.candleShopStars as number) || DEFAULT_CANDLE_SHOP_STARS,
      happy: (state.happy as number) || DEFAULT_HAPPY,
      daysSkippedPerMonth: (state.daysSkippedPerMonth as number) || 0,
      statDriftPercent: (state.statDriftPercent as number) || 0,
      balanceAfterGymIndex: (state.balanceAfterGymIndex as number) ?? 19,
      ignorePerksForGymSelection: (state.ignorePerksForGymSelection as boolean) || false,
      islandCostPerDay: (state.islandCostPerDay as number) || DEFAULT_ISLAND_COST_PER_DAY,
    };
    
    return {
      id: (state.id as string) || '1',
      name: (state.name as string) || 'State 1',
      sections: [section],
      showIndividualStats: (state.showIndividualStats as boolean) || false,
    };
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
  const [manualStatDriftPercent, setManualStatDriftPercent] = useState<number>(() => loadSavedValue('manualStatDriftPercent', 0));
  const [manualBalanceAfterGymIndex, setManualBalanceAfterGymIndex] = useState<number>(() => loadSavedValue('manualBalanceAfterGymIndex', 19));
  const [manualIgnorePerksForGymSelection, setManualIgnorePerksForGymSelection] = useState<boolean>(() => loadSavedValue('manualIgnorePerksForGymSelection', false));
  
  // Shared player stats
  const [apiKey, setApiKey] = useState<string>(() => loadSavedValue('apiKey', ''));
  const [initialStats, setInitialStats] = useState(() => 
    loadSavedValue('initialStats', DEFAULT_INITIAL_STATS)
  );
  const [currentGymIndex, setCurrentGymIndex] = useState<number>(() => loadSavedValue('currentGymIndex', 0));
  const [months, setMonths] = useState<number>(() => loadSavedValue('months', DEFAULT_SIMULATION_MONTHS));
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(() => {
    const saved = loadSavedValue<string | null>('simulatedDate', null);
    return saved ? new Date(saved) : null;
  });
  
  // Comparison states
  const [comparisonStates, setComparisonStates] = useState<ComparisonState[]>(() => {
    const savedStates = loadSavedValue<unknown[]>('comparisonStates', []);
    const totalDays = DEFAULT_SIMULATION_MONTHS * 30;
    
    if (savedStates.length === 0) {
      // No saved states, create default state with new format
      return [{
        id: '1',
        name: 'State 1',
        sections: [{
          id: '1',
          startDay: 1,
          endDay: totalDays,
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
          statDriftPercent: 0,
          balanceAfterGymIndex: 19,
          ignorePerksForGymSelection: false,
          islandCostPerDay: DEFAULT_ISLAND_COST_PER_DAY,
        }],
        showIndividualStats: false,
      }];
    }
    
    // Migrate saved states
    return savedStates.map(state => migrateComparisonState(state as Record<string, unknown>, totalDays));
  });
  
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [showCosts, setShowCosts] = useState<boolean>(() => loadSavedValue('showCosts', false));
  const [isLoadingGymStats, setIsLoadingGymStats] = useState<boolean>(false);
  
  // Don't use the hook for auto-fetching, we'll fetch manually with the button
  
  // Fetch item prices for EDVD jumps, xanax, candy items, energy items, and points - only if costs should be shown
  const { data: itemPricesData } = useItemPrices(showCosts ? [
    0, // Points market price
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
  useEffect(() => { localStorage.setItem('gymComparison_manualStatDriftPercent', JSON.stringify(manualStatDriftPercent)); }, [manualStatDriftPercent]);
  useEffect(() => { localStorage.setItem('gymComparison_manualBalanceAfterGymIndex', JSON.stringify(manualBalanceAfterGymIndex)); }, [manualBalanceAfterGymIndex]);
  useEffect(() => { localStorage.setItem('gymComparison_manualIgnorePerksForGymSelection', JSON.stringify(manualIgnorePerksForGymSelection)); }, [manualIgnorePerksForGymSelection]);
  useEffect(() => { localStorage.setItem('gymComparison_apiKey', JSON.stringify(apiKey)); }, [apiKey]);
  useEffect(() => { localStorage.setItem('gymComparison_initialStats', JSON.stringify(initialStats)); }, [initialStats]);
  useEffect(() => { localStorage.setItem('gymComparison_simulatedDate', JSON.stringify(simulatedDate ? simulatedDate.toISOString() : null)); }, [simulatedDate]);
  useEffect(() => { localStorage.setItem('gymComparison_currentGymIndex', JSON.stringify(currentGymIndex)); }, [currentGymIndex]);
  useEffect(() => { localStorage.setItem('gymComparison_months', JSON.stringify(months)); }, [months]);
  useEffect(() => { localStorage.setItem('gymComparison_comparisonStates', JSON.stringify(comparisonStates)); }, [comparisonStates]);
  
  // Auto-simulate when data changes
  useEffect(() => {
    if (mode === 'future' && comparisonStates.length > 0) {
      handleSimulate();
    }
  }, [comparisonStates, initialStats, months, showCosts, itemPricesData, simulatedDate]);
  
  useEffect(() => {
    if (mode === 'manual') {
      handleSimulate();
    }
  }, [manualEnergy, autoUpgradeGyms, manualHappy, initialStats, currentGymIndex, manualStatWeights, manualCompanyBenefitKey, manualCandleShopStars, manualPerkPercs, manualStatDriftPercent, manualBalanceAfterGymIndex, manualIgnorePerksForGymSelection, showCosts, itemPricesData]);
  
  const handleFetchStats = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }
    setError(null);
    
    try {
      setIsLoadingGymStats(true);
      const response = await agent.get<GymStatsResponse>(`/gym/stats?apiKey=${encodeURIComponent(apiKey)}`);
      const data = response.data;
      
      // Update the values with fetched data
      setInitialStats({
        strength: data.battlestats.strength,
        speed: data.battlestats.speed,
        defense: data.battlestats.defense,
        dexterity: data.battlestats.dexterity,
      });
      setCurrentGymIndex(Math.max(0, data.activeGym - 1));
      
      // Update manual mode perk percs
      setManualPerkPercs(data.perkPercs);
      
      // Update perk percs in all sections of all comparison states
      setComparisonStates((prev) => prev.map((state) => ({
        ...state,
        sections: state.sections.map(section => ({
          ...section,
          perkPercs: data.perkPercs,
        })),
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gym stats');
    } finally {
      setIsLoadingGymStats(false);
    }
  };
  
  const handleAddState = () => {
    if (comparisonStates.length >= MAX_COMPARISON_STATES) {
      setError(`Maximum ${MAX_COMPARISON_STATES} comparison states allowed`);
      return;
    }
    
    // Copy values from the current/last state
    const sourceState = comparisonStates[activeTabIndex] || comparisonStates[comparisonStates.length - 1];
    const totalDays = months * 30;
    
    // Copy the first section from the source state as a template
    const sourceSection = sourceState.sections[0];
    
    const newState: ComparisonState = {
      id: Date.now().toString(),
      name: `State ${comparisonStates.length + 1}`,
      sections: [{
        ...sourceSection,
        id: '1',
        startDay: 1,
        endDay: totalDays,
      }],
      showIndividualStats: false,
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
  
  // Helper function to simulate gym progression with multiple sections
  const simulateWithSections = (
    state: ComparisonState,
    totalMonths: number,
    currentGym: number,
    initStats: { strength: number; speed: number; defense: number; dexterity: number },
    showCost: boolean,
    itemPrices?: ItemPrices
  ): SimulationResult => {
    const totalDays = totalMonths * 30;
    const sections = [...state.sections].sort((a, b) => a.startDay - b.startDay);
    
    // Validate sections
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section.startDay < 1 || section.endDay > totalDays) {
        throw new Error(`Section ${i + 1} has invalid day range`);
      }
      if (i > 0 && sections[i - 1].endDay + 1 !== section.startDay) {
        throw new Error(`Gap between sections ${i} and ${i + 1}`);
      }
    }
    
    // Run simulation for each section, chaining the end stats to the next section's initial stats
    let currentStats = { ...initStats };
    const allSnapshots: DailySnapshot[] = [];
    
    // Tracking for aggregated results
    let totalEdvdJumps = 0;
    let totalEdvdCost = 0;
    const edvdGains = { strength: 0, speed: 0, defense: 0, dexterity: 0 };
    let totalXanaxCost = 0;
    let totalPointsCost = 0;
    let totalCandyCost = 0;
    let totalEnergyCost = 0;
    let totalLossReviveIncome = 0;
    let totalIslandCost = 0;
    const diabetesDayGains = { strength: 0, speed: 0, defense: 0, dexterity: 0 };
    let ddJump1Gains: { strength: number; speed: number; defense: number; dexterity: number } | undefined;
    let ddJump2Gains: { strength: number; speed: number; defense: number; dexterity: number } | undefined;
    
    for (const section of sections) {
      const sectionDays = section.endDay - section.startDay + 1;
      const sectionMonths = sectionDays / 30;
      
      const benefit = getCompanyBenefit(section.companyBenefitKey, section.candleShopStars);
      
      const inputs: SimulationInputs = {
        statWeights: section.statWeights,
        months: sectionMonths,
        xanaxPerDay: section.xanaxPerDay,
        hasPointsRefill: section.hasPointsRefill,
        hoursPlayedPerDay: section.hoursPlayedPerDay,
        maxEnergy: section.maxEnergy,
        companyBenefit: benefit,
        apiKey,
        initialStats: currentStats,
        happy: section.happy,
        perkPercs: section.perkPercs,
        currentGymIndex: currentGym,
        lockGym: false,
        statDriftPercent: section.statDriftPercent,
        balanceAfterGymIndex: section.balanceAfterGymIndex,
        ignorePerksForGymSelection: section.ignorePerksForGymSelection,
        edvdJump: section.edvdJumpEnabled ? {
          enabled: true,
          frequencyDays: section.edvdJumpFrequency,
          dvdsUsed: section.edvdJumpDvds,
          limit: section.edvdJumpLimit,
          count: section.edvdJumpCount,
          statTarget: section.edvdJumpStatTarget,
          adultNovelties: section.edvdJumpAdultNovelties,
        } : undefined,
        diabetesDay: section.diabetesDayEnabled ? {
          enabled: true,
          numberOfJumps: section.diabetesDayNumberOfJumps,
          featheryHotelCoupon: section.diabetesDayFHC,
          greenEgg: section.diabetesDayGreenEgg,
          seasonalMail: section.diabetesDaySeasonalMail,
          logoEnergyClick: section.diabetesDayLogoClick,
        } : undefined,
        candyJump: section.candyJumpEnabled ? {
          enabled: true,
          itemId: section.candyJumpItemId,
          useEcstasy: section.candyJumpUseEcstasy,
          quantity: section.candyJumpQuantity,
          factionBenefitPercent: section.candyJumpFactionBenefit,
        } : undefined,
        energyJump: section.energyJumpEnabled ? {
          enabled: true,
          itemId: section.energyJumpItemId,
          quantity: section.energyJumpQuantity,
          factionBenefitPercent: section.energyJumpFactionBenefit,
        } : undefined,
        lossRevive: section.lossReviveEnabled ? {
          enabled: true,
          numberPerDay: section.lossReviveNumberPerDay,
          energyCost: section.lossReviveEnergyCost,
          daysBetween: section.lossReviveDaysBetween,
          pricePerLoss: section.lossRevivePricePerLoss,
        } : undefined,
        daysSkippedPerMonth: section.daysSkippedPerMonth,
        islandCostPerDay: showCost ? section.islandCostPerDay : undefined,
        simulatedDate: simulatedDate,
        itemPrices: (showCost && itemPrices) ? {
          dvdPrice: itemPrices.prices[366],
          xanaxPrice: itemPrices.prices[206],
          ecstasyPrice: itemPrices.prices[196],
          candyEcstasyPrice: itemPrices.prices[197],
          pointsPrice: itemPrices.prices[0],
          candyPrices: {
            310: itemPrices.prices[310],
            36: itemPrices.prices[36],
            528: itemPrices.prices[528],
            529: itemPrices.prices[529],
            151: itemPrices.prices[151],
          },
          energyPrices: {
            985: itemPrices.prices[985],
            986: itemPrices.prices[986],
            987: itemPrices.prices[987],
            530: itemPrices.prices[530],
            532: itemPrices.prices[532],
            533: itemPrices.prices[533],
            367: itemPrices.prices[367],
          },
        } : undefined,
      };
      
      const sectionResult = simulateGymProgression(AVAILABLE_GYMS, inputs);
      
      // Adjust day numbers in snapshots to be relative to the total simulation
      const adjustedSnapshots = sectionResult.dailySnapshots.map(snapshot => ({
        ...snapshot,
        day: snapshot.day + section.startDay - 1,
      }));
      
      allSnapshots.push(...adjustedSnapshots);
      
      // Update current stats for next section
      currentStats = sectionResult.finalStats;
      
      // Aggregate costs and gains
      if (sectionResult.edvdJumpCosts) {
        totalEdvdJumps += sectionResult.edvdJumpCosts.totalJumps;
        totalEdvdCost += sectionResult.edvdJumpCosts.totalCost;
      }
      if (sectionResult.edvdJumpGains) {
        edvdGains.strength += sectionResult.edvdJumpGains.totalGains.strength;
        edvdGains.speed += sectionResult.edvdJumpGains.totalGains.speed;
        edvdGains.defense += sectionResult.edvdJumpGains.totalGains.defense;
        edvdGains.dexterity += sectionResult.edvdJumpGains.totalGains.dexterity;
      }
      if (sectionResult.xanaxCosts) {
        totalXanaxCost += sectionResult.xanaxCosts.totalCost;
      }
      if (sectionResult.pointsRefillCosts) {
        totalPointsCost += sectionResult.pointsRefillCosts.totalCost;
      }
      if (sectionResult.candyJumpCosts) {
        totalCandyCost += sectionResult.candyJumpCosts.totalCost;
      }
      if (sectionResult.energyJumpCosts) {
        totalEnergyCost += sectionResult.energyJumpCosts.totalCost;
      }
      if (sectionResult.lossReviveIncome) {
        totalLossReviveIncome += sectionResult.lossReviveIncome.totalIncome;
      }
      if (sectionResult.islandCosts) {
        totalIslandCost += sectionResult.islandCosts.totalCost;
      }
      if (sectionResult.diabetesDayTotalGains) {
        diabetesDayGains.strength += sectionResult.diabetesDayTotalGains.strength;
        diabetesDayGains.speed += sectionResult.diabetesDayTotalGains.speed;
        diabetesDayGains.defense += sectionResult.diabetesDayTotalGains.defense;
        diabetesDayGains.dexterity += sectionResult.diabetesDayTotalGains.dexterity;
      }
      if (sectionResult.diabetesDayJump1Gains && !ddJump1Gains) {
        ddJump1Gains = sectionResult.diabetesDayJump1Gains;
      }
      if (sectionResult.diabetesDayJump2Gains && !ddJump2Gains) {
        ddJump2Gains = sectionResult.diabetesDayJump2Gains;
      }
    }
    
    // Build final result
    const finalResult: SimulationResult = {
      dailySnapshots: allSnapshots,
      finalStats: currentStats,
    };
    
    // Add aggregated cost information
    if (totalEdvdJumps > 0 && totalEdvdCost > 0) {
      finalResult.edvdJumpCosts = {
        totalJumps: totalEdvdJumps,
        costPerJump: totalEdvdCost / totalEdvdJumps,
        totalCost: totalEdvdCost,
      };
      finalResult.edvdJumpGains = {
        averagePerJump: {
          strength: edvdGains.strength / totalEdvdJumps,
          speed: edvdGains.speed / totalEdvdJumps,
          defense: edvdGains.defense / totalEdvdJumps,
          dexterity: edvdGains.dexterity / totalEdvdJumps,
        },
        totalGains: edvdGains,
      };
    }
    if (totalXanaxCost > 0) {
      finalResult.xanaxCosts = { totalCost: totalXanaxCost };
    }
    if (totalPointsCost > 0) {
      finalResult.pointsRefillCosts = { totalCost: totalPointsCost };
    }
    if (totalCandyCost > 0) {
      const totalCandyDays = sections.reduce((sum, s) => sum + (s.candyJumpEnabled ? (s.endDay - s.startDay + 1) : 0), 0);
      finalResult.candyJumpCosts = {
        totalDays: totalCandyDays,
        costPerDay: totalCandyDays > 0 ? totalCandyCost / totalCandyDays : 0,
        totalCost: totalCandyCost,
      };
    }
    if (totalEnergyCost > 0) {
      const totalEnergyDays = sections.reduce((sum, s) => sum + (s.energyJumpEnabled ? (s.endDay - s.startDay + 1) : 0), 0);
      finalResult.energyJumpCosts = {
        totalDays: totalEnergyDays,
        costPerDay: totalEnergyDays > 0 ? totalEnergyCost / totalEnergyDays : 0,
        totalCost: totalEnergyCost,
      };
    }
    if (totalLossReviveIncome > 0) {
      const totalLossReviveDays = sections.reduce((sum, s) => {
        if (!s.lossReviveEnabled) return sum;
        const sectionDays = s.endDay - s.startDay + 1;
        return sum + Math.floor(sectionDays / s.lossReviveDaysBetween);
      }, 0);
      finalResult.lossReviveIncome = {
        totalDays: totalLossReviveDays,
        incomePerDay: totalLossReviveDays > 0 ? totalLossReviveIncome / totalLossReviveDays : 0,
        totalIncome: totalLossReviveIncome,
      };
    }
    if (totalIslandCost > 0) {
      finalResult.islandCosts = {
        costPerDay: totalIslandCost / totalDays,
        totalCost: totalIslandCost,
      };
    }
    if (diabetesDayGains.strength + diabetesDayGains.speed + diabetesDayGains.defense + diabetesDayGains.dexterity > 0) {
      finalResult.diabetesDayTotalGains = diabetesDayGains;
    }
    if (ddJump1Gains) {
      finalResult.diabetesDayJump1Gains = ddJump1Gains;
    }
    if (ddJump2Gains) {
      finalResult.diabetesDayJump2Gains = ddJump2Gains;
    }
    
    return finalResult;
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
          statDriftPercent: manualStatDriftPercent,
          balanceAfterGymIndex: manualBalanceAfterGymIndex,
          ignorePerksForGymSelection: manualIgnorePerksForGymSelection,
        };
        
        const result = simulateGymProgression(AVAILABLE_GYMS, inputs);
        setResults({ manual: result });
      } else {
        const newResults: Record<string, SimulationResult> = {};
        
        for (const state of comparisonStates) {
          const result = simulateWithSections(state, months, currentGymIndex, initialStats, showCosts, itemPricesData);
          newResults[state.id] = result;
        }
        
        setResults(newResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };
  
  // Custom chart data preparation
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
        const totalDays = (typeof settings.months === 'number' ? settings.months : months) * 30;
        const loadedStates = settings.comparisonStates.map((state: unknown, index: number) => {
          if (typeof state === 'object' && state !== null) {
            const s = state as Record<string, unknown>;
            // Use migration function to convert old or new format
            const migrated = migrateComparisonState(s, totalDays);
            // Update id and name
            migrated.id = Date.now().toString() + index;
            migrated.name = typeof s.name === 'string' ? s.name : `State ${index + 1}`;
            return migrated;
          }
          // Fallback for invalid state
          return migrateComparisonState({}, totalDays);
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
            points: result.pointsRefillCosts?.totalCost || 0,
            candy: result.candyJumpCosts?.totalCost || 0,
            energy: result.energyJumpCosts?.totalCost || 0,
            lossReviveIncome: result.lossReviveIncome?.totalIncome || 0,
            island: result.islandCosts?.totalCost || 0,
            total: (result.edvdJumpCosts?.totalCost || 0) + 
                   (result.xanaxCosts?.totalCost || 0) + 
                   (result.pointsRefillCosts?.totalCost || 0) + 
                   (result.candyJumpCosts?.totalCost || 0) + 
                   (result.energyJumpCosts?.totalCost || 0) + 
                   (result.islandCosts?.totalCost || 0) - 
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
      
      <Box sx={{ mb: 3 }}>
        {/* First row: Mode selection buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Button variant={mode === 'future' ? 'contained' : 'outlined'} onClick={() => setMode('future')}>
            Future Comparison
          </Button>
          <Button variant={mode === 'manual' ? 'contained' : 'outlined'} onClick={() => setMode('manual')}>
            Manual Testing
          </Button>
        </Box>
        
        {/* Second row: Configuration and utility buttons - responsive layout */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <SaveConfigurationButton getCurrentSettings={getCurrentSettings} />
          <LoadConfigurationButton onLoadSettings={loadSettingsFromReport} />
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel 
              control={<Switch checked={showCosts} onChange={(e) => setShowCosts(e.target.checked)} />} 
              label="Include Cost Estimates" 
            />
          </Box>
        </Box>
      </Box>

      {mode === 'future' && (
        <>
          <PlayerStatsSection
            apiKey={apiKey}
            setApiKey={setApiKey}
            initialStats={initialStats}
            setInitialStats={setInitialStats}
            currentGymIndex={currentGymIndex}
            setCurrentGymIndex={setCurrentGymIndex}
            months={months}
            setMonths={setMonths}
            isLoadingGymStats={isLoadingGymStats}
            handleFetchStats={handleFetchStats}
            simulatedDate={simulatedDate}
            setSimulatedDate={setSimulatedDate}
          />

          <ComparisonSelector
            comparisonStates={comparisonStates}
            activeTabIndex={activeTabIndex}
            setActiveTabIndex={setActiveTabIndex}
            handleAddState={handleAddState}
            maxStatesReached={comparisonStates.length >= MAX_COMPARISON_STATES}
          />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {activeState && (
            <SectionedComparisonConfig
              activeState={activeState}
              updateState={updateState}
              handleRemoveState={handleRemoveState}
              canRemoveState={comparisonStates.length > 1}
              showCosts={showCosts}
              itemPricesData={itemPricesData}
              result={results[activeState.id]}
              initialStats={initialStats}
              months={months}
            />
          )}

          {/* Results Section */}
          {Object.keys(results).length > 0 && (
            <ResultsSection
              chartData={chartData}
              comparisonStates={comparisonStates.map(state => ({
                id: state.id,
                name: state.name,
                diabetesDayEnabled: state.sections.some(s => s.diabetesDayEnabled),
                edvdJumpEnabled: state.sections.some(s => s.edvdJumpEnabled),
                statDriftPercent: state.sections[0]?.statDriftPercent,
                balanceAfterGymIndex: state.sections[0]?.balanceAfterGymIndex,
              }))}
              results={results}
              initialStats={initialStats}
              months={months}
              showCosts={showCosts}
              itemPricesData={itemPricesData}
            />
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
        <ManualTestingSection
          initialStats={initialStats}
          setInitialStats={setInitialStats}
          manualEnergy={manualEnergy}
          setManualEnergy={setManualEnergy}
          manualHappy={manualHappy}
          setManualHappy={setManualHappy}
          autoUpgradeGyms={autoUpgradeGyms}
          setAutoUpgradeGyms={setAutoUpgradeGyms}
          currentGymIndex={currentGymIndex}
          setCurrentGymIndex={setCurrentGymIndex}
          manualStatWeights={manualStatWeights}
          setManualStatWeights={setManualStatWeights}
          manualPerkPercs={manualPerkPercs}
          setManualPerkPercs={setManualPerkPercs}
          manualCompanyBenefitKey={manualCompanyBenefitKey}
          setManualCompanyBenefitKey={setManualCompanyBenefitKey}
          manualCandleShopStars={manualCandleShopStars}
          setManualCandleShopStars={setManualCandleShopStars}
          manualStatDriftPercent={manualStatDriftPercent}
          setManualStatDriftPercent={setManualStatDriftPercent}
          manualBalanceAfterGymIndex={manualBalanceAfterGymIndex}
          setManualBalanceAfterGymIndex={setManualBalanceAfterGymIndex}
          manualIgnorePerksForGymSelection={manualIgnorePerksForGymSelection}
          setManualIgnorePerksForGymSelection={setManualIgnorePerksForGymSelection}
          results={results.manual}
        />
      )}
      
      {/* Support and Problem Report Cards */}
      <Grid container spacing={2} sx={{ mt: 8 }}>
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
