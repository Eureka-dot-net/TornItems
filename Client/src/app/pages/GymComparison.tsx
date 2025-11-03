import { useState } from 'react';
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

// Company benefits
const COMPANY_BENEFITS: Record<string, CompanyBenefit> = {
  none: {
    name: 'No Benefits',
    gymUnlockSpeedMultiplier: 1.0,
    bonusEnergyPerDay: 0,
  },
  musicStore3Star: {
    name: '3★ Music Store',
    gymUnlockSpeedMultiplier: 1.3, // 30% faster
    bonusEnergyPerDay: 0,
  },
  candleShop10Star: {
    name: '10★ Candle Shop',
    gymUnlockSpeedMultiplier: 1.0,
    bonusEnergyPerDay: 50,
  },
};

export default function GymComparison() {
  // Form inputs
  const [statWeights, setStatWeights] = useState({ strength: 1, speed: 1, defense: 1, dexterity: 1 });
  const [months, setMonths] = useState<number>(6);
  const [xanaxPerDay, setXanaxPerDay] = useState<number>(0);
  const [hasPointsRefill, setHasPointsRefill] = useState<boolean>(false);
  const [hoursPlayedPerDay, setHoursPlayedPerDay] = useState<number>(8);
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>(['none']);
  const [apiKey, setApiKey] = useState<string>('');
  const [happy, setHappy] = useState<number>(5000);
  const [perkPerc, setPerkPerc] = useState<number>(0);
  const [initialStats, setInitialStats] = useState({ strength: 1000, speed: 1000, defense: 1000, dexterity: 1000 });
  
  // Results
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate and display daily energy
  const dailyEnergy = calculateDailyEnergy(hoursPlayedPerDay, xanaxPerDay, hasPointsRefill, 0);
  
  const handleSimulate = () => {
    setIsSimulating(true);
    setError(null);
    
    try {
      const newResults: Record<string, SimulationResult> = {};
      
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
        };
        
        const result = simulateGymProgression(GYMS, inputs);
        newResults[benefitKey] = result;
      }
      
      setResults(newResults);
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
  
  // Prepare chart data
  const chartData = Object.keys(results).length > 0 ? 
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
            
            {/* Time Period */}
            <TextField
              label="Number of Months"
              type="number"
              value={months}
              onChange={(e) => setMonths(Math.max(1, Math.min(36, Number(e.target.value))))}
              fullWidth
              margin="normal"
              size="small"
              helperText="Max 36 months (3 years)"
            />
            
            {/* Energy Sources */}
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
            
            {/* Company Benefits */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Company Benefits to Compare
            </Typography>
            <FormGroup>
              {Object.entries(COMPANY_BENEFITS).map(([key, benefit]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={selectedBenefits.includes(key)}
                      onChange={() => handleBenefitToggle(key)}
                    />
                  }
                  label={benefit.name}
                />
              ))}
            </FormGroup>
            
            {/* API Key (optional) */}
            <TextField
              label="API Key (Optional)"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              fullWidth
              margin="normal"
              size="small"
              helperText="For fetching current stats (not implemented yet)"
            />
            
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
              onClick={handleSimulate}
              disabled={isSimulating || selectedBenefits.length === 0}
            >
              {isSimulating ? <CircularProgress size={24} /> : 'Simulate'}
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
          
          {Object.keys(results).length > 0 && (
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
                    <Tooltip />
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
