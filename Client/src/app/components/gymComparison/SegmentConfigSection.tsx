import { 
  Paper, 
  Typography, 
  Box, 
  Switch, 
  FormControlLabel, 
  List, 
  ListItem, 
  ListItemButton,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { SegmentedSimulationConfig } from '../../../lib/types/gymComparison';

interface SegmentConfigSectionProps {
  stateId: string;
  stateName: string;
  segmentConfig?: SegmentedSimulationConfig;
  onToggleSegments: (stateId: string, enabled: boolean) => void;
  onSegmentSelect: (stateId: string, segmentId: string | null) => void;
  onSegmentDelete: (stateId: string, segmentId: string) => void;
}

export default function SegmentConfigSection({
  stateId,
  stateName,
  segmentConfig,
  onToggleSegments,
  onSegmentSelect,
  onSegmentDelete,
}: SegmentConfigSectionProps) {
  const isEnabled = segmentConfig?.enabled ?? false;
  const segments = segmentConfig?.segments ?? [];
  const activeSegmentId = segmentConfig?.activeSegmentId;
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Time Segments</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={isEnabled}
              onChange={(e) => onToggleSegments(stateId, e.target.checked)}
            />
          }
          label={isEnabled ? 'Enabled' : 'Disabled'}
        />
      </Box>
      
      {isEnabled && (
        <>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Click dots on the chart to create segments. Each segment can have different gym configurations.
          </Typography>
          
          {segments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
              No segments yet. Click on the chart to create one.
            </Typography>
          ) : (
            <>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Segments for {stateName}:
              </Typography>
              <List dense>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={activeSegmentId === null}
                    onClick={() => onSegmentSelect(stateId, null)}
                  >
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>Base Configuration (Day 0)</span>
                          {activeSegmentId === null && <Chip label="Editing" size="small" color="primary" />}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {segments.map((segment) => (
                  <ListItem
                    key={segment.id}
                    disablePadding
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSegmentDelete(stateId, segment.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      selected={activeSegmentId === segment.id}
                      onClick={() => onSegmentSelect(stateId, segment.id)}
                    >
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{segment.name || `Day ${segment.startDay}`}</span>
                            {activeSegmentId === segment.id && <Chip label="Editing" size="small" color="primary" />}
                          </Box>
                        }
                        secondary={`Starts on day ${segment.startDay}`}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </>
      )}
    </Paper>
  );
}
