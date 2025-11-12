import { Grid, IconButton, Paper, TextField, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import StatWeightsSection from './StatWeightsSection';
import EnergySourcesSection from './EnergySourcesSection';
import HappyPerksSection from './HappyPerksSection';
import BenefitsEventsSection from './BenefitsEventsSection';
import StatJumpsSection from './StatJumpsSection';
import SegmentManagement from './SegmentManagement';
import { Typography } from '@mui/material';
import { getCompanyBenefit, getHanksRatio, getBaldrsRatio, getDefensiveBuildRatio } from '../../../lib/utils/gymHelpers';
import type { ItemPrices } from '../../../lib/hooks/useItemPrices';
import { type ComparisonSegment } from '../../../lib/types/gymComparison';

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
  segments?: ComparisonSegment[];
}

interface ComparisonConfigSectionProps {
  activeState: ComparisonState;
  updateState: (stateId: string, updates: Partial<ComparisonState>) => void;
  handleRemoveState: (stateId: string) => void;
  canRemoveState: boolean;
  showCosts: boolean;
  itemPricesData?: ItemPrices;
  enableTimeSegments: boolean;
  activeSegmentId: string | null;
  onRemoveSegment: (stateId: string, segmentId: string) => void;
  onEditSegment: (segmentId: string) => void;
  onClearSegmentSelection: () => void;
}

export default function ComparisonConfigSection({
  activeState,
  updateState,
  handleRemoveState,
  canRemoveState,
  showCosts,
  itemPricesData,
  enableTimeSegments,
  activeSegmentId,
  onRemoveSegment,
  onEditSegment,
  onClearSegmentSelection
}: ComparisonConfigSectionProps) {
  // Get the effective configuration: base state merged with active segment overrides
  const effectiveState = (() => {
    if (!activeSegmentId) return activeState;
    
    const segment = (activeState.segments || []).find(s => s.id === activeSegmentId);
    if (!segment) return activeState;
    
    // Merge base state with segment overrides
    const merged = { ...activeState };
    Object.keys(segment).forEach((key) => {
      if (key !== 'id' && key !== 'startDay' && segment[key as keyof ComparisonSegment] !== undefined) {
        (merged as Record<string, unknown>)[key] = segment[key as keyof ComparisonSegment];
      }
    });
    return merged;
  })();

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField 
          label="Comparison Name" 
          value={effectiveState.name} 
          onChange={(e) => updateState(activeState.id, { name: e.target.value })} 
          size="small"
          sx={{ width: 250 }}
        />
        {canRemoveState && (
          <IconButton color="error" onClick={() => handleRemoveState(activeState.id)} size="small">
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      {/* Segment Management - Only show when time segments are enabled */}
      {enableTimeSegments && (
        <SegmentManagement
          stateId={activeState.id}
          stateName={activeState.name}
          segments={activeState.segments || []}
          activeSegmentId={activeSegmentId}
          onRemoveSegment={onRemoveSegment}
          onEditSegment={onEditSegment}
          onClearSelection={onClearSegmentSelection}
        />
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatWeightsSection
            statWeights={effectiveState.statWeights}
            onUpdate={(updates) => {
              if ('strength' in updates || 'speed' in updates || 'defense' in updates || 'dexterity' in updates) {
                updateState(activeState.id, { statWeights: { ...effectiveState.statWeights, ...updates } });
              }
            }}
            getHanksRatio={getHanksRatio}
            getBaldrsRatio={getBaldrsRatio}
            getDefensiveBuildRatio={getDefensiveBuildRatio}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <EnergySourcesSection
            maxEnergy={effectiveState.maxEnergy}
            hoursPlayedPerDay={effectiveState.hoursPlayedPerDay}
            xanaxPerDay={effectiveState.xanaxPerDay}
            hasPointsRefill={effectiveState.hasPointsRefill}
            daysSkippedPerMonth={effectiveState.daysSkippedPerMonth}
            companyBenefit={getCompanyBenefit(effectiveState.companyBenefitKey, effectiveState.candleShopStars)}
            showCosts={showCosts}
            itemPricesData={itemPricesData}
            onUpdate={(updates) => updateState(activeState.id, updates)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <HappyPerksSection
            happy={effectiveState.happy}
            perkPercs={effectiveState.perkPercs}
            onUpdate={(updates) => {
              if ('happy' in updates) {
                updateState(activeState.id, { happy: updates.happy });
              }
              if ('perkPercs' in updates) {
                updateState(activeState.id, { perkPercs: { ...effectiveState.perkPercs, ...updates.perkPercs } });
              }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <BenefitsEventsSection
            companyBenefitKey={effectiveState.companyBenefitKey}
            candleShopStars={effectiveState.candleShopStars}
            diabetesDayEnabled={effectiveState.diabetesDayEnabled}
            diabetesDayNumberOfJumps={effectiveState.diabetesDayNumberOfJumps}
            diabetesDayFHC={effectiveState.diabetesDayFHC}
            diabetesDayGreenEgg={effectiveState.diabetesDayGreenEgg}
            diabetesDaySeasonalMail={effectiveState.diabetesDaySeasonalMail}
            diabetesDayLogoClick={effectiveState.diabetesDayLogoClick}
            onUpdate={(updates) => updateState(activeState.id, updates)}
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Stat Jumps</Typography>
      <StatJumpsSection
        edvdJumpEnabled={effectiveState.edvdJumpEnabled}
        edvdJumpFrequency={effectiveState.edvdJumpFrequency}
        edvdJumpDvds={effectiveState.edvdJumpDvds}
        edvdJumpLimit={effectiveState.edvdJumpLimit}
        edvdJumpCount={effectiveState.edvdJumpCount}
        edvdJumpStatTarget={effectiveState.edvdJumpStatTarget}
        edvdJumpAdultNovelties={effectiveState.edvdJumpAdultNovelties}
        candyJumpEnabled={effectiveState.candyJumpEnabled}
        candyJumpItemId={effectiveState.candyJumpItemId}
        candyJumpUseEcstasy={effectiveState.candyJumpUseEcstasy}
        candyJumpQuantity={effectiveState.candyJumpQuantity}
        candyJumpFactionBenefit={effectiveState.candyJumpFactionBenefit}
        energyJumpEnabled={effectiveState.energyJumpEnabled}
        energyJumpItemId={effectiveState.energyJumpItemId}
        energyJumpQuantity={effectiveState.energyJumpQuantity}
        energyJumpFactionBenefit={effectiveState.energyJumpFactionBenefit}
        lossReviveEnabled={effectiveState.lossReviveEnabled}
        lossReviveNumberPerDay={effectiveState.lossReviveNumberPerDay}
        lossReviveEnergyCost={effectiveState.lossReviveEnergyCost}
        lossReviveDaysBetween={effectiveState.lossReviveDaysBetween}
        lossRevivePricePerLoss={effectiveState.lossRevivePricePerLoss}
        hasPointsRefill={effectiveState.hasPointsRefill}
        xanaxPerDay={effectiveState.xanaxPerDay}
        maxEnergy={effectiveState.maxEnergy}
        showCosts={showCosts}
        itemPricesData={itemPricesData}
        onUpdate={(updates) => updateState(activeState.id, updates)}
      />
    </Paper>
  );
}
