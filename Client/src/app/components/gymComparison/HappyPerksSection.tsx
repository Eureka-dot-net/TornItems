import { Typography, TextField } from '@mui/material';

interface PerkPercs {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

interface HappyPerksSectionProps {
  happy: number;
  perkPercs: PerkPercs;
  onUpdate: (updates: { happy?: number; perkPercs?: Partial<PerkPercs> }) => void;
}

export default function HappyPerksSection({
  happy,
  perkPercs,
  onUpdate,
}: HappyPerksSectionProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        Happy & Perks
      </Typography>

      <TextField
        label="Happy"
        type="number"
        value={happy ?? ''}
        onChange={(e) =>
          onUpdate({
            happy: e.target.value === '' ? 0 : Math.max(0, Math.min(99999, Number(e.target.value))),
          })
        }
        fullWidth
        margin="dense"
        size="small"
        inputProps={{ step: 'any', min: 0, max: 99999 }}
      />

      <TextField
        label="Str Perk %"
        type="number"
        value={perkPercs.strength ?? ''}
        onChange={(e) =>
          onUpdate({
            perkPercs: {
              ...perkPercs,
              strength: e.target.value === '' ? 0 : Number(e.target.value),
            },
          })
        }
        fullWidth
        margin="dense"
        size="small"
        inputProps={{ step: 'any', min: 0 }}
      />

      <TextField
        label="Spd Perk %"
        type="number"
        value={perkPercs.speed ?? ''}
        onChange={(e) =>
          onUpdate({
            perkPercs: {
              ...perkPercs,
              speed: e.target.value === '' ? 0 : Number(e.target.value),
            },
          })
        }
        fullWidth
        margin="dense"
        size="small"
        inputProps={{ step: 'any', min: 0 }}
      />

      <TextField
        label="Def Perk %"
        type="number"
        value={perkPercs.defense ?? ''}
        onChange={(e) =>
          onUpdate({
            perkPercs: {
              ...perkPercs,
              defense: e.target.value === '' ? 0 : Number(e.target.value),
            },
          })
        }
        fullWidth
        margin="dense"
        size="small"
        inputProps={{ step: 'any', min: 0 }}
      />

      <TextField
        label="Dex Perk %"
        type="number"
        value={perkPercs.dexterity ?? ''}
        onChange={(e) =>
          onUpdate({
            perkPercs: {
              ...perkPercs,
              dexterity: e.target.value === '' ? 0 : Number(e.target.value),
            },
          })
        }
        fullWidth
        margin="dense"
        size="small"
        inputProps={{ step: 'any', min: 0 }}
      />
    </>
  );
}
