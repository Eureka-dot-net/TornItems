import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Checkbox,
  FormGroup,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  simulateGymProgression,
  calculateDailyEnergy,
  type Gym,
  type SimulationInputs,
  type CompanyBenefit,
  type SimulationResult,
} from '../../lib/utils/gymProgressionCalculator';
import { useGymStats } from '../../lib/hooks/useGymStats';

// Hardcoded gym data (matches seedGyms.ts) - cumulative energyToUnlock values
const GYMS: Gym[] = [
  { name: "premierfitness", displayName: "Premier Fitness", strength: 2, speed: 2, defense: 2, dexterity: 2, energyPerTrain: 5, costToUnlock: 10, energyToUnlock: 0 },
  { name: "averagejoes", displayName: "Average Joes", strength: 2.4, speed: 2.4, defense: 2.7, dexterity: 2.4, energyPerTrain: 5, costToUnlock: 100, energyToUnlock: 200 },
  { name: "woodysworkout", displayName: "Woody's Workout", strength: 2.7, speed: 3.2, defense: 3, dexterity: 2.7, energyPerTrain: 5, costToUnlock: 250, energyToUnlock: 700 },
  { name: "beachbods", displayName: "Beach Bods", strength: 3.2, speed: 3.2, defense: 3.2, dexterity: null, energyPerTrain: 5, costToUnlock: 500, energyToUnlock: 1700 },
  { name: "silvergym", displayName: "Silver Gym", strength: 3.4, speed: 3.6, defense: 3.4, dexterity: 3.2, energyPerTrain: 5, costToUnlock: 1000, energyToUnlock: 3700 },
  { name: "pourfemme", displayName: "Pour Femme", strength: 3.4, speed: 3.6, defense: 3.6, dexterity: 3.8, energyPerTrain: 5, costToUnlock: 2500, energyToUnlock: 6450 },
  { name: "daviesden", displayName: "Davies Den", strength: 3.7, speed: null, defense: 3.7, dexterity: 3.7, energyPerTrain: 5, costToUnlock: 5000, energyToUnlock: 9450 },
  { name: "globalgym", displayName: "Global Gym", strength: 4, speed: 4, defense: 4, dexterity: 4, energyPerTrain: 5, costToUnlock: 10000, energyToUnlock: 12950 },
  { name: "knuckleheads", displayName: "Knuckle Heads", strength: 4.8, speed: 4.4, defense: 4, dexterity: 4.2, energyPerTrain: 10, costToUnlock: 50000, energyToUnlock: 16950 },
  { name: "pioneerfitness", displayName: "Pioneer Fitness", strength: 4.4, speed: 4.6, defense: 4.8, dexterity: 4.4, energyPerTrain: 10, costToUnlock: 100000, energyToUnlock: 22950 },
  { name: "anabolicanomalies", displayName: "Anabolic Anomalies", strength: 5, speed: 4.6, defense: 5.2, dexterity: 4.6, energyPerTrain: 10, costToUnlock: 250000, energyToUnlock: 29950 },
  { name: "core", displayName: "Core", strength: 5, speed: 5.2, defense: 5, dexterity: 5, energyPerTrain: 10, costToUnlock: 500000, energyToUnlock: 37950 },
  { name: "racingfitness", displayName: "Racing Fitness", strength: 5, speed: 5.4, defense: 4.8, dexterity: 5.2, energyPerTrain: 10, costToUnlock: 1000000, energyToUnlock: 48950 },
  { name: "completecardio", displayName: "Complete Cardio", strength: 5.5, speed: 5.7, defense: 5.5, dexterity: 5.2, energyPerTrain: 10, costToUnlock: 2000000, energyToUnlock: 61370 },
  { name: "legsbumsandtums", displayName: "Legs, Bums and Tums", strength: null, speed: 5.5, defense: 5.5, dexterity: 5.7, energyPerTrain: 10, costToUnlock: 3000000, energyToUnlock: 79370 },
  { name: "deepburn", displayName: "Deep Burn", strength: 6, speed: 6, defense: 6, dexterity: 6, energyPerTrain: 10, costToUnlock: 5000000, energyToUnlock: 97470 },
  { name: "apollogym", displayName: "Apollo Gym", strength: 6, speed: 6.2, defense: 6.4, dexterity: 6.2, energyPerTrain: 10, costToUnlock: 7500000, energyToUnlock: 121610 },
  { name: "gunshop", displayName: "Gun Shop", strength: 6.5, speed: 6.4, defense: 6.2, dexterity: 6.2, energyPerTrain: 10, costToUnlock: 10000000, energyToUnlock: 152870 },
  { name: "forcetraining", displayName: "Force Training", strength: 6.4, speed: 6.5, defense: 6.4, dexterity: 6.8, energyPerTrain: 10, costToUnlock: 15000000, energyToUnlock: 189480 },
  { name: "chachas", displayName: "Cha Cha's", strength: 6.4, speed: 6.4, defense: 6.8, dexterity: 7, energyPerTrain: 10, costToUnlock: 20000000, energyToUnlock: 236120 },
  { name: "atlas", displayName: "Atlas", strength: 7, speed: 6.4, defense: 6.4, dexterity: 6.5, energyPerTrain: 10, costToUnlock: 30000000, energyToUnlock: 292640 },
  { name: "lastround", displayName: "Last Round", strength: 6.8, speed: 6.5, defense: 7, dexterity: 6.5, energyPerTrain: 10, costToUnlock: 50000000, energyToUnlock: 360415 },
  { name: "theedge", displayName: "The Edge", strength: 6.8, speed: 7, defense: 7, dexterity: 6.8, energyPerTrain: 10, costToUnlock: 75000000, energyToUnlock: 444950 },
  { name: "georges", displayName: "George's", strength: 7.3, speed: 7.3, defense: 7.3, dexterity: 7.3, energyPerTrain: 10, costToUnlock: 100000000, energyToUnlock: 551255 },
];

