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
  Tabs,
  Tab,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
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

// Hardcoded gym data
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

// Comparison state interface
interface ComparisonState {
  id: string;
  name: string;
  statWeights: { strength: number; speed: number; defense: number; dexterity: number };
  hoursPlayedPerDay: number;
  xanaxPerDay: number;
  hasPointsRefill: boolean;
  perkPercs: { strength: number; speed: number; defense: number; dexterity: number };
  happyJumpEnabled: boolean;
  happyJumpFrequency: number;
  happyJumpDvds: number;
  companyBenefitKey: string;
  candleShopStars: number;
  happy: number;
}

// Get company benefit - keeps Music Store and Fitness Center unchanged
const getCompanyBenefit = (benefitKey: string, candleShopStars: number): CompanyBenefit => {
  switch (benefitKey) {
    case 'none':
      return {
        name: 'No Benefits',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
    case 'musicStore':
      return {
        name: '3★ Music Store',
        gymUnlockSpeedMultiplier: 1.3, // 30% faster (unchanged)
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
    case 'candleShop':
      return {
        name: `${candleShopStars}★ Candle Shop`,
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: candleShopStars * 5, // 5 energy per star
        gymGainMultiplier: 1.0,
      };
    case 'fitnessCenter':
      return {
        name: '10★ Fitness Center',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.03, // 3% gym gains (unchanged)
      };
    default:
      return {
        name: 'No Benefits',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
  }
};

export default function GymComparison() {
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymComparison_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Mode
  const [mode, setMode] = useState<'future' | 'manual'>(() => loadSavedValue('mode', 'future'));
  
  // Manual testing state
  const [manualEnergy, setManualEnergy] = useState<number>(() => loadSavedValue('manualEnergy', 1000));
  const [autoUpgradeGyms, setAutoUpgradeGyms] = useState<boolean>(() => loadSavedValue('autoUpgradeGyms', true));
  
  // Shared player stats
  const [apiKey, setApiKey] = useState<string>(() => loadSavedValue('apiKey', ''));
  const [initialStats, setInitialStats] = useState(() => 
    loadSavedValue('initialStats', { strength: 1000, speed: 1000, defense: 1000, dexterity: 1000 })
  );
  const [currentGymIndex, setCurrentGymIndex] = useState<number>(() => loadSavedValue('currentGymIndex', 0));
  const [months, setMonths] = useState<number>(() => loadSavedValue('months', 6));
  
  // Comparison states
  const [comparisonStates, setComparisonStates] = useState<ComparisonState[]>(() => 
    loadSavedValue('comparisonStates', [
      {
        id: '1',
        name: 'State 1',
        statWeights: { strength: 1, speed: 1, defense: 1, dexterity: 1 },
        hoursPlayedPerDay: 8,
        xanaxPerDay: 0,
        hasPointsRefill: false,
        perkPercs: { strength: 0, speed: 0, defense: 0, dexterity: 0 },
        happyJumpEnabled: false,
        happyJumpFrequency: 7,
        happyJumpDvds: 1,
        companyBenefitKey: 'none',
        candleShopStars: 10,
        happy: 5000,
      },
    ])
  );
  
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: gymStatsData, isLoading: isLoadingGymStats, error: gymStatsError, refetch: refetchGymStats } = useGymStats(apiKey || null);
  
  // Auto-populate stats when fetched
  useEffect(() => {
    if (gymStatsData) {
      setInitialStats({
        strength: gymStatsData.battlestats.strength,
        speed: gymStatsData.battlestats.speed,
        defense: gymStatsData.battlestats.defense,
        dexterity: gymStatsData.battlestats.dexterity,
      });
      setCurrentGymIndex(Math.max(0, gymStatsData.activeGym - 1));
      
      setComparisonStates((prev) => prev.map((state) => ({
        ...state,
        perkPercs: gymStatsData.perkPercs,
      })));
    }
  }, [gymStatsData]);
  
  useEffect(() => {
    if (gymStatsError) {
      setError(gymStatsError instanceof Error ? gymStatsError.message : 'Failed to fetch gym stats');
    }
  }, [gymStatsError]);
  
  // Save to localStorage
  useEffect(() => { localStorage.setItem('gymComparison_mode', JSON.stringify(mode)); setResults({}); }, [mode]);
  useEffect(() => { localStorage.setItem('gymComparison_manualEnergy', JSON.stringify(manualEnergy)); }, [manualEnergy]);
  useEffect(() => { localStorage.setItem('gymComparison_autoUpgradeGyms', JSON.stringify(autoUpgradeGyms)); }, [autoUpgradeGyms]);
  useEffect(() => { localStorage.setItem('gymComparison_apiKey', JSON.stringify(apiKey)); }, [apiKey]);
  useEffect(() => { localStorage.setItem('gymComparison_initialStats', JSON.stringify(initialStats)); }, [initialStats]);
  useEffect(() => { localStorage.setItem('gymComparison_currentGymIndex', JSON.stringify(currentGymIndex)); }, [currentGymIndex]);
  useEffect(() => { localStorage.setItem('gymComparison_months', JSON.stringify(months)); }, [months]);
  useEffect(() => { localStorage.setItem('gymComparison_comparisonStates', JSON.stringify(comparisonStates)); }, [comparisonStates]);
  
  // Auto-simulate when data changes
  useEffect(() => {
    if (mode === 'future' && comparisonStates.length > 0) {
      handleSimulate();
    }
  }, [comparisonStates, initialStats, currentGymIndex, months]);
  
  useEffect(() => {
    if (mode === 'manual') {
      handleSimulate();
    }
  }, [manualEnergy, autoUpgradeGyms, initialStats, currentGymIndex]);
  
  const handleFetchStats = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }
    setError(null);
    refetchGymStats();
  };
  
  const handleAddState = () => {
    if (comparisonStates.length >= 4) {
      setError('Maximum 4 comparison states allowed');
      return;
    }
    
    // Copy values from the current/last state
    const sourceState = comparisonStates[activeTabIndex] || comparisonStates[comparisonStates.length - 1];
    
    const newState: ComparisonState = {
      id: Date.now().toString(),
      name: `State ${comparisonStates.length + 1}`,
      statWeights: { ...sourceState.statWeights },
      hoursPlayedPerDay: sourceState.hoursPlayedPerDay,
      xanaxPerDay: sourceState.xanaxPerDay,
      hasPointsRefill: sourceState.hasPointsRefill,
      perkPercs: { ...sourceState.perkPercs },
      happyJumpEnabled: sourceState.happyJumpEnabled,
      happyJumpFrequency: sourceState.happyJumpFrequency,
      happyJumpDvds: sourceState.happyJumpDvds,
      companyBenefitKey: sourceState.companyBenefitKey,
      candleShopStars: sourceState.candleShopStars,
      happy: sourceState.happy,
    };
    
    setComparisonStates([...comparisonStates, newState]);
    setActiveTabIndex(comparisonStates.length);
  };
  
  const handleRemoveState = (stateId: string) => {
    if (comparisonStates.length <= 1) {
      setError('At least one comparison state is required');
      return;
    }
    
    setComparisonStates((prev) => prev.filter((s) => s.id !== stateId));
    if (activeTabIndex >= comparisonStates.length - 1) {
      setActiveTabIndex(Math.max(0, comparisonStates.length - 2));
    }
  };
  
  const updateState = (stateId: string, updates: Partial<ComparisonState>) => {
    setComparisonStates((prev) => prev.map((state) => 
      state.id === stateId ? { ...state, ...updates } : state
    ));
  };
  
  const handleSimulate = () => {
    setIsSimulating(true);
    setError(null);
    
    try {
      if (mode === 'manual') {
        const inputs: SimulationInputs = {
          statWeights: { strength: 1, speed: 1, defense: 1, dexterity: 1 },
          months: 0,
          xanaxPerDay: 0,
          hasPointsRefill: false,
          hoursPlayedPerDay: 0,
          companyBenefit: getCompanyBenefit('none', 0),
          apiKey,
          initialStats,
          happy: comparisonStates[0]?.happy || 5000,
          perkPercs: { strength: 0, speed: 0, defense: 0, dexterity: 0 },
          currentGymIndex: autoUpgradeGyms ? -1 : currentGymIndex,
          manualEnergy,
        };
        
        const result = simulateGymProgression(GYMS, inputs);
        setResults({ manual: result });
      } else {
        const newResults: Record<string, SimulationResult> = {};
        
        for (const state of comparisonStates) {
          const benefit = getCompanyBenefit(state.companyBenefitKey, state.candleShopStars);
          
          const inputs: SimulationInputs = {
            statWeights: state.statWeights,
            months,
            xanaxPerDay: state.xanaxPerDay,
            hasPointsRefill: state.hasPointsRefill,
            hoursPlayedPerDay: state.hoursPlayedPerDay,
            companyBenefit: benefit,
            apiKey,
            initialStats,
            happy: state.happy,
            perkPercs: state.perkPercs,
            currentGymIndex,
            happyJump: state.happyJumpEnabled ? {
              enabled: true,
              frequencyDays: state.happyJumpFrequency,
              dvdsUsed: state.happyJumpDvds,
            } : undefined,
          };
          
          const result = simulateGymProgression(GYMS, inputs);
          newResults[state.id] = result;
        }
        
        setResults(newResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsSimulating(false);
    }
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
  
  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { day: number }; name: string; value: number; color: string }> }) => {
    if (active && payload && payload.length) {
      const day = payload[0].payload.day;
      const timeStr = formatDaysToHumanReadable(day);
      
      return (
        <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.9)', border: '1px solid #555' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Time: {timeStr}
          </Typography>
          {payload.map((entry, index: number) => {
            // Find the state that matches this entry
            const state = comparisonStates.find(s => s.name === entry.name);
            const snapshot = state && results[state.id] ? 
              results[state.id].dailySnapshots.find(s => s.day === day) : null;
            
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
  
  const chartData = mode === 'future' && Object.keys(results).length > 0 ? 
    results[Object.keys(results)[0]].dailySnapshots.map((_,index) => {
      const dataPoint: Record<string, number> = { 
        day: results[Object.keys(results)[0]].dailySnapshots[index].day 
      };
      
      for (const state of comparisonStates) {
        if (results[state.id]) {
          const snapshot = results[state.id].dailySnapshots[index];
          const totalStats = snapshot.strength + snapshot.speed + snapshot.defense + snapshot.dexterity;
          dataPoint[state.name] = totalStats;
        }
      }
      
      return dataPoint;
    }) : [];
  
  const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
  const activeState = comparisonStates[activeTabIndex];
  
  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gym Comparison Tool
      </Typography>
      
      <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
        Compare gym stat gains with different configurations
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button variant={mode === 'future' ? 'contained' : 'outlined'} onClick={() => setMode('future')}>
          Future Comparison
        </Button>
        <Button variant={mode === 'manual' ? 'contained' : 'outlined'} onClick={() => setMode('manual')}>
          Manual Testing
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Player Stats</Typography>
            
            <TextField
              label="Torn API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              fullWidth
              margin="dense"
              size="small"
              helperText="Optional: Fetch your current stats"
            />
            <Button variant="outlined" fullWidth sx={{ mt: 1, mb: 2 }} onClick={handleFetchStats} disabled={isLoadingGymStats || !apiKey.trim()}>
              {isLoadingGymStats ? <CircularProgress size={20} /> : 'Fetch My Stats'}
            </Button>
            
            <TextField label="Initial Strength" type="number" value={initialStats.strength || ''} onChange={(e) => setInitialStats({ ...initialStats, strength: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
            <TextField label="Initial Speed" type="number" value={initialStats.speed || ''} onChange={(e) => setInitialStats({ ...initialStats, speed: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
            <TextField label="Initial Defense" type="number" value={initialStats.defense || ''} onChange={(e) => setInitialStats({ ...initialStats, defense: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
            <TextField label="Initial Dexterity" type="number" value={initialStats.dexterity || ''} onChange={(e) => setInitialStats({ ...initialStats, dexterity: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
            
            {mode === 'future' && (
              <>
                <TextField label="Current Gym Unlocked" select value={currentGymIndex} onChange={(e) => setCurrentGymIndex(Number(e.target.value))} fullWidth margin="dense" size="small" SelectProps={{ native: true }}>
                  {GYMS.map((gym, index) => (<option key={gym.name} value={index}>{gym.displayName}</option>))}
                </TextField>
                
                <TextField label="Simulation Duration (months)" type="number" value={months || ''} onChange={(e) => setMonths(e.target.value === '' ? 1 : Math.max(1, Math.min(36, Number(e.target.value))))} fullWidth margin="dense" size="small" helperText="1-36 months" inputProps={{ step: 'any' }} />
              </>
            )}
            
            {mode === 'manual' && (
              <>
                <TextField label="Total Energy" type="number" value={manualEnergy || ''} onChange={(e) => setManualEnergy(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))} fullWidth margin="dense" size="small" helperText="Energy to spend on training" inputProps={{ step: 'any' }} />
                <FormControlLabel control={<Switch checked={autoUpgradeGyms} onChange={(e) => setAutoUpgradeGyms(e.target.checked)} />} label="Auto-upgrade gyms" sx={{ mt: 1 }} />
              </>
            )}
            
            {mode === 'future' && (
              <>
                <Box sx={{ mt: 3, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Comparison States</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={handleAddState} disabled={comparisonStates.length >= 4}>Add State</Button>
                </Box>
                
                <Tabs value={activeTabIndex} onChange={(_, newValue) => setActiveTabIndex(newValue)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  {comparisonStates.map((state) => (<Tab key={state.id} label={state.name} />))}
                </Tabs>
                
                {activeState && (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField label="State Name" value={activeState.name} onChange={(e) => updateState(activeState.id, { name: e.target.value })} fullWidth size="small" />
                      {comparisonStates.length > 1 && (<IconButton color="error" onClick={() => handleRemoveState(activeState.id)} size="small"><DeleteIcon /></IconButton>)}
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Stat Training Weights</Typography>
                    <TextField label="Strength Weight" type="number" value={activeState.statWeights.strength || ''} onChange={(e) => updateState(activeState.id, { statWeights: { ...activeState.statWeights, strength: e.target.value === '' ? 0 : Number(e.target.value) }})} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
                    <TextField label="Speed Weight" type="number" value={activeState.statWeights.speed || ''} onChange={(e) => updateState(activeState.id, { statWeights: { ...activeState.statWeights, speed: e.target.value === '' ? 0 : Number(e.target.value) }})} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
                    <TextField label="Defense Weight" type="number" value={activeState.statWeights.defense || ''} onChange={(e) => updateState(activeState.id, { statWeights: { ...activeState.statWeights, defense: e.target.value === '' ? 0 : Number(e.target.value) }})} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
                    <TextField label="Dexterity Weight" type="number" value={activeState.statWeights.dexterity || ''} onChange={(e) => updateState(activeState.id, { statWeights: { ...activeState.statWeights, dexterity: e.target.value === '' ? 0 : Number(e.target.value) }})} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Energy Sources</Typography>
                    <TextField label="Hours Played Per Day" type="number" value={activeState.hoursPlayedPerDay || ''} onChange={(e) => updateState(activeState.id, { hoursPlayedPerDay: e.target.value === '' ? 0 : Math.max(0, Math.min(24, Number(e.target.value)))})} fullWidth margin="dense" size="small" helperText="0-24 hours" inputProps={{ step: 'any' }} />
                    <TextField label="Xanax Per Day" type="number" value={activeState.xanaxPerDay || ''} onChange={(e) => updateState(activeState.id, { xanaxPerDay: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value))})} fullWidth margin="dense" size="small" helperText="Each xanax = +250 energy" inputProps={{ step: 'any' }} />
                    <FormControlLabel control={<Switch checked={activeState.hasPointsRefill} onChange={(e) => updateState(activeState.id, { hasPointsRefill: e.target.checked })} />} label="Points Refill (+150 energy)" />
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Base Happy</Typography>
                    <TextField label="Happy" type="number" value={activeState.happy || ''} onChange={(e) => updateState(activeState.id, { happy: e.target.value === '' ? 0 : Math.max(0, Math.min(99999, Number(e.target.value)))})} fullWidth margin="dense" size="small" helperText="Maximum: 99,999" inputProps={{ step: 'any' }} />
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Perk % Bonus</Typography>
                    <TextField label="Strength Perk %" type="number" value={activeState.perkPercs.strength || ''} onChange={(e) => updateState(activeState.id, { perkPercs: { ...activeState.perkPercs, strength: e.target.value === '' ? 0 : Number(e.target.value)}})} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
                    <TextField label="Speed Perk %" type="number" value={activeState.perkPercs.speed || ''} onChange={(e) => updateState(activeState.id, { perkPercs: { ...activeState.perkPercs, speed: e.target.value === '' ? 0 : Number(e.target.value)}})} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
                    <TextField label="Defense Perk %" type="number" value={activeState.perkPercs.defense || ''} onChange={(e) => updateState(activeState.id, { perkPercs: { ...activeState.perkPercs, defense: e.target.value === '' ? 0 : Number(e.target.value)}})} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
                    <TextField label="Dexterity Perk %" type="number" value={activeState.perkPercs.dexterity || ''} onChange={(e) => updateState(activeState.id, { perkPercs: { ...activeState.perkPercs, dexterity: e.target.value === '' ? 0 : Number(e.target.value)}})} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Happy Jump</Typography>
                    <FormControlLabel control={<Switch checked={activeState.happyJumpEnabled} onChange={(e) => updateState(activeState.id, { happyJumpEnabled: e.target.checked })} />} label="Enable Happy Jumps" />
                    {activeState.happyJumpEnabled && (
                      <>
                        <TextField label="Jump Frequency (days)" type="number" value={activeState.happyJumpFrequency || ''} onChange={(e) => updateState(activeState.id, { happyJumpFrequency: e.target.value === '' ? 1 : Math.max(1, Number(e.target.value))})} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
                        <TextField label="DVDs Used Per Jump" type="number" value={activeState.happyJumpDvds || ''} onChange={(e) => updateState(activeState.id, { happyJumpDvds: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value))})} fullWidth margin="dense" size="small" inputProps={{ step: 'any' }} />
                      </>
                    )}
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Company Benefit</Typography>
                    <FormControl fullWidth margin="dense" size="small">
                      <InputLabel>Benefit Type</InputLabel>
                      <Select value={activeState.companyBenefitKey} label="Benefit Type" onChange={(e) => updateState(activeState.id, { companyBenefitKey: e.target.value })}>
                        <MenuItem value="none">No Benefits</MenuItem>
                        <MenuItem value="musicStore">3★ Music Store</MenuItem>
                        <MenuItem value="candleShop">Candle Shop</MenuItem>
                        <MenuItem value="fitnessCenter">10★ Fitness Center</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {activeState.companyBenefitKey === 'candleShop' && (
                      <TextField label="Candle Shop Stars" type="number" value={activeState.candleShopStars || ''} onChange={(e) => updateState(activeState.id, { candleShopStars: e.target.value === '' ? 1 : Math.max(1, Math.min(10, Number(e.target.value)))})} fullWidth margin="dense" size="small" helperText="1-10 stars, 5 energy per star" inputProps={{ step: 'any' }} />
                    )}
                    
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Daily Energy: {calculateDailyEnergy(activeState.hoursPlayedPerDay, activeState.xanaxPerDay, activeState.hasPointsRefill, getCompanyBenefit(activeState.companyBenefitKey, activeState.candleShopStars).bonusEnergyPerDay).toLocaleString()} E
                    </Alert>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 8 }}>
          {error && (<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>)}
          
          {mode === 'manual' && results.manual && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Training Results</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 3 }}><Card><CardContent><Typography variant="subtitle2" color="text.secondary">Strength</Typography><Typography variant="h5">{Math.round(results.manual.finalStats.strength).toLocaleString()}</Typography><Typography variant="caption" color="success.main">+{Math.round(results.manual.finalStats.strength - initialStats.strength).toLocaleString()}</Typography></CardContent></Card></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Card><CardContent><Typography variant="subtitle2" color="text.secondary">Speed</Typography><Typography variant="h5">{Math.round(results.manual.finalStats.speed).toLocaleString()}</Typography><Typography variant="caption" color="success.main">+{Math.round(results.manual.finalStats.speed - initialStats.speed).toLocaleString()}</Typography></CardContent></Card></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Card><CardContent><Typography variant="subtitle2" color="text.secondary">Defense</Typography><Typography variant="h5">{Math.round(results.manual.finalStats.defense).toLocaleString()}</Typography><Typography variant="caption" color="success.main">+{Math.round(results.manual.finalStats.defense - initialStats.defense).toLocaleString()}</Typography></CardContent></Card></Grid>
                <Grid size={{ xs: 6, md: 3 }}><Card><CardContent><Typography variant="subtitle2" color="text.secondary">Dexterity</Typography><Typography variant="h5">{Math.round(results.manual.finalStats.dexterity).toLocaleString()}</Typography><Typography variant="caption" color="success.main">+{Math.round(results.manual.finalStats.dexterity - initialStats.dexterity).toLocaleString()}</Typography></CardContent></Card></Grid>
              </Grid>
            </Paper>
          )}
          
          {mode === 'future' && Object.keys(results).length > 0 && (
            <>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Total Battle Stats Over Time</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Total Battle Stats', angle: -90, position: 'insideLeft' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {comparisonStates.map((state, index) => (
                      <Line key={state.id} type="monotone" dataKey={state.name} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
              
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Final Stats Comparison</Typography>
                <Grid container spacing={2}>
                  {comparisonStates.map((state, index) => {
                    const result = results[state.id];
                    if (!result) return null;
                    
                    const totalGain = (result.finalStats.strength - initialStats.strength) + (result.finalStats.speed - initialStats.speed) + (result.finalStats.defense - initialStats.defense) + (result.finalStats.dexterity - initialStats.dexterity);
                    
                    return (
                      <Grid size={{ xs: 12, sm: 6 }} key={state.id}>
                        <Card sx={{ borderLeft: 4, borderColor: CHART_COLORS[index % CHART_COLORS.length] }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>{state.name}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              {getCompanyBenefit(state.companyBenefitKey, state.candleShopStars).name}
                            </Typography>
                            <Typography variant="body2">Str: {result.finalStats.strength.toLocaleString()} | Spd: {result.finalStats.speed.toLocaleString()}</Typography>
                            <Typography variant="body2">Def: {result.finalStats.defense.toLocaleString()} | Dex: {result.finalStats.dexterity.toLocaleString()}</Typography>
                            <Typography variant="h6" color="success.main" sx={{ mt: 1 }}>Total Gain: +{totalGain.toLocaleString()}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            </>
          )}
          
          {Object.keys(results).length === 0 && !error && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {mode === 'future' ? 'Results will appear automatically as you configure your comparison states' : 'Results will appear automatically as you adjust the energy amount'}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
