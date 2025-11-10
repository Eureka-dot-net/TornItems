import { Grid } from '@mui/material';
import EdvdJumpConfig from './EdvdJumpConfig';
import CandyJumpConfig from './CandyJumpConfig';
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

  // Candy Jump
  candyJumpEnabled: boolean;
  candyJumpItemId: number;
  candyJumpUseEcstasy: boolean;
  candyJumpQuantity: number;

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
    candyJumpEnabled?: boolean;
    candyJumpItemId?: number;
    candyJumpUseEcstasy?: boolean;
    candyJumpQuantity?: number;
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
      <Grid size={{ xs: 12, md: 3 }}>
        <EdvdJumpConfig
          enabled={props.edvdJumpEnabled}
          frequency={props.edvdJumpFrequency}
          dvds={props.edvdJumpDvds}
          limit={props.edvdJumpLimit}
          count={props.edvdJumpCount}
          statTarget={props.edvdJumpStatTarget}
          onUpdate={props.onUpdate}
        />
      </Grid>

      {/* Candy Jumps Column */}
      <Grid size={{ xs: 12, md: 3 }}>
        <CandyJumpConfig
          enabled={props.candyJumpEnabled}
          itemId={props.candyJumpItemId}
          useEcstasy={props.candyJumpUseEcstasy}
          quantity={props.candyJumpQuantity}
          hasPointsRefill={props.hasPointsRefill}
          xanaxPerDay={props.xanaxPerDay}
          maxEnergy={props.maxEnergy}
          showCosts={props.showCosts}
          itemPricesData={props.itemPricesData}
          onUpdate={props.onUpdate}
        />
      </Grid>

      {/* Energy Jumps Column */}
      <Grid size={{ xs: 12, md: 3 }}>
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
      <Grid size={{ xs: 12, md: 3 }}>
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
