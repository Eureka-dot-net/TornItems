import {
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import type { SimulationResult } from '../../../lib/utils/gymProgressionCalculator';

interface ManualTestingResultsProps {
  result: SimulationResult | undefined;
  initialStats: { strength: number; speed: number; defense: number; dexterity: number };
  onUseAsInitialStats: () => void;
}

export default function ManualTestingResults({
  result,
  initialStats,
  onUseAsInitialStats,
}: ManualTestingResultsProps) {
  if (!result) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Configure energy and options to see results
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Training Results</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Strength</Typography>
              <Typography variant="h6">{Math.round(result.finalStats.strength).toLocaleString()}</Typography>
              <Typography variant="caption" color="success.main">
                +{Math.round(result.finalStats.strength - initialStats.strength).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Speed</Typography>
              <Typography variant="h6">{Math.round(result.finalStats.speed).toLocaleString()}</Typography>
              <Typography variant="caption" color="success.main">
                +{Math.round(result.finalStats.speed - initialStats.speed).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Defense</Typography>
              <Typography variant="h6">{Math.round(result.finalStats.defense).toLocaleString()}</Typography>
              <Typography variant="caption" color="success.main">
                +{Math.round(result.finalStats.defense - initialStats.defense).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Dexterity</Typography>
              <Typography variant="h6">{Math.round(result.finalStats.dexterity).toLocaleString()}</Typography>
              <Typography variant="caption" color="success.main">
                +{Math.round(result.finalStats.dexterity - initialStats.dexterity).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Button 
        variant="outlined" 
        fullWidth 
        sx={{ mt: 2 }}
        onClick={onUseAsInitialStats}
      >
        Use as Initial Stats
      </Button>
    </Paper>
  );
}
