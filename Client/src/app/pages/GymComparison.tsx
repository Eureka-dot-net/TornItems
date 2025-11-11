import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  simulateGymProgression,
  type SimulationInputs,
  type SimulationResult,
  type StatWeights,
} from '../../lib/utils/gymProgressionCalculator';
import { useGymStats } from '../../lib/hooks/useGymStats';
import { useItemPrices } from '../../lib/hooks/useItemPrices';
import { formatCurrency } from '../../lib/utils/gymHelpers';
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
  COMPANY_BENEFIT_TYPES,
} from '../../lib/constants/gymConstants';
import { GYMS } from '../../lib/data/gymData';
import { getCompanyBenefit } from '../../lib/utils/companyBenefits';
import { getHanksRatio, getBaldrsRatio, getDefensiveBuildRatio } from '../../lib/utils/statWeightPresets';
import PlayerStatsSection from '../components/gymComparison/PlayerStatsSection';
import ComparisonSelector from '../components/gymComparison/ComparisonSelector';
import ComparisonConfiguration from '../components/gymComparison/ComparisonConfiguration';
import ChartSection from '../components/gymComparison/charts/ChartSection';
import ManualTestingConfiguration from '../components/gymComparison/ManualTestingConfiguration';
import ManualTestingResults from '../components/gymComparison/ManualTestingResults';
import BuyMeXanaxCard from '../components/gymComparison/BuyMeXanaxCard';
import ReportProblemCard from '../components/gymComparison/ReportProblemCard';
import LoadSettingsButton from '../components/gymComparison/LoadSettingsButton';
import SaveConfigurationButton from '../components/gymComparison/SaveConfigurationButton';
import LoadConfigurationButton from '../components/gymComparison/LoadConfigurationButton';
import { exportGymComparisonData, type ExportData } from '../../lib/utils/exportHelpers';

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
          {/* Player Stats */}
          <PlayerStatsSection
            apiKey={apiKey}
            setApiKey={setApiKey}
            initialStats={initialStats}
            setInitialStats={setInitialStats}
            months={months}
            setMonths={setMonths}
            currentGymIndex={currentGymIndex}
            setCurrentGymIndex={setCurrentGymIndex}
            gyms={GYMS}
            isLoadingGymStats={isLoadingGymStats}
            onFetchStats={handleFetchStats}
          />

          {/* Comparison Selector */}
          <ComparisonSelector
            comparisonStates={comparisonStates}
            activeTabIndex={activeTabIndex}
            onTabChange={setActiveTabIndex}
            onAddComparison={handleAddState}
            maxComparisonStates={MAX_COMPARISON_STATES}
          />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Comparison Configuration */}
          {activeState && (
            <ComparisonConfiguration
              state={activeState}
              canDelete={comparisonStates.length > 1}
              companyBenefit={getCompanyBenefit(activeState.companyBenefitKey, activeState.candleShopStars)}
              showCosts={showCosts}
              itemPricesData={itemPricesData}
              onUpdate={(updates) => updateState(activeState.id, updates)}
              onDelete={() => handleRemoveState(activeState.id)}
              getHanksRatio={getHanksRatio}
              getBaldrsRatio={getBaldrsRatio}
              getDefensiveBuildRatio={getDefensiveBuildRatio}
            />
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
                      <ChartSection
                        chartData={chartData}
                        comparisonStates={comparisonStates}
                        results={results}
                        chartColors={CHART_COLORS}
                        showCosts={showCosts}
                        itemPricesData={itemPricesData}
                      />

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
                        <ChartSection
                          chartData={chartData}
                          comparisonStates={comparisonStates}
                          results={results}
                          chartColors={CHART_COLORS}
                          showCosts={showCosts}
                          itemPricesData={itemPricesData}
                        />
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
            <ManualTestingConfiguration
              initialStats={initialStats}
              manualEnergy={manualEnergy}
              setManualEnergy={setManualEnergy}
              manualHappy={manualHappy}
              setManualHappy={setManualHappy}
              autoUpgradeGyms={autoUpgradeGyms}
              setAutoUpgradeGyms={setAutoUpgradeGyms}
              currentGymIndex={currentGymIndex}
              setCurrentGymIndex={setCurrentGymIndex}
              gyms={GYMS}
              manualStatWeights={manualStatWeights}
              setManualStatWeights={setManualStatWeights}
              manualPerkPercs={manualPerkPercs}
              setManualPerkPercs={setManualPerkPercs}
              manualCompanyBenefitKey={manualCompanyBenefitKey}
              setManualCompanyBenefitKey={setManualCompanyBenefitKey}
              manualCandleShopStars={manualCandleShopStars}
              setManualCandleShopStars={setManualCandleShopStars}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 8 }}>
            <ManualTestingResults
              result={results.manual}
              initialStats={initialStats}
              onUseAsInitialStats={() => {
                if (results.manual) {
                  setInitialStats({
                    strength: Math.round(results.manual.finalStats.strength),
                    speed: Math.round(results.manual.finalStats.speed),
                    defense: Math.round(results.manual.finalStats.defense),
                    dexterity: Math.round(results.manual.finalStats.dexterity),
                  });
                }
              }}
            />
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
