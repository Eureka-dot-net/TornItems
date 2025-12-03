import { Grid } from '@mui/material';
import EdvdJumpConfig from './EdvdJumpConfig';
import CandyJumpConfig from './CandyJumpConfig';
import StackedCandyJumpConfig from './StackedCandyJumpConfig';
import EnergyJumpConfig from './EnergyJumpConfig';
import LossReviveConfig from './LossReviveConfig';

interface StatJumpsSectionProps {
  // EDVD Jump
  edvdJumpEnabled: boolean;
  edvdJumpFrequency: number;
  edvdJumpDvds: number;
  edvdJumpLimit: 'indefinite' | 'count' | 'stat';
  edvdJumpCount: number;
  edvdJumpStatTarget: number;
  edvdJumpAdultNovelties: boolean;

  // Candy Jump
  candyJumpEnabled: boolean;
  candyJumpFrequencyDays: number;
  candyJumpItemId: number;
  candyJumpQuantity: number;
  candyJumpFactionBenefit: number;
  candyJumpDrugUsed: 'none' | 'xanax' | 'ecstasy';
  candyJumpDrugAlreadyIncluded: boolean;
  candyJumpUsePointRefill: boolean;

  // Stacked Candy Jump
  stackedCandyJumpEnabled: boolean;
  stackedCandyJumpFrequency: number;
  stackedCandyJumpItemId: number;
  stackedCandyJumpQuantity: number;
  stackedCandyJumpFactionBenefit: number;
  stackedCandyJumpLimit: 'indefinite' | 'count' | 'stat';
  stackedCandyJumpCount: number;
  stackedCandyJumpStatTarget: number;
  stackedCandyJumpUsePointRefill: boolean;
  stackedCandyJumpXanaxStacked: number;
  stackedCandyJumpStackOnNaturalEnergy: boolean;

  // Energy Jump
  energyJumpEnabled: boolean;
  energyJumpItemId: number;
  energyJumpQuantity: number;
  energyJumpFactionBenefit: number;

  // Loss/Revive
  lossReviveEnabled: boolean;
  lossReviveNumberPerDay: number;
  lossReviveEnergyCost: number;
  lossReviveDaysBetween: number;
  lossRevivePricePerLoss: number;

  // Additional props needed for display
  hasPointsRefill: boolean;
  xanaxPerDay: number;
  maxEnergy: number;
  showCosts: boolean;
  itemPricesData?: {
    prices: Record<number, number | null>;
  };

  // Callbacks
  onUpdate: (updates: {
    edvdJumpEnabled?: boolean;
    edvdJumpFrequency?: number;
    edvdJumpDvds?: number;
    edvdJumpLimit?: 'indefinite' | 'count' | 'stat';
    edvdJumpCount?: number;
    edvdJumpStatTarget?: number;
    edvdJumpAdultNovelties?: boolean;
    candyJumpEnabled?: boolean;
    candyJumpFrequencyDays?: number;
    candyJumpItemId?: number;
    candyJumpQuantity?: number;
    candyJumpFactionBenefit?: number;
    candyJumpDrugUsed?: 'none' | 'xanax' | 'ecstasy';
    candyJumpDrugAlreadyIncluded?: boolean;
    candyJumpUsePointRefill?: boolean;
    stackedCandyJumpEnabled?: boolean;
    stackedCandyJumpFrequency?: number;
    stackedCandyJumpItemId?: number;
    stackedCandyJumpQuantity?: number;
    stackedCandyJumpFactionBenefit?: number;
    stackedCandyJumpLimit?: 'indefinite' | 'count' | 'stat';
    stackedCandyJumpCount?: number;
    stackedCandyJumpStatTarget?: number;
    stackedCandyJumpUsePointRefill?: boolean;
    stackedCandyJumpXanaxStacked?: number;
    stackedCandyJumpStackOnNaturalEnergy?: boolean;
    energyJumpEnabled?: boolean;
    energyJumpItemId?: number;
    energyJumpQuantity?: number;
    energyJumpFactionBenefit?: number;
    lossReviveEnabled?: boolean;
    lossReviveNumberPerDay?: number;
    lossReviveEnergyCost?: number;
    lossReviveDaysBetween?: number;
    lossRevivePricePerLoss?: number;
  }) => void;
}

