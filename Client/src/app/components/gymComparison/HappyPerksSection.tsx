import { Typography, Box, FormHelperText } from '@mui/material';
import { NumericTextField } from '../../../lib/components';

interface PerkPercs {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

interface HappyPerksSectionProps {
  happy: number;
  perkPercs: PerkPercs;
  onUpdate: (updates: { happy?: number; perkPercs?: Partial<PerkPercs>; islandCostPerDay?: number }) => void;
  showCosts?: boolean;
  islandCostPerDay?: number;
}

export default function HappyPerksSection({
  happy,
  perkPercs,
  onUpdate,
  showCosts = false,
  islandCostPerDay = 0,
}: HappyPerksSectionProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        Happy & Perks
      </Typography>

      <NumericTextField
        label="Happy"
        value={happy}
        onChange={(value) => onUpdate({ happy: value })}
        fullWidth
        margin="dense"
        size="small"
        min={0}
        max={99999}
      />

      {showCosts && (
        <Box sx={{ mb: 1 }}>
          <NumericTextField
            label="Island cost per day (rent + staff)"
            value={islandCostPerDay}
            onChange={(value) => onUpdate({ islandCostPerDay: value })}
            fullWidth
            margin="dense"
            size="small"
            min={0}
            step={1}
          />
          <FormHelperText>
            This should include both your island rent cost and your staff cost.
          </FormHelperText>
        </Box>
      )}

      <NumericTextField
        label="Str Perk %"
        value={perkPercs.strength}
        onChange={(value) =>
          onUpdate({
            perkPercs: {
              ...perkPercs,
              strength: value,
            },
          })
        }
        fullWidth
        margin="dense"
        size="small"
        min={0}
      />

      <NumericTextField
        label="Spd Perk %"
        value={perkPercs.speed}
        onChange={(value) =>
          onUpdate({
            perkPercs: {
              ...perkPercs,
              speed: value,
            },
          })
        }
        fullWidth
        margin="dense"
        size="small"
        min={0}
      />

      <NumericTextField
        label="Def Perk %"
        value={perkPercs.defense}
        onChange={(value) =>
          onUpdate({
            perkPercs: {
              ...perkPercs,
              defense: value,
            },
          })
        }
        fullWidth
        margin="dense"
        size="small"
        min={0}
      />

      <NumericTextField
        label="Dex Perk %"
        value={perkPercs.dexterity}
        onChange={(value) =>
          onUpdate({
            perkPercs: {
              ...perkPercs,
              dexterity: value,
            },
          })
        }
        fullWidth
        margin="dense"
        size="small"
        min={0}
      />
    </>
  );
}
