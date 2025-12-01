import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  Paper,
  Collapse,
  IconButton,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import {
  simulateGymProgression,
  type SimulationInputs,
  type SimulationResult,
} from '../../lib/utils/gymProgressionCalculator';
import { type HistoricalStat } from '../../lib/hooks/useHistoricalStats';
import { useItemPrices } from '../../lib/hooks/useItemPrices';
import { getCompanyBenefit, type StatWeights } from '../../lib/utils/gymHelpers';
import { simulateWithSections, type TrainingSection } from '../../lib/utils/sectionSimulator';
import { fetchGymStatsFromTorn, calculatePerkPercentages } from '../../lib/utils/tornApiHelpers';
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
import ThankYouCard from '../components/gymComparison/ThankYouCard';
import ReportProblemCard from '../components/gymComparison/ReportProblemCard';
import LoadSettingsButton from '../components/gymComparison/LoadSettingsButton';
import SaveConfigurationButton from '../components/gymComparison/SaveConfigurationButton';
import LoadConfigurationButton from '../components/gymComparison/LoadConfigurationButton';
import ClearConfigurationButton from '../components/gymComparison/ClearConfigurationButton';
import PlayerStatsSection from '../components/gymComparison/PlayerStatsSection';
import ComparisonSelector from '../components/gymComparison/ComparisonSelector';
import SectionedComparisonConfig from '../components/gymComparison/SectionedComparisonConfig';
import ManualTestingSection from '../components/gymComparison/ManualTestingSection';
import ResultsSection from '../components/gymComparison/ResultsSection';
import { exportGymComparisonData, type ExportData } from '../../lib/utils/exportHelpers';

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
      pointsRefillDaysPerWeek: (state.pointsRefillDaysPerWeek as number) || 7,
      maxEnergy: (state.maxEnergy as number) || MAX_ENERGY_DEFAULT,
      perkPercs: (state.perkPercs as { strength: number; speed: number; defense: number; dexterity: number }) || DEFAULT_PERK_PERCS,
      edvdJumpEnabled: (state.edvdJumpEnabled as boolean) || false,
      edvdJumpFrequency: (state.edvdJumpFrequency as number) || DEFAULT_EDVD_FREQUENCY_DAYS,
      edvdJumpDvds: (state.edvdJumpDvds as number) || DEFAULT_EDVD_DVDS,
      edvdJumpLimit: (state.edvdJumpLimit as 'indefinite' | 'count' | 'stat') || 'indefinite',
      edvdJumpCount: (state.edvdJumpCount as number) || 10,
      edvdJumpStatTarget: (state.edvdJumpStatTarget as number) || 140000,
      edvdJumpAdultNovelties: (state.edvdJumpAdultNovelties as boolean) || false,
      candyJumpEnabled: (state.candyJumpEnabled as boolean) || false,
      candyJumpFrequencyDays: (state.candyJumpFrequencyDays as number) || 1,
      candyJumpItemId: (state.candyJumpItemId as number) || CANDY_ITEM_IDS.HAPPY_25,
      candyJumpQuantity: (state.candyJumpQuantity as number) || DEFAULT_CANDY_QUANTITY,
      candyJumpFactionBenefit: (state.candyJumpFactionBenefit as number) || 0,
      // Migrate old candyJumpUseEcstasy field to new drugUsed field
      candyJumpDrugUsed: (state.candyJumpDrugUsed as 'none' | 'xanax' | 'ecstasy') || 
                         ((state.candyJumpUseEcstasy as boolean) ? 'ecstasy' : 'none'),
      candyJumpDrugAlreadyIncluded: (state.candyJumpDrugAlreadyIncluded as boolean) ?? true,
      candyJumpUsePointRefill: (state.candyJumpUsePointRefill as boolean) ?? (state.hasPointsRefill as boolean) ?? true,
      stackedCandyJumpEnabled: (state.stackedCandyJumpEnabled as boolean) || false,
      stackedCandyJumpFrequency: (state.stackedCandyJumpFrequency as number) || DEFAULT_EDVD_FREQUENCY_DAYS,
      stackedCandyJumpItemId: (state.stackedCandyJumpItemId as number) || CANDY_ITEM_IDS.HAPPY_75,
      stackedCandyJumpQuantity: (state.stackedCandyJumpQuantity as number) || DEFAULT_CANDY_QUANTITY,
      stackedCandyJumpFactionBenefit: (state.stackedCandyJumpFactionBenefit as number) || 0,
      stackedCandyJumpLimit: (state.stackedCandyJumpLimit as 'indefinite' | 'count' | 'stat') || 'indefinite',
      stackedCandyJumpCount: (state.stackedCandyJumpCount as number) || 10,
      stackedCandyJumpStatTarget: (state.stackedCandyJumpStatTarget as number) || 10000000,
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
  const [gymProgressPercent, setGymProgressPercent] = useState<number>(() => loadSavedValue('gymProgressPercent', 0));
  const [months, setMonths] = useState<number>(() => loadSavedValue('months', DEFAULT_SIMULATION_MONTHS));
  const [durationUnit, setDurationUnit] = useState<'days' | 'weeks' | 'months'>(() => loadSavedValue('durationUnit', 'months'));
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(() => {
    const saved = loadSavedValue<string | null>('simulatedDate', null);
    return saved ? new Date(saved) : null;
  });
  
  // Track if stats were successfully fetched with API key
  const [statsFetchedWithApiKey, setStatsFetchedWithApiKey] = useState<boolean>(() => loadSavedValue('statsFetchedWithApiKey', false));
  
  // Check if user came from wizard (persisted until cleared)
  const [cameFromWizard] = useState<boolean>(() => localStorage.getItem('gymComparison_fromWizard') === 'true');
  
  // Comparison states - use the actual loaded months value for initialization
  const [comparisonStates, setComparisonStates] = useState<ComparisonState[]>(() => {
    const savedStates = loadSavedValue<unknown[]>('comparisonStates', []);
    const loadedMonths = loadSavedValue<number>('months', DEFAULT_SIMULATION_MONTHS);
    const totalDays = loadedMonths * 30;
    
    // IMPORTANT: When coming from wizard, we need to ignore any previously saved comparison states
    // and create fresh states with the correct endDay matching the wizard's months value.
    // This prevents validation errors where old saved states have endDay values that exceed
    // the new totalDays from the wizard. Without this check, users get an error like
    // "Section dates exceed the total duration" when coming from the wizard.
    // The fromWizard flag is set by the wizard and cleared by the useEffect below after scrolling.
    const fromWizard = localStorage.getItem('gymComparison_fromWizard') === 'true';
    const shouldUseSavedStates = savedStates.length > 0 && !fromWizard;
    
    if (!shouldUseSavedStates) {
      // Check if wizard values exist
      const wizardStatWeights = loadSavedValue<StatWeights | null>('wizardStatWeights', null);
      const wizardStatDriftPercent = loadSavedValue<number | null>('wizardStatDriftPercent', null);
      const wizardBalanceAfterGymIndex = loadSavedValue<number | null>('wizardBalanceAfterGymIndex', null);
      const wizardIgnorePerksForGymSelection = loadSavedValue<boolean | null>('wizardIgnorePerksForGymSelection', null);
      const wizardPerkPercs = loadSavedValue<{ strength: number; speed: number; defense: number; dexterity: number } | null>('perkPercs', null);
      const wizardBaseHappy = loadSavedValue<number | null>('baseHappy', null);
      const wizardCompanyBenefitKey = loadSavedValue<string | null>('wizardCompanyBenefitKey', null);
      const wizardCandleShopStars = loadSavedValue<number | null>('wizardCandleShopStars', null);
      const wizardHoursPlayedPerDay = loadSavedValue<number | null>('hoursPlayedPerDay', null);
      const wizardXanaxPerDay = loadSavedValue<number | null>('xanaxPerDay', null);
      const wizardHasPointsRefill = loadSavedValue<boolean | null>('hasPointsRefill', null);
      const wizardMaxEnergy = loadSavedValue<number | null>('maxEnergy', null);
      const wizardDaysSkippedPerMonth = loadSavedValue<number | null>('daysSkippedPerMonth', null);
      const wizardLossReviveEnabled = loadSavedValue<boolean | null>('lossReviveEnabled', null);
      const wizardLossReviveNumberPerDay = loadSavedValue<number | null>('lossReviveNumberPerDay', null);
      const wizardLossReviveEnergyCost = loadSavedValue<number | null>('lossReviveEnergyCost', null);
      const wizardLossReviveDaysBetween = loadSavedValue<number | null>('lossReviveDaysBetween', null);
      const wizardLossRevivePricePerLoss = loadSavedValue<number | null>('lossRevivePricePerLoss', null);

      // Create the "Current" state with new format
      const currentState: ComparisonState = {
        id: '1',
        name: fromWizard ? 'Current' : 'State 1',
        sections: [{
          id: '1',
          startDay: 1,
          endDay: totalDays,
          statWeights: wizardStatWeights || DEFAULT_STAT_WEIGHTS,
          hoursPlayedPerDay: wizardHoursPlayedPerDay ?? DEFAULT_HOURS_PER_DAY,
          xanaxPerDay: wizardXanaxPerDay ?? DEFAULT_XANAX_PER_DAY,
          hasPointsRefill: wizardHasPointsRefill ?? true,
          pointsRefillDaysPerWeek: 7,
          maxEnergy: wizardMaxEnergy ?? MAX_ENERGY_DEFAULT,
          perkPercs: wizardPerkPercs || DEFAULT_PERK_PERCS,
          edvdJumpEnabled: false,
          edvdJumpFrequency: DEFAULT_EDVD_FREQUENCY_DAYS,
          edvdJumpDvds: DEFAULT_EDVD_DVDS,
          edvdJumpLimit: 'indefinite',
          edvdJumpCount: 10,
          edvdJumpStatTarget: 140000,
          edvdJumpAdultNovelties: false,
          candyJumpEnabled: false,
          candyJumpFrequencyDays: 1,
          candyJumpItemId: CANDY_ITEM_IDS.HAPPY_25,
          candyJumpQuantity: DEFAULT_CANDY_QUANTITY,
          candyJumpFactionBenefit: 0,
          candyJumpDrugUsed: 'none',
          candyJumpDrugAlreadyIncluded: true,
          candyJumpUsePointRefill: true,
          stackedCandyJumpEnabled: false,
          stackedCandyJumpFrequency: DEFAULT_EDVD_FREQUENCY_DAYS,
          stackedCandyJumpItemId: CANDY_ITEM_IDS.HAPPY_75,
          stackedCandyJumpQuantity: DEFAULT_CANDY_QUANTITY,
          stackedCandyJumpFactionBenefit: 0,
          stackedCandyJumpLimit: 'indefinite',
          stackedCandyJumpCount: 10,
          stackedCandyJumpStatTarget: 10000000,
          energyJumpEnabled: false,
          energyJumpItemId: ENERGY_ITEM_IDS.ENERGY_5,
          energyJumpQuantity: DEFAULT_ENERGY_DRINK_QUANTITY,
          energyJumpFactionBenefit: 0,
          lossReviveEnabled: wizardLossReviveEnabled ?? false,
          lossReviveNumberPerDay: wizardLossReviveNumberPerDay ?? DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY,
          lossReviveEnergyCost: wizardLossReviveEnergyCost ?? DEFAULT_LOSS_REVIVE_ENERGY_COST,
          lossReviveDaysBetween: wizardLossReviveDaysBetween ?? DEFAULT_LOSS_REVIVE_DAYS_BETWEEN,
          lossRevivePricePerLoss: wizardLossRevivePricePerLoss ?? DEFAULT_LOSS_REVIVE_PRICE,
          diabetesDayEnabled: false,
          diabetesDayNumberOfJumps: 1,
          diabetesDayFHC: 0,
          diabetesDayGreenEgg: 0,
          diabetesDaySeasonalMail: false,
          diabetesDayLogoClick: false,
          companyBenefitKey: wizardCompanyBenefitKey ?? COMPANY_BENEFIT_TYPES.NONE,
          candleShopStars: wizardCandleShopStars ?? DEFAULT_CANDLE_SHOP_STARS,
          happy: wizardBaseHappy ?? DEFAULT_HAPPY,
          daysSkippedPerMonth: wizardDaysSkippedPerMonth ?? 0,
          statDriftPercent: wizardStatDriftPercent ?? 0,
          balanceAfterGymIndex: wizardBalanceAfterGymIndex ?? 19,
          ignorePerksForGymSelection: wizardIgnorePerksForGymSelection ?? false,
          islandCostPerDay: DEFAULT_ISLAND_COST_PER_DAY,
        }],
        showIndividualStats: false,
      };
      
      // Check if there are comparison page selections from wizard
      const comparisonPageSelections = loadSavedValue<{
        energySources: boolean;
        happyPerks: boolean;
        companyBenefits: boolean;
        statTargetRatios: boolean;
        trainingRegime: boolean;
        lossRevive: boolean;
      } | null>('wizardComparisonPageSelections', null);
      
      // Check the comparison mode (separate or combined)
      const comparisonMode = loadSavedValue<'separate' | 'combined'>('wizardComparisonMode', 'separate');
      
      // If comparison selections exist, create comparison state(s)
      if (fromWizard && comparisonPageSelections && Object.values(comparisonPageSelections).some(v => v)) {
        // Load comparison-specific values (from gymWizard_comparison_ prefix)
        const loadComparisonValue = <T,>(key: string, defaultValue: T): T => {
          try {
            const saved = localStorage.getItem(`gymWizard_comparison_${key}`);
            return saved ? JSON.parse(saved) : defaultValue;
          } catch {
            return defaultValue;
          }
        };
        
        // Define area configurations
        const areaConfigs: Array<{
          key: keyof typeof comparisonPageSelections;
          name: string;
          apply: (section: typeof currentState.sections[0]) => void;
        }> = [];
        
        if (comparisonPageSelections.energySources) {
          areaConfigs.push({
            key: 'energySources',
            name: 'Energy',
            apply: (section) => {
              const compIsSubscriber = loadComparisonValue<'yes' | 'no' | null>('isSubscriber', null);
              const compMaxEnergy = compIsSubscriber === 'yes' ? 150 : compIsSubscriber === 'no' ? 100 : (wizardMaxEnergy ?? MAX_ENERGY_DEFAULT);
              section.maxEnergy = compMaxEnergy;
              section.hoursPlayedPerDay = loadComparisonValue('hoursPlayedPerDay', section.hoursPlayedPerDay);
              section.xanaxPerDay = loadComparisonValue('xanaxPerDay', section.xanaxPerDay);
              section.hasPointsRefill = loadComparisonValue('hasPointsRefill', section.hasPointsRefill);
              section.daysSkippedPerMonth = loadComparisonValue('daysSkippedPerMonth', section.daysSkippedPerMonth);
            },
          });
        }
        
        if (comparisonPageSelections.happyPerks) {
          areaConfigs.push({
            key: 'happyPerks',
            name: 'Happy',
            apply: (section) => {
              section.happy = loadComparisonValue('baseHappy', section.happy);
              const compPerkPercs = loadComparisonValue<{ strength: number; speed: number; defense: number; dexterity: number } | null>('perkPercs', null);
              if (compPerkPercs) {
                section.perkPercs = compPerkPercs;
              }
            },
          });
        }
        
        if (comparisonPageSelections.companyBenefits) {
          areaConfigs.push({
            key: 'companyBenefits',
            name: 'Company',
            apply: (section) => {
              section.companyBenefitKey = loadComparisonValue('companyBenefitKey', section.companyBenefitKey);
              section.candleShopStars = loadComparisonValue('candleShopStars', section.candleShopStars);
            },
          });
        }
        
        if (comparisonPageSelections.statTargetRatios) {
          areaConfigs.push({
            key: 'statTargetRatios',
            name: 'Ratios',
            apply: (section) => {
              const compHasBalancedBuild = loadComparisonValue<'yes' | 'no' | null>('hasBalancedBuild', null);
              const compStatRatio = loadComparisonValue<'balanced' | 'baldr' | 'hank' | 'defDex' | null>('statRatio', null);
              const compDefDexPrimaryStat = loadComparisonValue<'defense' | 'dexterity' | null>('defDexPrimaryStat', null);
              const compTrainByPerks = loadComparisonValue<'perks' | 'balanced' | null>('trainByPerks', null);
              const compBalanceAfterGym = loadComparisonValue<'chachas' | 'georges' | null>('balanceAfterGym', null);
              
              if (compHasBalancedBuild === 'yes' || compStatRatio === 'balanced') {
                section.statWeights = { strength: 1, speed: 1, defense: 1, dexterity: 1 };
              } else if (compStatRatio === 'baldr') {
                if (compDefDexPrimaryStat === 'dexterity') {
                  section.statWeights = { strength: 30, speed: 25, defense: 22, dexterity: 23 };
                } else {
                  section.statWeights = { strength: 30, speed: 25, defense: 23, dexterity: 22 };
                }
              } else if (compStatRatio === 'hank') {
                if (compDefDexPrimaryStat === 'dexterity') {
                  section.statWeights = { strength: 35, speed: 28, defense: 9, dexterity: 28 };
                } else {
                  section.statWeights = { strength: 35, speed: 28, defense: 28, dexterity: 9 };
                }
              } else if (compStatRatio === 'defDex') {
                if (compDefDexPrimaryStat === 'dexterity') {
                  section.statWeights = { strength: 1, speed: 1, defense: 0, dexterity: 1.25 };
                } else {
                  section.statWeights = { strength: 1, speed: 1, defense: 1.25, dexterity: 0 };
                }
              }
              
              if (compTrainByPerks === 'perks') {
                section.statDriftPercent = 100;
                section.ignorePerksForGymSelection = false;
                if (compBalanceAfterGym === 'chachas') {
                  section.balanceAfterGymIndex = 19;
                } else if (compBalanceAfterGym === 'georges') {
                  section.balanceAfterGymIndex = 23;
                }
              } else if (compTrainByPerks === 'balanced') {
                section.statDriftPercent = 0;
                section.ignorePerksForGymSelection = true;
              }
            },
          });
        }
        
        if (comparisonPageSelections.trainingRegime) {
          areaConfigs.push({
            key: 'trainingRegime',
            name: 'Training',
            apply: (section) => {
              const compTrainingSelections = loadComparisonValue<{
                edvd: boolean;
                candy: boolean;
                stackedCandy: boolean;
                energy: boolean;
                fhc: boolean;
              } | null>('trainingRegimeSelections', null);
              
              if (compTrainingSelections) {
                if (compTrainingSelections.edvd) {
                  section.edvdJumpEnabled = true;
                  section.edvdJumpFrequency = loadComparisonValue('edvdJumpFrequency', DEFAULT_EDVD_FREQUENCY_DAYS);
                  section.edvdJumpDvds = loadComparisonValue('edvdJumpDvds', DEFAULT_EDVD_DVDS);
                  section.edvdJumpLimit = loadComparisonValue('edvdJumpLimit', 'indefinite');
                  section.edvdJumpCount = loadComparisonValue('edvdJumpCount', 10);
                  section.edvdJumpStatTarget = loadComparisonValue('edvdJumpStatTarget', 140000);
                  section.edvdJumpAdultNovelties = loadComparisonValue('edvdJumpAdultNovelties', false);
                }
                
                if (compTrainingSelections.candy) {
                  section.candyJumpEnabled = true;
                  section.candyJumpFrequencyDays = loadComparisonValue('candyJumpFrequencyDays', 1);
                  section.candyJumpItemId = loadComparisonValue('candyJumpItemId', CANDY_ITEM_IDS.HAPPY_75);
                  section.candyJumpQuantity = loadComparisonValue('candyJumpQuantity', DEFAULT_CANDY_QUANTITY);
                }
                
                if (compTrainingSelections.stackedCandy) {
                  section.stackedCandyJumpEnabled = true;
                  section.stackedCandyJumpFrequency = loadComparisonValue('stackedCandyJumpFrequency', DEFAULT_EDVD_FREQUENCY_DAYS);
                  section.stackedCandyJumpItemId = loadComparisonValue('stackedCandyJumpItemId', CANDY_ITEM_IDS.HAPPY_75);
                  section.stackedCandyJumpQuantity = loadComparisonValue('stackedCandyJumpQuantity', DEFAULT_CANDY_QUANTITY);
                }
                
                if (compTrainingSelections.energy) {
                  section.energyJumpEnabled = true;
                  section.energyJumpItemId = loadComparisonValue('energyDrinkItemId', ENERGY_ITEM_IDS.ENERGY_10);
                  section.energyJumpQuantity = loadComparisonValue('energyDrinkQuantity', DEFAULT_ENERGY_DRINK_QUANTITY);
                }
              }
            },
          });
        }
        
        if (comparisonPageSelections.lossRevive) {
          areaConfigs.push({
            key: 'lossRevive',
            name: 'Loss/Revive',
            apply: (section) => {
              const compLossReviveEnabled = loadComparisonValue<boolean>('lossReviveEnabled', false);
              section.lossReviveEnabled = compLossReviveEnabled;
              
              if (compLossReviveEnabled) {
                section.lossReviveNumberPerDay = loadComparisonValue('lossReviveNumberPerDay', DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY);
                section.lossReviveEnergyCost = loadComparisonValue('lossReviveEnergyCost', DEFAULT_LOSS_REVIVE_ENERGY_COST);
                section.lossReviveDaysBetween = loadComparisonValue('lossReviveDaysBetween', DEFAULT_LOSS_REVIVE_DAYS_BETWEEN);
                section.lossRevivePricePerLoss = loadComparisonValue('lossRevivePricePerLoss', DEFAULT_LOSS_REVIVE_PRICE);
              }
            },
          });
        }
        
        // Create comparison states based on mode
        if (comparisonMode === 'separate') {
          // Create separate comparison state for each area
          const comparisonStates: ComparisonState[] = areaConfigs.map((config, index) => {
            const section = { ...currentState.sections[0], id: '1' };
            config.apply(section);
            return {
              id: String(index + 2),
              name: `Compare: ${config.name}`,
              sections: [section],
              showIndividualStats: false,
            };
          });
          
          return [currentState, ...comparisonStates];
        } else {
          // Create single combined comparison state
          const combinedSection = { ...currentState.sections[0], id: '1' };
          const selectedAreas: string[] = [];
          
          // Apply all overrides to the combined section
          areaConfigs.forEach((config) => {
            selectedAreas.push(config.name);
            config.apply(combinedSection);
          });
          
          const comparisonName = selectedAreas.length > 0 ? `Compare: ${selectedAreas.join(' + ')}` : 'Comparison';
          
          const comparisonState: ComparisonState = {
            id: '2',
            name: comparisonName,
            sections: [combinedSection],
            showIndividualStats: false,
          };
          
          return [currentState, comparisonState];
        }
      }
      
      return [currentState];
    }
    
    // Migrate saved states
    return savedStates.map(state => migrateComparisonState(state as Record<string, unknown>, totalDays));
  });
  
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [monthValidationError, setMonthValidationError] = useState<string | null>(null);
  const [showCosts, setShowCosts] = useState<boolean>(() => loadSavedValue('showCosts', false));
  const [isLoadingGymStats, setIsLoadingGymStats] = useState<boolean>(false);
  
  // State for collapsing fixed options
  const [showFixedOptions, setShowFixedOptions] = useState<boolean>(() => {
    // Check if user came from wizard
    const fromWizard = localStorage.getItem('gymComparison_fromWizard') === 'true';
    // If from wizard, hide options by default; otherwise show them
    return !fromWizard;
  });
  
  // Ref for scrolling to results
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Historical data state
  const [historicalData, setHistoricalData] = useState<HistoricalStat[]>([]);
  const [historicalComparisonEnabled, setHistoricalComparisonEnabled] = useState(false);
  
  // Check if user came from wizard and scroll to results when data is ready
  useEffect(() => {
    const fromWizard = localStorage.getItem('gymComparison_fromWizard') === 'true';
    if (fromWizard && Object.keys(results).length > 0 && resultsRef.current) {
      // Scroll to results section
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Clear the flag so it doesn't happen again on refresh
      localStorage.removeItem('gymComparison_fromWizard');
    }
  }, [results]);
  
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
  useEffect(() => { localStorage.setItem('gymComparison_gymProgressPercent', JSON.stringify(gymProgressPercent)); }, [gymProgressPercent]);
  useEffect(() => { localStorage.setItem('gymComparison_months', JSON.stringify(months)); }, [months]);
  useEffect(() => { localStorage.setItem('gymComparison_durationUnit', JSON.stringify(durationUnit)); }, [durationUnit]);
  useEffect(() => { localStorage.setItem('gymComparison_comparisonStates', JSON.stringify(comparisonStates)); }, [comparisonStates]);
  useEffect(() => { localStorage.setItem('gymComparison_statsFetchedWithApiKey', JSON.stringify(statsFetchedWithApiKey)); }, [statsFetchedWithApiKey]);
  
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
  
  const handleMonthsChange = (newMonths: number) => {
    const newTotalDays = newMonths * 30;
    
    // Clear any previous validation error
    setMonthValidationError(null);
    
    // Always update the months state so the user can type freely
    setMonths(newMonths);
    
    // Validate upper limit to prevent crashes
    if (newMonths > 36) {
      setMonthValidationError('Maximum duration is 36 months to prevent performance issues.');
      setResults({});
      return;
    }
    
    // Validate that it's a reasonable value (at least 1 day, which is 1/30 of a month)
    if (!newMonths || newMonths < (1/30) || !Number.isFinite(newMonths)) {
      setMonthValidationError('Please enter a valid duration (at least 1 day).');
      setResults({});
      return;
    }
    
    // No comparison states, we're done
    if (comparisonStates.length === 0) {
      return;
    }
    
    // Check if all states have exactly one section
    const allSingleSection = comparisonStates.every(state => state.sections.length === 1);
    
    if (allSingleSection) {
      // Auto-adjust all single-section states to match new duration
      const updatedStates = comparisonStates.map(state => ({
        ...state,
        sections: [{
          ...state.sections[0],
          startDay: 1,
          endDay: newTotalDays,
        }],
      }));
      
      // Clear results to force re-simulation with new duration
      setResults({});
      setComparisonStates(updatedStates);
      return;
    }
    
    // Multiple sections exist - check if we can auto-adjust
    if (newMonths >= months) {
      // Increasing months - extend the last section of each state to the new duration
      const updatedStates = comparisonStates.map(state => ({
        ...state,
        sections: state.sections.map((section, index) => {
          // Only adjust the last section
          if (index === state.sections.length - 1) {
            return {
              ...section,
              endDay: newTotalDays,
            };
          }
          return section;
        }),
      }));
      
      // Clear results to force re-simulation
      setResults({});
      setComparisonStates(updatedStates);
      return;
    }
    
    // Decreasing months - check if we can shrink the last section
    // We can shrink if the new duration is >= the start of the last section
    let canShrink = true;
    let minRequiredDays = 0;
    
    for (const state of comparisonStates) {
      if (state.sections.length > 0) {
        // Get the last section's start day
        const lastSection = state.sections[state.sections.length - 1];
        const lastSectionStart = lastSection.startDay;
        
        // If new duration would cut off before the last section starts, we can't shrink
        if (newTotalDays < lastSectionStart) {
          canShrink = false;
          minRequiredDays = Math.max(minRequiredDays, lastSectionStart);
        }
      }
    }
    
    if (canShrink) {
      // We can shrink - adjust the last section of each state to end at newTotalDays
      const updatedStates = comparisonStates.map(state => ({
        ...state,
        sections: state.sections.map((section, index) => {
          // Only adjust the last section
          if (index === state.sections.length - 1) {
            return {
              ...section,
              endDay: Math.min(section.endDay, newTotalDays),
            };
          }
          return section;
        }),
      }));
      
      // Clear results to force re-simulation
      setResults({});
      setComparisonStates(updatedStates);
    } else {
      // Cannot shrink - show error but keep the months value
      const minRequiredMonths = Math.ceil(minRequiredDays / 30);
      
      setMonthValidationError(
        `Cannot reduce duration below ${minRequiredMonths} month${minRequiredMonths !== 1 ? 's' : ''} because some comparison states have sections starting at day ${minRequiredDays}. Please delete or adjust sections to start before day ${newTotalDays} first.`
      );
      setResults({});
    }
  };
  
  const handleFetchStats = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }
    setError(null);
    
    try {
      setIsLoadingGymStats(true);
      // Use shared helper to fetch directly from Torn API with perks
      const data = await fetchGymStatsFromTorn(apiKey, true);
      
      // Calculate perk percentages using shared helper
      const perkPercs = calculatePerkPercentages(data);
      
      // Update the values with fetched data
      setInitialStats({
        strength: data.battlestats.strength.value,
        speed: data.battlestats.speed.value,
        defense: data.battlestats.defense.value,
        dexterity: data.battlestats.dexterity.value,
      });
      setCurrentGymIndex(Math.max(0, data.active_gym - 1));
      
      // Update manual mode perk percs
      setManualPerkPercs(perkPercs);
      
      // Auto-fill base happy if available
      if (data.bars?.happy?.maximum) {
        const baseHappy = data.bars.happy.maximum;
        
        // Update base happy in all sections of all comparison states
        setComparisonStates((prev) => prev.map((state) => ({
          ...state,
          sections: state.sections.map(section => ({
            ...section,
            happy: baseHappy,
            perkPercs: perkPercs,
          })),
        })));
        
        // Also update manual mode happy
        setManualHappy(baseHappy);
      } else {
        // Just update perk percs if no base happy
        setComparisonStates((prev) => prev.map((state) => ({
          ...state,
          sections: state.sections.map(section => ({
            ...section,
            perkPercs: perkPercs,
          })),
        })));
      }
      
      // Mark that stats were successfully fetched with API key
      setStatsFetchedWithApiKey(true);
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
  
  const handleCopyState = (stateId: string) => {
    if (comparisonStates.length >= MAX_COMPARISON_STATES) {
      setError(`Maximum ${MAX_COMPARISON_STATES} comparison states allowed`);
      return;
    }
    
    const stateToCopy = comparisonStates.find(s => s.id === stateId);
    if (!stateToCopy) return;
    
    // Deep clone all sections with their settings
    const copiedSections = stateToCopy.sections.map(section => ({
      ...section,
      id: `${Date.now()}-${section.id}`, // Generate unique section IDs
    }));
    
    const copiedState: ComparisonState = {
      id: Date.now().toString(),
      name: stateToCopy.name, // Keep the same name - user can rename it
      sections: copiedSections,
      showIndividualStats: stateToCopy.showIndividualStats,
    };
    
    setComparisonStates([...comparisonStates, copiedState]);
    setActiveTabIndex(comparisonStates.length); // Switch to the new copied state
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
        // Validate months value (at least 1 day, which is 1/30 of a month)
        if (!months || months < (1/30) || !Number.isFinite(months)) {
          setError('Please enter a valid duration (at least 1 day)');
          setResults({});
          return;
        }
        
        // Validate upper limit to prevent crashes
        if (months > 36) {
          setError('Maximum duration is 36 months to prevent performance issues.');
          setResults({});
          return;
        }
        
        // Validate that all sections fit within the total duration
        const totalDays = months * 30;
        for (const state of comparisonStates) {
          for (const section of state.sections) {
            if (section.startDay > totalDays || section.endDay > totalDays) {
              setError(`Section dates in "${state.name}" exceed the total duration of ${months} month${months !== 1 ? 's' : ''}. Please adjust sections or increase the duration.`);
              setResults({});
              return;
            }
          }
        }
        
        const newResults: Record<string, SimulationResult> = {};
        
        for (const state of comparisonStates) {
          const result = simulateWithSections(
            AVAILABLE_GYMS,
            state,
            months,
            currentGymIndex,
            initialStats,
            apiKey,
            simulatedDate,
            showCosts,
            itemPricesData
          );
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
      simulatedDate: simulatedDate ? simulatedDate.toISOString() : null, // Include start date
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
      
      // Load simulated date
      if (typeof settings.simulatedDate === 'string') {
        try {
          const date = new Date(settings.simulatedDate);
          if (!isNaN(date.getTime())) {
            setSimulatedDate(date);
          }
        } catch (err) {
          console.error('Failed to parse simulatedDate:', err);
        }
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
        historicalData: historicalData.length > 0 ? historicalData : undefined,
      };
      
      exportGymComparisonData(exportData);
    }
  };

  // Function to clear current configuration cache
  const handleClearConfiguration = () => {
    // Clear all gymComparison_* localStorage items except saved configurations
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('gymComparison_') && key !== 'gymComparison_savedConfigurations') {
        localStorage.removeItem(key);
      }
    });
    
    // Reload the page to reset all state
    window.location.reload();
  };
  
  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom>
        Gym Comparison Tool
      </Typography>
      
      <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
        Compare gym stat gains with different configurations
      </Typography>
      
      {/* Link to Wizard */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 3, 
          border: '2px solid',
          borderColor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <AutoFixHighIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1">
            <strong>{cameFromWizard ? 'Want to change your settings?' : 'New to the Gym Comparison Tool?'}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cameFromWizard 
              ? 'Use the wizard button to go back and edit your responses.'
              : 'Use our step-by-step wizard to help you set up your first comparison.'}
          </Typography>
        </Box>
        <Button 
          component={RouterLink} 
          to="/gymWizard" 
          variant="outlined"
          color="primary"
          startIcon={<AutoFixHighIcon />}
        >
          {cameFromWizard ? 'Edit in Wizard' : 'Open Wizard'}
        </Button>
      </Paper>
      
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
          <ClearConfigurationButton onClear={handleClearConfiguration} />
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
          {/* Fixed Options Section with collapsible toggle */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              {showFixedOptions ? 'Hide' : 'Show'} Configuration Options
            </Typography>
            <IconButton 
              onClick={() => setShowFixedOptions(!showFixedOptions)}
              size="small"
              aria-label={showFixedOptions ? 'hide options' : 'show options'}
            >
              {showFixedOptions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showFixedOptions}>
            <PlayerStatsSection
              apiKey={apiKey}
              setApiKey={setApiKey}
              initialStats={initialStats}
              setInitialStats={setInitialStats}
              currentGymIndex={currentGymIndex}
              setCurrentGymIndex={setCurrentGymIndex}
              gymProgressPercent={gymProgressPercent}
              setGymProgressPercent={setGymProgressPercent}
              months={months}
              setMonths={handleMonthsChange}
              durationUnit={durationUnit}
              setDurationUnit={setDurationUnit}
              isLoadingGymStats={isLoadingGymStats}
              handleFetchStats={handleFetchStats}
              simulatedDate={simulatedDate}
              setSimulatedDate={setSimulatedDate}
              monthValidationError={monthValidationError}
              onHistoricalDataFetched={setHistoricalData}
              onEnabledChange={setHistoricalComparisonEnabled}
              statsFetchedWithApiKey={statsFetchedWithApiKey}
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
                handleCopyState={handleCopyState}
                canRemoveState={comparisonStates.length > 1}
                showCosts={showCosts}
                itemPricesData={itemPricesData}
                result={results[activeState.id]}
                initialStats={initialStats}
                months={months}
              />
            )}
          </Collapse>

          {/* Results Section */}
          {Object.keys(results).length > 0 && (
            <Box ref={resultsRef}>
              {/* Show Edit in Wizard button for users who came from wizard */}
              {cameFromWizard && (
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    component={RouterLink} 
                    to="/gymWizard" 
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<AutoFixHighIcon />}
                  >
                    Edit in Wizard
                  </Button>
                </Box>
              )}
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
                historicalData={historicalData}
                simulatedDate={simulatedDate}
                historicalComparisonEnabled={historicalComparisonEnabled}
              />
            </Box>
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
        <Grid size={{ xs: 12 }}>
          <ThankYouCard />
        </Grid>
      </Grid>
    </Box>
  );
}
