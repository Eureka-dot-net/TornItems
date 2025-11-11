import { Box, Button, Paper, Tab, Tabs, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface ComparisonState {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface ComparisonSelectorProps {
  comparisonStates: ComparisonState[];
  activeTabIndex: number;
  setActiveTabIndex: (index: number) => void;
  handleAddState: () => void;
  maxStatesReached: boolean;
}

export default function ComparisonSelector({
  comparisonStates,
  activeTabIndex,
  setActiveTabIndex,
  handleAddState,
  maxStatesReached
}: ComparisonSelectorProps) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Select Comparison</Typography>
        <Button 
          size="small" 
          startIcon={<AddIcon />} 
          onClick={handleAddState} 
          disabled={maxStatesReached}
        >
          Add Comparison
        </Button>
      </Box>
      
      <Tabs 
        value={activeTabIndex} 
        onChange={(_, newValue) => setActiveTabIndex(newValue)} 
        variant="scrollable" 
        scrollButtons="auto"
      >
        {comparisonStates.map((state) => (
          <Tab key={state.id} label={state.name} />
        ))}
      </Tabs>
    </Paper>
  );
}
