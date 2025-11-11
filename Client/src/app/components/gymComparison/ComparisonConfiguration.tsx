import {
  Box,
  Typography,
  Paper,
  TextField,
  Grid,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import StatWeightsSection from './StatWeightsSection';
import EnergySourcesSection from './EnergySourcesSection';
import HappyPerksSection from './HappyPerksSection';
import BenefitsEventsSection from './BenefitsEventsSection';
import StatJumpsSection from './StatJumpsSection';
import type { StatType } from '../../lib/utils/statWeightPresets';
import type { CompanyBenefit } from '../../lib/utils/gymProgressionCalculator';

interface ComparisonConfigurationProps {
  state: {
    id: string;
    name: string;
    statWeights: { strength: number; speed: number; defense: number; dexterity: number };
    maxEnergy: number;
    hoursPlayedPerDay: number;
    xanaxPerDay: number;
    hasPointsRefill: boolean;
    daysSkippedPerMonth: number;
    happy: number;
    perkPercs: { strength: number; speed: number; defense: number; dexterity: number };
    companyBenefitKey: string;
    candleShopStars: number;
    diabetesDayEnabled: boolean;
    diabetesDayNumberOfJumps: 1 | 2;
    diabetesDayFHC: 0 | 1 | 2;
    diabetesDayGreenEgg: 0 | 1 | 2;
    diabetesDaySeasonalMail: boolean;
    diabetesDayLogoClick: boolean;
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
  };
  canDelete: boolean;
  companyBenefit: CompanyBenefit;
  showCosts: boolean;
  itemPricesData: { prices: Record<number, number> } | undefined;
  onUpdate: (updates: Record<string, unknown>) => void;
  onDelete: () => void;
  getHanksRatio: (stat: StatType) => { strength: number; speed: number; defense: number; dexterity: number };
  getBaldrsRatio: (stat: StatType) => { strength: number; speed: number; defense: number; dexterity: number };
  getDefensiveBuildRatio: (stat: 'defense' | 'dexterity') => { strength: number; speed: number; defense: number; dexterity: number };
}

export default function ComparisonConfiguration({
  state,
  canDelete,
  companyBenefit,
  showCosts,
  itemPricesData,
  onUpdate,
  onDelete,
  getHanksRatio,
  getBaldrsRatio,
  getDefensiveBuildRatio,
}: ComparisonConfigurationProps) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField 
          label="Comparison Name" 
          value={state.name} 
          onChange={(e) => onUpdate({ name: e.target.value })} 
          size="small"
          sx={{ width: 250 }}
        />
        {canDelete && (
          <IconButton color="error" onClick={onDelete} size="small">
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      <Grid container spacing={2}>
        {/* Stat Weights Column */}
        <Grid size={{ xs: 12, md: 3 }}>
          <StatWeightsSection
            statWeights={state.statWeights}
            onUpdate={(updates) => {
              if ('strength' in updates || 'speed' in updates || 'defense' in updates || 'dexterity' in updates) {
                onUpdate({ statWeights: { ...state.statWeights, ...updates } });
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
            maxEnergy={state.maxEnergy}
            hoursPlayedPerDay={state.hoursPlayedPerDay}
            xanaxPerDay={state.xanaxPerDay}
            hasPointsRefill={state.hasPointsRefill}
            daysSkippedPerMonth={state.daysSkippedPerMonth}
            companyBenefit={companyBenefit}
            onUpdate={onUpdate}
          />
        </Grid>

        {/* Happy & Perks Column */}
        <Grid size={{ xs: 12, md: 3 }}>
          <HappyPerksSection
            happy={state.happy}
            perkPercs={state.perkPercs}
            onUpdate={(updates) => {
              if ('happy' in updates) {
                onUpdate({ happy: updates.happy });
              }
              if ('perkPercs' in updates) {
                onUpdate({ perkPercs: { ...state.perkPercs, ...updates.perkPercs } });
              }
            }}
          />
        </Grid>

        {/* Company Benefits & Special Events Column */}
        <Grid size={{ xs: 12, md: 3 }}>
          <BenefitsEventsSection
            companyBenefitKey={state.companyBenefitKey}
            candleShopStars={state.candleShopStars}
            diabetesDayEnabled={state.diabetesDayEnabled}
            diabetesDayNumberOfJumps={state.diabetesDayNumberOfJumps}
            diabetesDayFHC={state.diabetesDayFHC}
            diabetesDayGreenEgg={state.diabetesDayGreenEgg}
            diabetesDaySeasonalMail={state.diabetesDaySeasonalMail}
            diabetesDayLogoClick={state.diabetesDayLogoClick}
            onUpdate={onUpdate}
          />
        </Grid>
      </Grid>

      {/* Stat Jumps Section */}
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Stat Jumps</Typography>
      <StatJumpsSection
        edvdJumpEnabled={state.edvdJumpEnabled}
        edvdJumpFrequency={state.edvdJumpFrequency}
        edvdJumpDvds={state.edvdJumpDvds}
        edvdJumpLimit={state.edvdJumpLimit}
        edvdJumpCount={state.edvdJumpCount}
        edvdJumpStatTarget={state.edvdJumpStatTarget}
        edvdJumpAdultNovelties={state.edvdJumpAdultNovelties}
        candyJumpEnabled={state.candyJumpEnabled}
        candyJumpItemId={state.candyJumpItemId}
        candyJumpUseEcstasy={state.candyJumpUseEcstasy}
        candyJumpQuantity={state.candyJumpQuantity}
        candyJumpFactionBenefit={state.candyJumpFactionBenefit}
        energyJumpEnabled={state.energyJumpEnabled}
        energyJumpItemId={state.energyJumpItemId}
        energyJumpQuantity={state.energyJumpQuantity}
        energyJumpFactionBenefit={state.energyJumpFactionBenefit}
        lossReviveEnabled={state.lossReviveEnabled}
        lossReviveNumberPerDay={state.lossReviveNumberPerDay}
        lossReviveEnergyCost={state.lossReviveEnergyCost}
        lossReviveDaysBetween={state.lossReviveDaysBetween}
        lossRevivePricePerLoss={state.lossRevivePricePerLoss}
        hasPointsRefill={state.hasPointsRefill}
        xanaxPerDay={state.xanaxPerDay}
        maxEnergy={state.maxEnergy}
        showCosts={showCosts}
        itemPricesData={itemPricesData}
        onUpdate={onUpdate}
      />
    </Paper>
  );
}
