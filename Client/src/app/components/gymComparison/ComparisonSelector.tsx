import {
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface ComparisonSelectorProps {
  comparisonStates: Array<{ id: string; name: string }>;
  activeTabIndex: number;
  onTabChange: (newIndex: number) => void;
  onAddComparison: () => void;
  maxComparisonStates: number;
}

export default function ComparisonSelector({
  comparisonStates,
  activeTabIndex,
  onTabChange,
  onAddComparison,
  maxComparisonStates,
}: ComparisonSelectorProps) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Select Comparison</Typography>
        <Button 
          size="small" 
          startIcon={<AddIcon />} 
          onClick={onAddComparison} 
          disabled={comparisonStates.length >= maxComparisonStates}
        >
          Add Comparison
        </Button>
      </Box>
      
      <Tabs 
        value={activeTabIndex} 
        onChange={(_, newValue) => onTabChange(newValue)} 
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
