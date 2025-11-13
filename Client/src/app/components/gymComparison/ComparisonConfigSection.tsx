import { Grid, IconButton, Paper, TextField, Box, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import StatWeightsSection from './StatWeightsSection';
import EnergySourcesSection from './EnergySourcesSection';
import HappyPerksSection from './HappyPerksSection';
import BenefitsEventsSection from './BenefitsEventsSection';
import StatJumpsSection from './StatJumpsSection';
import { Typography } from '@mui/material';
import { getCompanyBenefit, getHanksRatio, getBaldrsRatio, getDefensiveBuildRatio } from '../../../lib/utils/gymHelpers';
import type { ItemPrices } from '../../../lib/hooks/useItemPrices';
import type { SegmentedSimulationConfig } from '../../../lib/types/gymComparison';

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
}

interface ComparisonConfigSectionProps {
  activeState: ComparisonState;
  updateState: (stateId: string, updates: Partial<ComparisonState>) => void;
  handleRemoveState: (stateId: string) => void;
  canRemoveState: boolean;
  showCosts: boolean;
  itemPricesData?: ItemPrices;
  segmentConfig?: SegmentedSimulationConfig;
  updateSegment?: (stateId: string, segmentId: string, updates: Partial<ComparisonState>) => void;
}

export default function ComparisonConfigSection({
  activeState,
  updateState,
  handleRemoveState,
  canRemoveState,
  showCosts,
  itemPricesData,
  segmentConfig,
  updateSegment,
}: ComparisonConfigSectionProps) {
  // Determine if we're editing a segment or the base state
  const activeSegmentId = segmentConfig?.activeSegmentId;
  const activeSegment = activeSegmentId 
    ? segmentConfig?.segments.find(seg => seg.id === activeSegmentId)
    : null;
  
  // Get the display state (base + segment overrides for display)
  const displayState = activeSegment 
    ? {
        ...activeState,
        statWeights: { ...activeState.statWeights, ...activeSegment.overrides.statWeights },
        perkPercs: { ...activeState.perkPercs, ...activeSegment.overrides.perkPercs },
        ...(activeSegment.overrides.hoursPlayedPerDay !== undefined && { hoursPlayedPerDay: activeSegment.overrides.hoursPlayedPerDay }),
        ...(activeSegment.overrides.xanaxPerDay !== undefined && { xanaxPerDay: activeSegment.overrides.xanaxPerDay }),
        ...(activeSegment.overrides.hasPointsRefill !== undefined && { hasPointsRefill: activeSegment.overrides.hasPointsRefill }),
        ...(activeSegment.overrides.maxEnergy !== undefined && { maxEnergy: activeSegment.overrides.maxEnergy }),
        ...(activeSegment.overrides.happy !== undefined && { happy: activeSegment.overrides.happy }),
        ...(activeSegment.overrides.edvdJumpEnabled !== undefined && { edvdJumpEnabled: activeSegment.overrides.edvdJumpEnabled }),
        ...(activeSegment.overrides.edvdJumpFrequency !== undefined && { edvdJumpFrequency: activeSegment.overrides.edvdJumpFrequency }),
        ...(activeSegment.overrides.edvdJumpDvds !== undefined && { edvdJumpDvds: activeSegment.overrides.edvdJumpDvds }),
        ...(activeSegment.overrides.edvdJumpLimit !== undefined && { edvdJumpLimit: activeSegment.overrides.edvdJumpLimit }),
        ...(activeSegment.overrides.edvdJumpCount !== undefined && { edvdJumpCount: activeSegment.overrides.edvdJumpCount }),
        ...(activeSegment.overrides.edvdJumpStatTarget !== undefined && { edvdJumpStatTarget: activeSegment.overrides.edvdJumpStatTarget }),
        ...(activeSegment.overrides.edvdJumpAdultNovelties !== undefined && { edvdJumpAdultNovelties: activeSegment.overrides.edvdJumpAdultNovelties }),
        ...(activeSegment.overrides.candyJumpEnabled !== undefined && { candyJumpEnabled: activeSegment.overrides.candyJumpEnabled }),
        ...(activeSegment.overrides.candyJumpItemId !== undefined && { candyJumpItemId: activeSegment.overrides.candyJumpItemId }),
        ...(activeSegment.overrides.candyJumpUseEcstasy !== undefined && { candyJumpUseEcstasy: activeSegment.overrides.candyJumpUseEcstasy }),
        ...(activeSegment.overrides.candyJumpQuantity !== undefined && { candyJumpQuantity: activeSegment.overrides.candyJumpQuantity }),
        ...(activeSegment.overrides.candyJumpFactionBenefit !== undefined && { candyJumpFactionBenefit: activeSegment.overrides.candyJumpFactionBenefit }),
        ...(activeSegment.overrides.energyJumpEnabled !== undefined && { energyJumpEnabled: activeSegment.overrides.energyJumpEnabled }),
        ...(activeSegment.overrides.energyJumpItemId !== undefined && { energyJumpItemId: activeSegment.overrides.energyJumpItemId }),
        ...(activeSegment.overrides.energyJumpQuantity !== undefined && { energyJumpQuantity: activeSegment.overrides.energyJumpQuantity }),
        ...(activeSegment.overrides.energyJumpFactionBenefit !== undefined && { energyJumpFactionBenefit: activeSegment.overrides.energyJumpFactionBenefit }),
        ...(activeSegment.overrides.lossReviveEnabled !== undefined && { lossReviveEnabled: activeSegment.overrides.lossReviveEnabled }),
        ...(activeSegment.overrides.lossReviveNumberPerDay !== undefined && { lossReviveNumberPerDay: activeSegment.overrides.lossReviveNumberPerDay }),
        ...(activeSegment.overrides.lossReviveEnergyCost !== undefined && { lossReviveEnergyCost: activeSegment.overrides.lossReviveEnergyCost }),
        ...(activeSegment.overrides.lossReviveDaysBetween !== undefined && { lossReviveDaysBetween: activeSegment.overrides.lossReviveDaysBetween }),
        ...(activeSegment.overrides.lossRevivePricePerLoss !== undefined && { lossRevivePricePerLoss: activeSegment.overrides.lossRevivePricePerLoss }),
        ...(activeSegment.overrides.diabetesDayEnabled !== undefined && { diabetesDayEnabled: activeSegment.overrides.diabetesDayEnabled }),
        ...(activeSegment.overrides.diabetesDayNumberOfJumps !== undefined && { diabetesDayNumberOfJumps: activeSegment.overrides.diabetesDayNumberOfJumps }),
        ...(activeSegment.overrides.diabetesDayFHC !== undefined && { diabetesDayFHC: activeSegment.overrides.diabetesDayFHC }),
        ...(activeSegment.overrides.diabetesDayGreenEgg !== undefined && { diabetesDayGreenEgg: activeSegment.overrides.diabetesDayGreenEgg }),
        ...(activeSegment.overrides.diabetesDaySeasonalMail !== undefined && { diabetesDaySeasonalMail: activeSegment.overrides.diabetesDaySeasonalMail }),
        ...(activeSegment.overrides.diabetesDayLogoClick !== undefined && { diabetesDayLogoClick: activeSegment.overrides.diabetesDayLogoClick }),
        ...(activeSegment.overrides.companyBenefitKey !== undefined && { companyBenefitKey: activeSegment.overrides.companyBenefitKey }),
        ...(activeSegment.overrides.candleShopStars !== undefined && { candleShopStars: activeSegment.overrides.candleShopStars }),
        ...(activeSegment.overrides.daysSkippedPerMonth !== undefined && { daysSkippedPerMonth: activeSegment.overrides.daysSkippedPerMonth }),
      }
    : activeState;
  
  // Route updates to correct target
  const handleUpdate = (updates: Partial<ComparisonState>) => {
    if (activeSegmentId && updateSegment) {
      updateSegment(activeState.id, activeSegmentId, updates);
    } else {
      updateState(activeState.id, updates);
    }
  };
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {activeSegmentId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Editing segment: {activeSegment?.name || `Day ${activeSegment?.startDay}`}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField 
          label="Comparison Name" 
          value={activeState.name} 
          onChange={(e) => updateState(activeState.id, { name: e.target.value })} 
          size="small"
          sx={{ width: 250 }}
          disabled={!!activeSegmentId}
        />
        {canRemoveState && !activeSegmentId && (
          <IconButton color="error" onClick={() => handleRemoveState(activeState.id)} size="small">
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatWeightsSection
            statWeights={displayState.statWeights}
            onUpdate={(updates) => {
              if ('strength' in updates || 'speed' in updates || 'defense' in updates || 'dexterity' in updates) {
                handleUpdate({ statWeights: { ...displayState.statWeights, ...updates } });
              }
            }}
            getHanksRatio={getHanksRatio}
            getBaldrsRatio={getBaldrsRatio}
            getDefensiveBuildRatio={getDefensiveBuildRatio}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <EnergySourcesSection
            maxEnergy={displayState.maxEnergy}
            hoursPlayedPerDay={displayState.hoursPlayedPerDay}
            xanaxPerDay={displayState.xanaxPerDay}
            hasPointsRefill={displayState.hasPointsRefill}
            daysSkippedPerMonth={displayState.daysSkippedPerMonth}
            companyBenefit={getCompanyBenefit(displayState.companyBenefitKey, displayState.candleShopStars)}
            showCosts={showCosts}
            itemPricesData={itemPricesData}
            onUpdate={(updates) => handleUpdate(updates)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <HappyPerksSection
            happy={displayState.happy}
            perkPercs={displayState.perkPercs}
            onUpdate={(updates) => {
              if ('happy' in updates) {
                handleUpdate({ happy: updates.happy });
              }
              if ('perkPercs' in updates) {
                handleUpdate({ perkPercs: { ...displayState.perkPercs, ...updates.perkPercs } });
              }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <BenefitsEventsSection
            companyBenefitKey={displayState.companyBenefitKey}
            candleShopStars={displayState.candleShopStars}
            diabetesDayEnabled={displayState.diabetesDayEnabled}
            diabetesDayNumberOfJumps={displayState.diabetesDayNumberOfJumps}
            diabetesDayFHC={displayState.diabetesDayFHC}
            diabetesDayGreenEgg={displayState.diabetesDayGreenEgg}
            diabetesDaySeasonalMail={displayState.diabetesDaySeasonalMail}
            diabetesDayLogoClick={displayState.diabetesDayLogoClick}
            onUpdate={(updates) => handleUpdate(updates)}
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Stat Jumps</Typography>
      <StatJumpsSection
        edvdJumpEnabled={displayState.edvdJumpEnabled}
        edvdJumpFrequency={displayState.edvdJumpFrequency}
        edvdJumpDvds={displayState.edvdJumpDvds}
        edvdJumpLimit={displayState.edvdJumpLimit}
        edvdJumpCount={displayState.edvdJumpCount}
        edvdJumpStatTarget={displayState.edvdJumpStatTarget}
        edvdJumpAdultNovelties={displayState.edvdJumpAdultNovelties}
        candyJumpEnabled={displayState.candyJumpEnabled}
        candyJumpItemId={displayState.candyJumpItemId}
        candyJumpUseEcstasy={displayState.candyJumpUseEcstasy}
        candyJumpQuantity={displayState.candyJumpQuantity}
        candyJumpFactionBenefit={displayState.candyJumpFactionBenefit}
        energyJumpEnabled={displayState.energyJumpEnabled}
        energyJumpItemId={displayState.energyJumpItemId}
        energyJumpQuantity={displayState.energyJumpQuantity}
        energyJumpFactionBenefit={displayState.energyJumpFactionBenefit}
        lossReviveEnabled={displayState.lossReviveEnabled}
        lossReviveNumberPerDay={displayState.lossReviveNumberPerDay}
        lossReviveEnergyCost={displayState.lossReviveEnergyCost}
        lossReviveDaysBetween={displayState.lossReviveDaysBetween}
        lossRevivePricePerLoss={displayState.lossRevivePricePerLoss}
        hasPointsRefill={displayState.hasPointsRefill}
        xanaxPerDay={displayState.xanaxPerDay}
        maxEnergy={displayState.maxEnergy}
        showCosts={showCosts}
        itemPricesData={itemPricesData}
        onUpdate={(updates) => handleUpdate(updates)}
      />
    </Paper>
  );
}