export default function StatJumpsSection(props: StatJumpsSectionProps) {
  return (
    <Grid container spacing={2}>
      {/* EDVD Jumps Column */}
      <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
        <EdvdJumpConfig
          enabled={props.edvdJumpEnabled}
          frequency={props.edvdJumpFrequency}
          dvds={props.edvdJumpDvds}
          limit={props.edvdJumpLimit}
          count={props.edvdJumpCount}
          statTarget={props.edvdJumpStatTarget}
          adultNovelties={props.edvdJumpAdultNovelties}
          stackedCandyJumpEnabled={props.stackedCandyJumpEnabled}
          onUpdate={props.onUpdate}
        />
      </Grid>

      {/* Candy Jumps Column */}
      <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
        <CandyJumpConfig
          enabled={props.candyJumpEnabled}
          frequencyDays={props.candyJumpFrequencyDays}
          itemId={props.candyJumpItemId}
          quantity={props.candyJumpQuantity}
          factionBenefit={props.candyJumpFactionBenefit}
          drugUsed={props.candyJumpDrugUsed}
          drugAlreadyIncluded={props.candyJumpDrugAlreadyIncluded}
          usePointRefill={props.candyJumpUsePointRefill}
          hasPointsRefill={props.hasPointsRefill}
          xanaxPerDay={props.xanaxPerDay}
          maxEnergy={props.maxEnergy}
          showCosts={props.showCosts}
          itemPricesData={props.itemPricesData}
          onUpdate={props.onUpdate}
        />
      </Grid>

      {/* Stacked Candy Jumps Column */}
      <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
        <StackedCandyJumpConfig
          enabled={props.stackedCandyJumpEnabled}
          frequency={props.stackedCandyJumpFrequency}
          itemId={props.stackedCandyJumpItemId}
          quantity={props.stackedCandyJumpQuantity}
          factionBenefit={props.stackedCandyJumpFactionBenefit}
          limit={props.stackedCandyJumpLimit}
          count={props.stackedCandyJumpCount}
          statTarget={props.stackedCandyJumpStatTarget}
          usePointRefill={props.stackedCandyJumpUsePointRefill}
          xanaxStacked={props.stackedCandyJumpXanaxStacked}
          stackOnNaturalEnergy={props.stackedCandyJumpStackOnNaturalEnergy}
          hasPointsRefill={props.hasPointsRefill}
          showCosts={props.showCosts}
          itemPricesData={props.itemPricesData}
          onUpdate={props.onUpdate}
        />
      </Grid>

      {/* Energy Jumps Column */}
      <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
        <EnergyJumpConfig
          enabled={props.energyJumpEnabled}
          itemId={props.energyJumpItemId}
          quantity={props.energyJumpQuantity}
          factionBenefit={props.energyJumpFactionBenefit}
          maxEnergy={props.maxEnergy}
          showCosts={props.showCosts}
          itemPricesData={props.itemPricesData}
          onUpdate={props.onUpdate}
        />
      </Grid>

      {/* Loss/Revive Column */}
      <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
        <LossReviveConfig
          enabled={props.lossReviveEnabled}
          numberPerDay={props.lossReviveNumberPerDay}
          energyCost={props.lossReviveEnergyCost}
          daysBetween={props.lossReviveDaysBetween}
          pricePerLoss={props.lossRevivePricePerLoss}
          showCosts={props.showCosts}
          onUpdate={props.onUpdate}
        />
      </Grid>
    </Grid>
  );
}
