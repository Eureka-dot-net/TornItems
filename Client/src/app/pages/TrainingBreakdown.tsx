import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  TextField,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRowsProp } from '@mui/x-data-grid';
import { Link as RouterLink } from 'react-router-dom';
import { type IndividualComparisonExportData } from '../../lib/utils/exportHelpers';

export default function TrainingBreakdown() {
  const [trainingData, setTrainingData] = useState<IndividualComparisonExportData | null>(null);
  const [startDate, setStartDate] = useState<string>(() => {
    // Load from localStorage, default to today if not set
    const saved = localStorage.getItem('trainingBreakdown_startDate');
    return saved || new Date().toISOString().split('T')[0];
  });

  // Load training data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('trainingBreakdown_data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setTrainingData(data);
      } catch (error) {
        console.error('Failed to load training data:', error);
      }
    }
  }, []);

  // Save start date to localStorage
  useEffect(() => {
    localStorage.setItem('trainingBreakdown_startDate', startDate);
  }, [startDate]);

  // Calculate current day based on start date
  const currentDay = useMemo(() => {
    if (!startDate) return 1;
    const start = new Date(startDate);
    const today = new Date();
    // Reset time to midnight for accurate day calculation
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    // Day 1 is the start date, so add 1 to the difference
    return Math.max(1, diffDays + 1);
  }, [startDate]);

  // Prepare grid rows
  const rows: GridRowsProp = useMemo(() => {
    if (!trainingData) return [];

    // Add day 0 (initial stats)
    const initialTotal = 
      trainingData.initialStats.strength +
      trainingData.initialStats.speed +
      trainingData.initialStats.defense +
      trainingData.initialStats.dexterity;

    const initialRow = {
      id: 0,
      day: 0,
      strength: trainingData.initialStats.strength,
      speed: trainingData.initialStats.speed,
      defense: trainingData.initialStats.defense,
      dexterity: trainingData.initialStats.dexterity,
      total: initialTotal,
      strengthTraining: '',
      speedTraining: '',
      defenseTraining: '',
      dexterityTraining: '',
      notes: 'Starting stats',
    };

    const dailyRows: any[] = [];
    
    trainingData.dailySnapshots.forEach((snapshot) => {
      const total = snapshot.strength + snapshot.speed + snapshot.defense + snapshot.dexterity;

      // Format training details
      const formatTraining = (stat: 'strength' | 'speed' | 'defense' | 'dexterity') => {
        if (snapshot.trainingDetails && snapshot.trainingDetails[stat]) {
          const details = snapshot.trainingDetails[stat]!;
          return `${details.energy} energy at ${details.gym}`;
        }
        return '';
      };

      // Check if this day has training sessions (jump + post-jump)
      if (snapshot.trainingSessions && snapshot.trainingSessions.length > 0) {
        // Create separate rows for each training session
        snapshot.trainingSessions.forEach((session, sessionIndex) => {
          const sessionFormatTraining = (stat: 'strength' | 'speed' | 'defense' | 'dexterity') => {
            if (session.trainingDetails && session.trainingDetails[stat]) {
              const details = session.trainingDetails[stat]!;
              return `${details.energy} energy at ${details.gym}`;
            }
            return '';
          };

          // For the first session, use the actual stats; for subsequent sessions, use empty stats
          // This makes the display cleaner - only the first row shows final stats for the day
          dailyRows.push({
            id: `${snapshot.day}-${sessionIndex}`,
            day: sessionIndex === 0 ? snapshot.day : '', // Only show day number on first row
            strength: sessionIndex === 0 ? snapshot.strength : '',
            speed: sessionIndex === 0 ? snapshot.speed : '',
            defense: sessionIndex === 0 ? snapshot.defense : '',
            dexterity: sessionIndex === 0 ? snapshot.dexterity : '',
            total: sessionIndex === 0 ? total : '',
            strengthTraining: sessionFormatTraining('strength'),
            speedTraining: sessionFormatTraining('speed'),
            defenseTraining: sessionFormatTraining('defense'),
            dexterityTraining: sessionFormatTraining('dexterity'),
            notes: session.notes ? session.notes.join('; ') : '',
          });
        });
      } else {
        // Regular day with no separate sessions
        dailyRows.push({
          id: snapshot.day,
          day: snapshot.day,
          strength: snapshot.strength,
          speed: snapshot.speed,
          defense: snapshot.defense,
          dexterity: snapshot.dexterity,
          total,
          strengthTraining: formatTraining('strength'),
          speedTraining: formatTraining('speed'),
          defenseTraining: formatTraining('defense'),
          dexterityTraining: formatTraining('dexterity'),
          notes: snapshot.notes ? snapshot.notes.join('; ') : '',
        });
      }
    });

    return [initialRow, ...dailyRows];
  }, [trainingData]);

  // Define columns
  const columns: GridColDef[] = [
    {
      field: 'day',
      headerName: 'Day',
      width: 80,
      type: 'number',
    },
    {
      field: 'strength',
      headerName: 'Strength',
      width: 120,
      type: 'number',
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    {
      field: 'speed',
      headerName: 'Speed',
      width: 120,
      type: 'number',
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    {
      field: 'defense',
      headerName: 'Defense',
      width: 120,
      type: 'number',
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    {
      field: 'dexterity',
      headerName: 'Dexterity',
      width: 120,
      type: 'number',
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 140,
      type: 'number',
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    {
      field: 'strengthTraining',
      headerName: 'Strength Training',
      width: 200,
      type: 'string',
    },
    {
      field: 'speedTraining',
      headerName: 'Speed Training',
      width: 200,
      type: 'string',
    },
    {
      field: 'defenseTraining',
      headerName: 'Defense Training',
      width: 200,
      type: 'string',
    },
    {
      field: 'dexterityTraining',
      headerName: 'Dexterity Training',
      width: 200,
      type: 'string',
    },
    {
      field: 'notes',
      headerName: 'Notes',
      width: 300,
      type: 'string',
    },
  ];

  // If no training data, show message
  if (!trainingData) {
    return (
      <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
        <Typography variant="h4" gutterBottom>
          Training Breakdown (Beta)
        </Typography>

        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            This feature is in beta/testing.
          </Typography>
        </Alert>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            No training regime has been saved yet.
          </Typography>
          <Typography variant="body2">
            Please go to the{' '}
            <Button
              component={RouterLink}
              to="/gymComparison"
              variant="text"
              sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
            >
              Gym Comparison page
            </Button>{' '}
            to create and download a training regime. Once downloaded, it will be saved and displayed here.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom>
        Training Breakdown (Beta)
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          This feature is in beta/testing.
        </Typography>
      </Alert>

      <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
        Tracking training regime: <strong>{trainingData.name}</strong>
      </Typography>

      {/* Start Date Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ width: 200 }}
          />
          <Typography variant="body2" color="text.secondary">
            Current day in training: <strong>Day {currentDay}</strong>
          </Typography>
        </Box>
      </Paper>

      {/* Summary Stats */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Duration
            </Typography>
            <Typography variant="body1">
              {trainingData.months} months ({trainingData.dailySnapshots.length} days)
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Stat Gain
            </Typography>
            <Typography variant="body1">
              +{Math.round(
                trainingData.statGains.strength +
                trainingData.statGains.speed +
                trainingData.statGains.defense +
                trainingData.statGains.dexterity
              ).toLocaleString()}
            </Typography>
          </Box>
          {trainingData.costs && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Cost
              </Typography>
              <Typography variant="body1">
                ${trainingData.costs.total.toLocaleString()}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25, page: 0 },
            },
          }}
          getRowClassName={(params) => {
            // Highlight the current day
            if ('day' in params.row && params.row.day === currentDay) {
              return 'current-day-row';
            }
            return '';
          }}
          sx={{
            '& .current-day-row': {
              backgroundColor: 'rgba(25, 118, 210, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.25)',
              },
            },
          }}
        />
      </Paper>
    </Box>
  );
}
