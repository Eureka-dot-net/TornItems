import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { NumericTextField } from '../../../lib/components';
import { CANDY_ITEM_IDS, DEFAULT_CANDY_QUANTITY } from '../../../lib/constants/gymConstants';

/**
 * StackedCandyJumpWizardSubStep Component
 * 
 * This sub-step helps users configure their stacked candy jump training.
 * A stacked candy jump is similar to an eDVD jump but uses candies instead of DVDs.
 * It asks questions in an easy-to-understand format for basic users.
 * 
 * @param mode - 'current' for current regime configuration, 'comparison' for comparison configuration
 */

export type WizardMode = 'current' | 'comparison';

interface StackedCandyJumpWizardSubStepProps {
  mode?: WizardMode;
}

export default function StackedCandyJumpWizardSubStep({ mode = 'current' }: StackedCandyJumpWizardSubStepProps) {
  const isComparison = mode === 'comparison';
  const storagePrefix = isComparison ? 'gymWizard_comparison_' : 'gymWizard_';

  // Load saved preferences from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Load from main wizard prefix (for checking hasPointsRefill)
  const loadMainWizardValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [frequency, setFrequency] = useState<number>(() => loadSavedValue('stackedCandyJumpFrequency', 7));
  const [itemId, setItemId] = useState<number>(() => 
    loadSavedValue('stackedCandyJumpItemId', CANDY_ITEM_IDS.HAPPY_75)
  );
  const [quantity, setQuantity] = useState<number>(() => 
    loadSavedValue('stackedCandyJumpQuantity', DEFAULT_CANDY_QUANTITY)
  );
  const [factionBenefit, setFactionBenefit] = useState<number>(() => 
    loadSavedValue('stackedCandyJumpFactionBenefit', 0)
  );
  const [limit, setLimit] = useState<'indefinite' | 'count' | 'stat'>(() => 
    loadSavedValue('stackedCandyJumpLimit', 'indefinite')
  );
  const [count, setCount] = useState<number>(() => loadSavedValue('stackedCandyJumpCount', 10));
  const [statTarget, setStatTarget] = useState<number>(() => loadSavedValue('stackedCandyJumpStatTarget', 1000000));
  
  // New fields for xanax stacking options
  const [xanaxStacked, setXanaxStacked] = useState<number>(() => loadSavedValue('stackedCandyJumpXanaxStacked', 4));
  const [stackOnNaturalEnergy, setStackOnNaturalEnergy] = useState<boolean>(() => 
    loadSavedValue('stackedCandyJumpStackOnNaturalEnergy', false)
  );
  const [usePointRefill, setUsePointRefill] = useState<boolean>(() => 
    loadSavedValue('stackedCandyJumpUsePointRefill', false)
  );
  
  // Check if user already uses daily points refill (from energy sources step)
  const hasPointsRefill = loadMainWizardValue('hasPointsRefill', true);

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem(`${storagePrefix}stackedCandyJumpEnabled`, JSON.stringify(true));
    localStorage.setItem(`${storagePrefix}stackedCandyJumpFrequency`, JSON.stringify(frequency));
    localStorage.setItem(`${storagePrefix}stackedCandyJumpItemId`, JSON.stringify(itemId));
    localStorage.setItem(`${storagePrefix}stackedCandyJumpQuantity`, JSON.stringify(quantity));
    localStorage.setItem(`${storagePrefix}stackedCandyJumpFactionBenefit`, JSON.stringify(factionBenefit));
    localStorage.setItem(`${storagePrefix}stackedCandyJumpLimit`, JSON.stringify(limit));
    localStorage.setItem(`${storagePrefix}stackedCandyJumpCount`, JSON.stringify(count));
    localStorage.setItem(`${storagePrefix}stackedCandyJumpStatTarget`, JSON.stringify(statTarget));
    localStorage.setItem(`${storagePrefix}stackedCandyJumpXanaxStacked`, JSON.stringify(xanaxStacked));
    localStorage.setItem(`${storagePrefix}stackedCandyJumpStackOnNaturalEnergy`, JSON.stringify(stackOnNaturalEnergy));
    localStorage.setItem(`${storagePrefix}stackedCandyJumpUsePointRefill`, JSON.stringify(usePointRefill));
  }, [frequency, itemId, quantity, factionBenefit, limit, count, statTarget, xanaxStacked, stackOnNaturalEnergy, usePointRefill, storagePrefix]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {isComparison ? 'Configure Comparison Stacked Candy Jump Training' : 'Configure Your Stacked Candy Jump Training'}
      </Typography>

      <Typography variant="body1" paragraph>
        {isComparison 
          ? <>Configure the stacked candy jump settings for your <strong>comparison scenario</strong>. 
              Adjust these values to see how different stacked candy strategies would affect your gains.</>
          : <>Stacked candy jumps work like eDVD jumps but use happiness candies instead of Educational DVDs.
              Let's configure how you use them in your training routine.</>
        }
      </Typography>

      <Alert severity={isComparison ? 'warning' : 'info'} sx={{ mb: 3 }}>
        <Typography variant="body2" paragraph>
          {isComparison 
            ? <>These settings are for your <strong>comparison scenario</strong>. Modify them to 
                see how changes to your stacked candy strategy would impact your training.</>
            : <><strong>What is a Stacked Candy Jump?</strong> You stack xanax before the jump day, 
                then on jump day use 1 more xanax and 1 ecstasy along with happiness candies
                to get a temporary happiness boost. This allows you to train at higher gym levels and gain more stats.</>
          }
        </Typography>
        {!isComparison && (
          <Typography variant="body2">
            <strong>Key difference from eDVD:</strong> Candies provide less happiness than DVDs but can be used 
            in larger quantities and are affected by faction perks.
          </Typography>
        )}
      </Alert>

      {/* Frequency */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          How often do you do stacked candy jumps? (days between jumps)
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          For example, if you do stacked candy jumps once per week, enter 7.
        </Typography>
        <NumericTextField
          value={frequency}
          onChange={(value) => setFrequency(value)}
          fullWidth
          size="small"
          min={1}
          step={1}
          defaultValue={7}
          helperText="Enter number of days between stacked candy jump sessions"
        />
      </Box>

      {/* Xanax Stacking */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          How many Xanax will you stack for each jump?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Traditionally, stacked jumps use 4 xanax (3 stacked the day before + 1 on jump day) for 1000 energy.
          You can stack fewer xanax if you prefer (1-4).
        </Typography>
        <NumericTextField
          value={xanaxStacked}
          onChange={(value) => setXanaxStacked(value)}
          fullWidth
          size="small"
          min={1}
          max={4}
          step={1}
          defaultValue={4}
          helperText="1-4 xanax. 4 = 1000 energy, 3 = 750, 2 = 500, 1 = 250"
        />
      </Box>

      {/* Stack on Natural Energy - only show if less than 4 xanax */}
      {xanaxStacked < 4 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Will you stack on top of your natural energy?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            If yes, your energy bar will be full when you start the jump, adding to your stacked xanax energy.
            For example, with 3 xanax + natural energy on a 150 energy bar = 950 energy.
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={stackOnNaturalEnergy}
                onChange={(e) => setStackOnNaturalEnergy(e.target.checked)}
              />
            }
            label={stackOnNaturalEnergy 
              ? 'Yes, I will have a full energy bar when I start the jump' 
              : 'No, I will only use the xanax energy'
            }
          />
        </Box>
      )}

      {/* Point Refill - only show if user doesn't already use daily points refill */}
      {!hasPointsRefill && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Will you use a point refill during the jump?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Since you don't currently use daily point refills, you can choose to use one specifically
            for your stacked candy jumps to add extra energy.
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={usePointRefill}
                onChange={(e) => setUsePointRefill(e.target.checked)}
              />
            }
            label={usePointRefill 
              ? 'Yes, I will use a point refill during the jump' 
              : 'No, I will not use a point refill'
            }
          />
        </Box>
      )}

      {/* Candy Type */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          What type of candy do you use?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Higher happiness candies give more happiness per candy but cost more.
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Candy Type</InputLabel>
          <Select
            value={itemId}
            label="Candy Type"
            onChange={(e) => setItemId(Number(e.target.value))}
          >
            <MenuItem value={CANDY_ITEM_IDS.HAPPY_25}>25 Happy Candy (e.g., Lollipop)</MenuItem>
            <MenuItem value={CANDY_ITEM_IDS.HAPPY_35}>35 Happy Candy (e.g., Box of Bon Bons)</MenuItem>
            <MenuItem value={CANDY_ITEM_IDS.HAPPY_75}>75 Happy Candy (e.g., Box of Chocolate Bars)</MenuItem>
            <MenuItem value={CANDY_ITEM_IDS.HAPPY_100}>100 Happy Candy (e.g., Box of Extra Strong Mints)</MenuItem>
            <MenuItem value={CANDY_ITEM_IDS.HAPPY_150}>150 Happy Candy (e.g., Bag of Sherbet)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Quantity per jump */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          How many candies do you use per stacked jump?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Unlike DVDs which are limited to a few per jump, candies can be used in much larger quantities.
          The default maximum is 48 without specialized job perks.
        </Typography>
        <NumericTextField
          value={quantity}
          onChange={(value) => setQuantity(value)}
          fullWidth
          size="small"
          min={1}
          step={1}
          defaultValue={DEFAULT_CANDY_QUANTITY}
          helperText="Enter number of candies used per session"
        />
      </Box>

      {/* Faction Benefit */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Faction perks (% increase in happiness from candies)
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Some faction perks provide percentage bonuses to candy happiness. Enter 0 if you don't have any.
          This is a key advantage of candy jumps over eDVD jumps.
        </Typography>
        <NumericTextField
          value={factionBenefit}
          onChange={(value) => setFactionBenefit(value)}
          fullWidth
          size="small"
          min={0}
          step={1}
          helperText="Enter percentage bonus (e.g., 10 for 10% bonus)"
        />
      </Box>

      {/* Jump Limit */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          How long do you plan to continue doing stacked candy jumps?
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Duration Plan</InputLabel>
          <Select
            value={limit}
            label="Duration Plan"
            onChange={(e) => setLimit(e.target.value as 'indefinite' | 'count' | 'stat')}
          >
            <MenuItem value="indefinite">
              Indefinitely - I'll keep doing them throughout my training
            </MenuItem>
            <MenuItem value="count">
              A specific number of times
            </MenuItem>
            <MenuItem value="stat">
              Until I reach a certain stat level
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Conditional: Count */}
      {limit === 'count' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            How many stacked candy jump sessions will you do in total?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enter the total number of stacked candy jump sessions you plan to complete.
          </Typography>
          <NumericTextField
            value={count}
            onChange={(value) => setCount(value)}
            fullWidth
            size="small"
            min={1}
            step={1}
            defaultValue={10}
            helperText="Enter total number of sessions"
          />
        </Box>
      )}

      {/* Conditional: Stat Target */}
      {limit === 'stat' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            What is your target stat level? (individual stat)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            For example, enter 1000000 if you want to stop when you reach 1M in all stats.
          </Typography>
          <NumericTextField
            value={statTarget}
            onChange={(value) => setStatTarget(value)}
            fullWidth
            size="small"
            min={0}
            step={100000}
            defaultValue={1000000}
            helperText="Enter target stat level"
          />
        </Box>
      )}

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          {isComparison 
            ? 'Your comparison stacked candy jump configuration has been saved. Click Next to continue.'
            : 'Your stacked candy jump configuration has been saved. Click Next to continue.'
          }
        </Typography>
      </Alert>
    </Box>
  );
}
