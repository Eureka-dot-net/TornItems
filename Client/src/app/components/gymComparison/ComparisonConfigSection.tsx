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
  onRemoveSegment: (stateId: string, segmentId: string) => void;
  onEditSegment: (segmentId: string) => void;
}

export default function ComparisonConfigSection({
  activeState,
  updateState,
  handleRemoveState,
  canRemoveState,
  showCosts,
  itemPricesData,
  onRemoveSegment,
  onEditSegment
}: ComparisonConfigSectionProps) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField 
          label="Comparison Name" 
          value={activeState.name} 
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

      {/* Segment Management */}
      <SegmentManagement
        stateId={activeState.id}
        stateName={activeState.name}
        segments={activeState.segments || []}
        onRemoveSegment={onRemoveSegment}
        onEditSegment={onEditSegment}
      />

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
  );
}