// Function to get company benefits with dynamic candle shop stars
const getCompanyBenefits = (candleShopStars: number): Record<string, CompanyBenefit> => ({
  none: {
    name: 'No Benefits',
    gymUnlockSpeedMultiplier: 1.0,
    bonusEnergyPerDay: 0,
    gymGainMultiplier: 1.0,
  },
  musicStore: {
    name: '3★ Music Store',
    gymUnlockSpeedMultiplier: 1.3, // 30% faster
    bonusEnergyPerDay: 0,
    gymGainMultiplier: 1.0,
  },
  candleShop: {
    name: `${candleShopStars}★ Candle Shop`,
    gymUnlockSpeedMultiplier: 1.0,
    bonusEnergyPerDay: candleShopStars * 5,
    gymGainMultiplier: 1.0,
  },
  fitnessCenter: {
    name: '10★ Fitness Center',
    gymUnlockSpeedMultiplier: 1.0,
    bonusEnergyPerDay: 0,
    gymGainMultiplier: 1.03, // 3% gym gains
  },
});

export default function GymComparison() {
  // Load saved values from localStorage or use defaults
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymComparison_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Form inputs with localStorage persistence
  const [mode, setMode] = useState<'future' | 'manual'>(() => loadSavedValue('mode', 'future'));
  const [manualEnergy, setManualEnergy] = useState<number>(() => loadSavedValue('manualEnergy', 1000));
  const [autoUpgradeGyms, setAutoUpgradeGyms] = useState<boolean>(() => loadSavedValue('autoUpgradeGyms', true));
  const [happyJumpEnabled, setHappyJumpEnabled] = useState<boolean>(() => loadSavedValue('happyJumpEnabled', false));
  const [happyJumpFrequency, setHappyJumpFrequency] = useState<number>(() => loadSavedValue('happyJumpFrequency', 7));
  const [happyJumpDvds, setHappyJumpDvds] = useState<number>(() => loadSavedValue('happyJumpDvds', 1));
  const [statWeights, setStatWeights] = useState(() => 
    loadSavedValue('statWeights', { strength: 1, speed: 1, defense: 1, dexterity: 1 })
  );
  const [months, setMonths] = useState<number>(() => loadSavedValue('months', 6));
  const [xanaxPerDay, setXanaxPerDay] = useState<number>(() => loadSavedValue('xanaxPerDay', 0));
  const [hasPointsRefill, setHasPointsRefill] = useState<boolean>(() => loadSavedValue('hasPointsRefill', false));
  const [hoursPlayedPerDay, setHoursPlayedPerDay] = useState<number>(() => loadSavedValue('hoursPlayedPerDay', 8));
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>(() => loadSavedValue('selectedBenefits', ['none']));
  const [apiKey, setApiKey] = useState<string>(() => loadSavedValue('apiKey', ''));
  const [happy, setHappy] = useState<number>(() => loadSavedValue('happy', 5000));
  const [perkPerc, setPerkPerc] = useState<number>(() => loadSavedValue('perkPerc', 0));
  const [initialStats, setInitialStats] = useState(() => 
    loadSavedValue('initialStats', { strength: 1000, speed: 1000, defense: 1000, dexterity: 1000 })
  );
  const [candleShopStars, setCandleShopStars] = useState<number>(() => loadSavedValue('candleShopStars', 10));
  const [currentGymIndex, setCurrentGymIndex] = useState<number>(() => loadSavedValue('currentGymIndex', 0));
  
  // Save to localStorage whenever values change
  useEffect(() => {
    localStorage.setItem('gymComparison_mode', JSON.stringify(mode));
  }, [mode]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_manualEnergy', JSON.stringify(manualEnergy));
  }, [manualEnergy]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_autoUpgradeGyms', JSON.stringify(autoUpgradeGyms));
  }, [autoUpgradeGyms]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_happyJumpEnabled', JSON.stringify(happyJumpEnabled));
  }, [happyJumpEnabled]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_happyJumpFrequency', JSON.stringify(happyJumpFrequency));
  }, [happyJumpFrequency]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_happyJumpDvds', JSON.stringify(happyJumpDvds));
  }, [happyJumpDvds]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_statWeights', JSON.stringify(statWeights));
  }, [statWeights]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_months', JSON.stringify(months));
  }, [months]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_xanaxPerDay', JSON.stringify(xanaxPerDay));
  }, [xanaxPerDay]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_hasPointsRefill', JSON.stringify(hasPointsRefill));
  }, [hasPointsRefill]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_hoursPlayedPerDay', JSON.stringify(hoursPlayedPerDay));
  }, [hoursPlayedPerDay]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_selectedBenefits', JSON.stringify(selectedBenefits));
  }, [selectedBenefits]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_apiKey', JSON.stringify(apiKey));
  }, [apiKey]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_happy', JSON.stringify(happy));
  }, [happy]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_perkPerc', JSON.stringify(perkPerc));
  }, [perkPerc]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_initialStats', JSON.stringify(initialStats));
  }, [initialStats]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_candleShopStars', JSON.stringify(candleShopStars));
  }, [candleShopStars]);
  
  useEffect(() => {
    localStorage.setItem('gymComparison_currentGymIndex', JSON.stringify(currentGymIndex));
  }, [currentGymIndex]);
  
  // Results
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use the gym stats hook
  const { data: gymStatsData, isLoading: isLoadingGymStats, error: gymStatsError, refetch: refetchGymStats } = useGymStats(apiKey || null);
  
  // Calculate and display daily energy (use candleShopStars * 5 if candleShop is selected)
  const candleShopBonus = selectedBenefits.includes('candleShop') ? candleShopStars * 5 : 0;
  const dailyEnergy = calculateDailyEnergy(hoursPlayedPerDay, xanaxPerDay, hasPointsRefill, candleShopBonus);
  
  // Auto-populate stats when gym stats are fetched
  useEffect(() => {
    if (gymStatsData) {
      setInitialStats({
        strength: gymStatsData.battlestats.strength,
        speed: gymStatsData.battlestats.speed,
        defense: gymStatsData.battlestats.defense,
        dexterity: gymStatsData.battlestats.dexterity,
      });
      setPerkPerc(gymStatsData.perkPerc);
      setCurrentGymIndex(Math.max(0, gymStatsData.activeGym - 1)); // Torn gyms are 1-indexed
    }
  }, [gymStatsData]);
  
  // Show error from gym stats fetch
  useEffect(() => {
    if (gymStatsError) {
      setError(gymStatsError instanceof Error ? gymStatsError.message : 'Failed to fetch gym stats');
    }
  }, [gymStatsError]);
  
  // Function to fetch user stats from Torn API
  const handleFetchStats = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }
    
    setError(null);
    refetchGymStats();
  };
  
  // Function to calculate time to unlock George's gym
  const calculateTimeToGeorges = (companyBenefit: CompanyBenefit): string => {
    const georgesGym = GYMS[GYMS.length - 1]; // George's is the last gym
    const currentGym = GYMS[currentGymIndex];
    
    // Calculate energy needed from current gym to George's
    const energyNeeded = (georgesGym.energyToUnlock - currentGym.energyToUnlock) / companyBenefit.gymUnlockSpeedMultiplier;
    
    // Calculate daily energy for this benefit
    const benefitDailyEnergy = calculateDailyEnergy(
      hoursPlayedPerDay, 
      xanaxPerDay, 
      hasPointsRefill, 
      companyBenefit.bonusEnergyPerDay
    );
    
    const daysNeeded = Math.ceil(energyNeeded / benefitDailyEnergy);
    return formatDaysToHumanReadable(daysNeeded);
  };
  
  const handleSimulate = () => {
    setIsSimulating(true);
    setError(null);
    
    try {
      if (mode === 'manual') {
        // Manual mode: single calculation with specified energy
        const inputs: SimulationInputs = {
          statWeights,
          months: 0, // Not used in manual mode
          xanaxPerDay: 0,
          hasPointsRefill: false,
          hoursPlayedPerDay: 0,
          companyBenefit: getCompanyBenefits(candleShopStars)['none'], // Use no benefits as base
          apiKey,
          initialStats,
          happy,
          perkPerc,
          currentGymIndex: autoUpgradeGyms ? -1 : currentGymIndex, // -1 means auto-upgrade
          manualEnergy, // Use manual energy
        };
        
        const result = simulateGymProgression(GYMS, inputs);
        // Store in results with a special key for manual mode
        setResults({ manual: result });
      } else {
        // Future mode: compare multiple benefits
        const newResults: Record<string, SimulationResult> = {};
        const COMPANY_BENEFITS = getCompanyBenefits(candleShopStars);
        
        for (const benefitKey of selectedBenefits) {
          const benefit = COMPANY_BENEFITS[benefitKey];
          
          const inputs: SimulationInputs = {
            statWeights,
            months,
            xanaxPerDay,
            hasPointsRefill,
            hoursPlayedPerDay,
            companyBenefit: benefit,
            apiKey,
            initialStats,
            happy,
            perkPerc,
            currentGymIndex,
            happyJump: happyJumpEnabled ? {
              enabled: true,
              frequencyDays: happyJumpFrequency,
              dvdsUsed: happyJumpDvds,
            } : undefined,
          };
          
          const result = simulateGymProgression(GYMS, inputs);
          newResults[benefitKey] = result;
        }
        
        setResults(newResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsSimulating(false);
    }
  };
  
  const handleBenefitToggle = (benefitKey: string) => {
    setSelectedBenefits(prev => {
      if (prev.includes(benefitKey)) {
        return prev.filter(k => k !== benefitKey);
      } else {
        return [...prev, benefitKey];
      }
    });
  };
  
  // Helper function to format days into human-readable time
  const formatDaysToHumanReadable = (days: number): string => {
    const years = Math.floor(days / 365);
    const remainingAfterYears = days % 365;
    const months = Math.floor(remainingAfterYears / 30);
    const remainingDays = remainingAfterYears % 30;
    
    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (remainingDays > 0 || parts.length === 0) parts.push(`${remainingDays} day${remainingDays !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { day: number }; name: string; value: number; color: string }> }) => {
    if (active && payload && payload.length) {
      const day = payload[0].payload.day;
      const timeStr = formatDaysToHumanReadable(day);
      
      return (
        <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.9)', border: '1px solid #555' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {timeStr}
          </Typography>
          {payload.map((entry, index: number) => {
            // Find the gym for this benefit at this day
            // Skip for manual mode as COMPANY_BENEFITS won't have 'manual' key
            if (mode === 'manual') {
              return (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="body2" style={{ color: entry.color }}>
                    {entry.name}: {entry.value?.toLocaleString()}
                  </Typography>
                </Box>
              );
            }
            
            const benefitKey = Object.keys(results).find(key => 
              COMPANY_BENEFITS[key]?.name === entry.name
            );
            const snapshot = benefitKey ? 
              results[benefitKey].dailySnapshots.find(s => s.day === day) : null;
            
            return (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography variant="body2" style={{ color: entry.color }}>
                  {entry.name}: {entry.value?.toLocaleString()}
                </Typography>
                {snapshot && (
                  <Typography variant="caption" sx={{ color: '#aaa', display: 'block', ml: 1 }}>
                    Gym: {snapshot.currentGym}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Paper>
      );
    }
    return null;
  };
  
  // Prepare chart data (only for future mode)
  const COMPANY_BENEFITS = getCompanyBenefits(candleShopStars);
  const chartData = mode === 'future' && Object.keys(results).length > 0 ? 
    results[Object.keys(results)[0]].dailySnapshots.map((_, index) => {
      const dataPoint: Record<string, number> = { day: results[Object.keys(results)[0]].dailySnapshots[index].day };
      
      for (const benefitKey of Object.keys(results)) {
        const snapshot = results[benefitKey].dailySnapshots[index];
        const benefit = COMPANY_BENEFITS[benefitKey];
        
        // Calculate total battle stats
        const totalStats = snapshot.strength + snapshot.speed + snapshot.defense + snapshot.dexterity;
        dataPoint[benefit.name] = totalStats;
      }
      
      return dataPoint;
    }) : [];
  
  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gym Company Comparison
      </Typography>
      
      <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
        Compare gym stat gains over time with different company benefits
      </Typography>
      
      <Grid container spacing={3}>
        {/* Input Form */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Training Parameters
            </Typography>
            
            {/* Mode Selector */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Calculation Mode
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant={mode === 'future' ? 'contained' : 'outlined'}
                onClick={() => setMode('future')}
                fullWidth
              >
                Future Comparison
              </Button>
              <Button
                variant={mode === 'manual' ? 'contained' : 'outlined'}
                onClick={() => setMode('manual')}
                fullWidth
              >
                Manual Testing
              </Button>
            </Box>
            
            {/* API Key Section - Moved to top */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Torn API Key
            </Typography>
            <TextField
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              fullWidth
              margin="dense"
              size="small"
              helperText="Optional: For fetching your current stats"
            />
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 1, mb: 2 }}
              onClick={handleFetchStats}
              disabled={isLoadingGymStats || !apiKey.trim()}
            >
              {isLoadingGymStats ? <CircularProgress size={20} /> : 'Fetch My Stats from Torn'}
            </Button>
            
            {/* Stat Weights */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Stat Training Weights
            </Typography>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Energy distribution across stats (e.g., 2:0:1:1 means 50% strength, 25% defense, 25% dex)
            </Typography>
            <TextField
              label="Strength Weight"
              type="number"
              value={statWeights.strength}
              onChange={(e) => setStatWeights({ ...statWeights, strength: Math.max(0, Number(e.target.value)) })}
              fullWidth
              margin="dense"
              size="small"
            />
            <TextField
              label="Speed Weight"
              type="number"
              value={statWeights.speed}
              onChange={(e) => setStatWeights({ ...statWeights, speed: Math.max(0, Number(e.target.value)) })}
              fullWidth
              margin="dense"
              size="small"
            />
            <TextField
              label="Defense Weight"
              type="number"
              value={statWeights.defense}
              onChange={(e) => setStatWeights({ ...statWeights, defense: Math.max(0, Number(e.target.value)) })}
              fullWidth
              margin="dense"
              size="small"
            />
            <TextField
              label="Dexterity Weight"
              type="number"
              value={statWeights.dexterity}
              onChange={(e) => setStatWeights({ ...statWeights, dexterity: Math.max(0, Number(e.target.value)) })}
              fullWidth
              margin="dense"
              size="small"
            />
            
            {/* Energy Sources - Only for Future Comparison Mode */}
            {mode === 'future' && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Energy Sources
                </Typography>
                <TextField
                  label="Hours Played Per Day"
                  type="number"
                  value={hoursPlayedPerDay}
                  onChange={(e) => setHoursPlayedPerDay(Math.max(0, Math.min(24, Number(e.target.value))))}
                  fullWidth
                  margin="dense"
                  size="small"
                  helperText="0-24 hours"
                />
                <TextField
                  label="Xanax Per Day"
                  type="number"
                  value={xanaxPerDay}
                  onChange={(e) => setXanaxPerDay(Math.max(0, Number(e.target.value)))}
                  fullWidth
                  margin="dense"
                  size="small"
                  helperText="Each xanax = +250 energy"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={hasPointsRefill}
                      onChange={(e) => setHasPointsRefill(e.target.checked)}
                    />
                  }
                  label="Points Refill (+150 energy)"
                />
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  Daily Energy: {dailyEnergy.toLocaleString()} E
                </Alert>
              </>
            )}
            
            {/* Manual Testing Energy - Only for Manual Mode */}
            {mode === 'manual' && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Energy Amount
                </Typography>
                <TextField
                  label="Total Energy"
                  type="number"
                  value={manualEnergy}
                  onChange={(e) => setManualEnergy(Math.max(0, Number(e.target.value)))}
                  fullWidth
                  margin="dense"
                  size="small"
                  helperText="Total energy to spend on training"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoUpgradeGyms}
                      onChange={(e) => setAutoUpgradeGyms(e.target.checked)}
                    />
                  }
                  label="Auto-upgrade gyms"
                  sx={{ mt: 1 }}
                />
              </>
            )}
            
            {/* Player Stats */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Player Stats
            </Typography>
            <TextField
              label="Initial Strength"
              type="number"
              value={initialStats.strength}
              onChange={(e) => setInitialStats({ ...initialStats, strength: Math.max(0, Number(e.target.value)) })}
              fullWidth
              margin="dense"
              size="small"
            />
            <TextField
              label="Initial Speed"
              type="number"
              value={initialStats.speed}
              onChange={(e) => setInitialStats({ ...initialStats, speed: Math.max(0, Number(e.target.value)) })}
              fullWidth
              margin="dense"
              size="small"
            />
            <TextField
              label="Initial Defense"
              type="number"
              value={initialStats.defense}
              onChange={(e) => setInitialStats({ ...initialStats, defense: Math.max(0, Number(e.target.value)) })}
              fullWidth
              margin="dense"
              size="small"
            />
            <TextField
              label="Initial Dexterity"
              type="number"
              value={initialStats.dexterity}
              onChange={(e) => setInitialStats({ ...initialStats, dexterity: Math.max(0, Number(e.target.value)) })}
              fullWidth
              margin="dense"
              size="small"
            />
            <TextField
              label="Happy"
              type="number"
              value={happy}
              onChange={(e) => setHappy(Math.max(0, Math.min(100000, Number(e.target.value))))}
              fullWidth
              margin="dense"
              size="small"
            />
            <TextField
              label="Perk % Bonus"
              type="number"
              value={perkPerc}
              onChange={(e) => setPerkPerc(Math.max(0, Number(e.target.value)))}
              fullWidth
              margin="dense"
              size="small"
              helperText="e.g., 2 for 2%"
            />
            <TextField
              label="Current Gym Unlocked"
              select
              value={currentGymIndex}
              onChange={(e) => setCurrentGymIndex(Number(e.target.value))}
              fullWidth
              margin="dense"
              size="small"
              helperText="Auto-filled if API key is provided"
              SelectProps={{
                native: true,
              }}
            >
              {GYMS.map((gym, index) => (
                <option key={gym.name} value={index}>
                  {gym.displayName}
                </option>
              ))}
            </TextField>
            
            {/* Company Benefits - Only for Future Mode */}
            {mode === 'future' && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Company Benefits to Compare
                </Typography>
                <FormGroup>
                  {Object.entries(getCompanyBenefits(candleShopStars)).map(([key, benefit]) => (
                    <Box key={key}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedBenefits.includes(key)}
                            onChange={() => handleBenefitToggle(key)}
                          />
                        }
                        label={benefit.name}
                      />
                      {/* Show time to George's for each benefit */}
                      {selectedBenefits.includes(key) && (
                        <Alert severity="success" sx={{ mt: 0.5, mb: 1, ml: 4 }} variant="outlined">
                          Time to George's: {calculateTimeToGeorges(benefit)}
                        </Alert>
                      )}
                </Box>
              ))}
            </FormGroup>
            
            {/* Candle Shop Star Rating */}
            {selectedBenefits.includes('candleShop') && (
              <TextField
                label="Candle Shop Stars"
                type="number"
                value={candleShopStars}
                onChange={(e) => setCandleShopStars(Math.max(1, Math.min(10, Number(e.target.value))))}
                fullWidth
                margin="normal"
                size="small"
                helperText="1-10 stars, each star adds 5 energy/day"
                InputProps={{
                  inputProps: { min: 1, max: 10 }
                }}
              />
            )}
            </>
            )}
            
            {/* Happy Jump Section - For Future Mode */}
            {mode === 'future' && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Happy Jump
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={happyJumpEnabled}
                      onChange={(e) => setHappyJumpEnabled(e.target.checked)}
                    />
                  }
                  label="Enable Happy Jumps"
                />
                {happyJumpEnabled && (
                  <>
                    <TextField
                      label="Jump Frequency (days)"
                      type="number"
                      value={happyJumpFrequency}
                      onChange={(e) => setHappyJumpFrequency(Math.max(1, Number(e.target.value)))}
                      fullWidth
                      margin="dense"
                      size="small"
                      helperText="Days between happy jumps (e.g., 7 for weekly)"
                    />
                    <TextField
                      label="DVDs Used Per Jump"
                      type="number"
                      value={happyJumpDvds}
                      onChange={(e) => setHappyJumpDvds(Math.max(0, Number(e.target.value)))}
                      fullWidth
                      margin="dense"
                      size="small"
                      helperText="Number of Erotic DVDs consumed"
                    />
                  </>
                )}
              </>
            )}
            
            {/* Simulation Duration - Only for Future Mode */}
            {mode === 'future' && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Simulation Duration
                </Typography>
                <TextField
                  label="Months"
                  type="number"
                  value={months}
                  onChange={(e) => setMonths(Math.max(1, Math.min(36, Number(e.target.value))))}
                  fullWidth
                  margin="dense"
                  size="small"
                  helperText="1-36 months"
                />
              </>
            )}
            
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
              onClick={handleSimulate}
              disabled={isSimulating || (mode === 'future' && selectedBenefits.length === 0)}
            >
              {isSimulating ? <CircularProgress size={24} /> : mode === 'future' ? 'Simulate' : 'Calculate'}
            </Button>
          </Paper>
        </Grid>
        
        {/* Results */}
        <Grid size={{ xs: 12, md: 8 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Manual Mode Results - Just Stats */}
          {mode === 'manual' && Object.keys(results).length > 0 && results.manual && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Training Results
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Strength</Typography>
                      <Typography variant="h5">{Math.round(results.manual.finalStats.strength).toLocaleString()}</Typography>
                      <Typography variant="caption" color="success.main">
                        +{Math.round(results.manual.finalStats.strength - (initialStats.strength ?? 0)).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Speed</Typography>
                      <Typography variant="h5">{Math.round(results.manual.finalStats.speed).toLocaleString()}</Typography>
                      <Typography variant="caption" color="success.main">
                        +{Math.round(results.manual.finalStats.speed - (initialStats.speed ?? 0)).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Defense</Typography>
                      <Typography variant="h5">{Math.round(results.manual.finalStats.defense).toLocaleString()}</Typography>
                      <Typography variant="caption" color="success.main">
                        +{Math.round(results.manual.finalStats.defense - (initialStats.defense ?? 0)).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Dexterity</Typography>
                      <Typography variant="h5">{Math.round(results.manual.finalStats.dexterity).toLocaleString()}</Typography>
                      <Typography variant="caption" color="success.main">
                        +{Math.round(results.manual.finalStats.dexterity - (initialStats.dexterity ?? 0)).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6">
                  Total Battle Stats: {Math.round(
                    results.manual.finalStats.strength + 
                    results.manual.finalStats.speed + 
                    results.manual.finalStats.defense + 
                    results.manual.finalStats.dexterity
                  ).toLocaleString()}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Gain: +{Math.round(
                    (results.manual.finalStats.strength - (initialStats.strength ?? 0)) +
                    (results.manual.finalStats.speed - (initialStats.speed ?? 0)) +
                    (results.manual.finalStats.defense - (initialStats.defense ?? 0)) +
                    (results.manual.finalStats.dexterity - (initialStats.dexterity ?? 0))
                  ).toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          )}
          
          {/* Future Mode Results - Graph and Comparison */}
          {mode === 'future' && Object.keys(results).length > 0 && (
            <>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Total Battle Stats Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="day" 
                      label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Total Battle Stats', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {Object.keys(results).map((benefitKey, index) => {
                      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
                      return (
                        <Line
                          key={benefitKey}
                          type="monotone"
                          dataKey={COMPANY_BENEFITS[benefitKey].name}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
              
              {/* Comparison Table */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Final Stats Comparison
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #555' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Stat</th>
                        {Object.entries(results).map(([benefitKey]) => {
                          const benefit = COMPANY_BENEFITS[benefitKey];
                          return (
                            <th key={benefitKey} style={{ padding: '12px', textAlign: 'right' }}>
                              {benefit.name}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>Strength</td>
                        {Object.entries(results).map(([benefitKey, result]) => (
                          <td key={benefitKey} style={{ padding: '12px', textAlign: 'right' }}>
                            {result.finalStats.strength.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>Speed</td>
                        {Object.entries(results).map(([benefitKey, result]) => (
                          <td key={benefitKey} style={{ padding: '12px', textAlign: 'right' }}>
                            {result.finalStats.speed.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>Defense</td>
                        {Object.entries(results).map(([benefitKey, result]) => (
                          <td key={benefitKey} style={{ padding: '12px', textAlign: 'right' }}>
                            {result.finalStats.defense.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>Dexterity</td>
                        {Object.entries(results).map(([benefitKey, result]) => (
                          <td key={benefitKey} style={{ padding: '12px', textAlign: 'right' }}>
                            {result.finalStats.dexterity.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '2px solid #555', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>Total Stats</td>
                        {Object.entries(results).map(([benefitKey, result]) => {
                          const total = result.finalStats.strength + result.finalStats.speed + 
                                      result.finalStats.defense + result.finalStats.dexterity;
                          return (
                            <td key={benefitKey} style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                              {total.toLocaleString()}
                            </td>
                          );
                        })}
                      </tr>
                      <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>Total Gain</td>
                        {Object.entries(results).map(([benefitKey, result]) => {
                          const totalGain = 
                            (result.finalStats.strength - initialStats.strength) +
                            (result.finalStats.speed - initialStats.speed) +
                            (result.finalStats.defense - initialStats.defense) +
                            (result.finalStats.dexterity - initialStats.dexterity);
                          return (
                            <td key={benefitKey} style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#4caf50' }}>
                              +{totalGain.toLocaleString()}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </Box>
              </Paper>
              
              <Grid container spacing={2}>
                {Object.entries(results).map(([benefitKey, result]) => {
                  const benefit = COMPANY_BENEFITS[benefitKey];
                  const totalGain = 
                    (result.finalStats.strength - initialStats.strength) +
                    (result.finalStats.speed - initialStats.speed) +
                    (result.finalStats.defense - initialStats.defense) +
                    (result.finalStats.dexterity - initialStats.dexterity);
                  
                  return (
                    <Grid size={{ xs: 12, sm: 6 }} key={benefitKey}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {benefit.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Final Stats
                          </Typography>
                          <Typography variant="body1">
                            Strength: {result.finalStats.strength.toLocaleString()}
                          </Typography>
                          <Typography variant="body1">
                            Speed: {result.finalStats.speed.toLocaleString()}
                          </Typography>
                          <Typography variant="body1">
                            Defense: {result.finalStats.defense.toLocaleString()}
                          </Typography>
                          <Typography variant="body1">
                            Dexterity: {result.finalStats.dexterity.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Total Gain: {totalGain.toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </>
          )}
          
          {Object.keys(results).length === 0 && !error && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Configure your training parameters and select company benefits to compare, then click Simulate
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
