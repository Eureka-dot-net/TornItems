import { Grid, IconButton, Paper, TextField, Box, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import StatWeightsSection from './StatWeightsSection';
import EnergySourcesSection from './EnergySourcesSection';
import HappyPerksSection from './HappyPerksSection';
import BenefitsEventsSection from './BenefitsEventsSection';
import StatJumpsSection from './StatJumpsSection';
import { Typography } from '@mui/material';
import { getCompanyBenefit, getHanksRatio, getBaldrsRatio, getDefensiveBuildRatio } from '../../../lib/utils/gymHelpers';
import type { ItemPrices } from '../../../lib/hooks/useItemPrices';
import type { SimulationResult } from '../../../lib/utils/gymProgressionCalculator';
import { exportIndividualComparisonData, type IndividualComparisonExportData } from '../../../lib/utils/exportHelpers';

interface ComparisonState {
  id: string;
  name: string;
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
  candyJumpFrequencyDays: number;
  candyJumpItemId: number;
  candyJumpQuantity: number;
  candyJumpFactionBenefit: number;
  candyJumpDrugUsed: 'none' | 'xanax' | 'ecstasy';
  candyJumpXanaxAlreadyIncluded: boolean;
  candyJumpUsePointRefill: boolean;
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

interface ComparisonConfigSectionProps {
  activeState: ComparisonState;
  updateState: (stateId: string, updates: Partial<ComparisonState>) => void;
  handleRemoveState: (stateId: string) => void;
  canRemoveState: boolean;
  showCosts: boolean;
  itemPricesData?: ItemPrices;
  result?: SimulationResult;
  initialStats: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
  };
  months: number;
}

export default function ComparisonConfigSection({
  activeState,
  updateState,
  handleRemoveState,
  canRemoveState,
  showCosts,
  itemPricesData,
  result,
  initialStats,
  months
}: ComparisonConfigSectionProps) {
  const navigate = useNavigate();
  
  const handleDownload = () => {
    if (!result) return;
    
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
    
    const exportData: IndividualComparisonExportData = {
      name: activeState.name,
      finalStats: result.finalStats,
      statGains,
      initialStats,
      months,
      dailySnapshots: result.dailySnapshots,
      costs,
    };
    
    exportIndividualComparisonData(exportData);
  };
  
  const handleViewTrainingRegime = () => {
    if (!result) return;
    
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
    
    const exportData: IndividualComparisonExportData = {
      name: activeState.name,
      finalStats: result.finalStats,
      statGains,
      initialStats,
      months,
      dailySnapshots: result.dailySnapshots,
      costs,
    };
    
    // Save to localStorage
    localStorage.setItem('trainingBreakdown_data', JSON.stringify(exportData));
    
    // Set start date to today if not already set
    const existingStartDate = localStorage.getItem('trainingBreakdown_startDate');
    if (!existingStartDate) {
      localStorage.setItem('trainingBreakdown_startDate', new Date().toISOString().split('T')[0]);
    }
    
    // Navigate to Training Breakdown page
    navigate('/trainingBreakdown');
  };
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <TextField 
          label="Comparison Name" 
          value={activeState.name} 
          onChange={(e) => updateState(activeState.id, { name: e.target.value })} 
          size="small"
          sx={{ width: 250 }}
        />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={handleViewTrainingRegime}
            disabled={!result}
          >
            View
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={!result}
          >
            Download
          </Button>
          {canRemoveState && (
            <IconButton color="error" onClick={() => handleRemoveState(activeState.id)} size="small">
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      <Grid container spacing={2}>
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
            statDriftPercent={activeState.statDriftPercent}
            onDriftUpdate={(percent) => updateState(activeState.id, { statDriftPercent: percent })}
            balanceAfterGymIndex={activeState.balanceAfterGymIndex}
            onBalanceAfterGymIndexUpdate={(gymIndex) => updateState(activeState.id, { balanceAfterGymIndex: gymIndex })}
            ignorePerksForGymSelection={activeState.ignorePerksForGymSelection}
            onIgnorePerksForGymSelectionUpdate={(ignore) => updateState(activeState.id, { ignorePerksForGymSelection: ignore })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <EnergySourcesSection
            maxEnergy={activeState.maxEnergy}
            hoursPlayedPerDay={activeState.hoursPlayedPerDay}
            xanaxPerDay={activeState.xanaxPerDay}
            hasPointsRefill={activeState.hasPointsRefill}
            daysSkippedPerMonth={activeState.daysSkippedPerMonth}
            companyBenefit={getCompanyBenefit(activeState.companyBenefitKey, activeState.candleShopStars)}
            showCosts={showCosts}
            itemPricesData={itemPricesData}
            onUpdate={(updates) => updateState(activeState.id, updates)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <HappyPerksSection
            happy={activeState.happy}
            perkPercs={activeState.perkPercs}
            showCosts={showCosts}
            islandCostPerDay={activeState.islandCostPerDay}
            onUpdate={(updates) => {
              if ('happy' in updates) {
                updateState(activeState.id, { happy: updates.happy });
              }
              if ('perkPercs' in updates) {
                updateState(activeState.id, { perkPercs: { ...activeState.perkPercs, ...updates.perkPercs } });
              }
              if ('islandCostPerDay' in updates) {
                updateState(activeState.id, { islandCostPerDay: updates.islandCostPerDay });
              }
            }}
          />
        </Grid>

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
        candyJumpFrequencyDays={activeState.candyJumpFrequencyDays}
        candyJumpItemId={activeState.candyJumpItemId}
        candyJumpQuantity={activeState.candyJumpQuantity}
        candyJumpFactionBenefit={activeState.candyJumpFactionBenefit}
        candyJumpDrugUsed={activeState.candyJumpDrugUsed}
        candyJumpXanaxAlreadyIncluded={activeState.candyJumpXanaxAlreadyIncluded}
        candyJumpUsePointRefill={activeState.candyJumpUsePointRefill}
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
  );
}
