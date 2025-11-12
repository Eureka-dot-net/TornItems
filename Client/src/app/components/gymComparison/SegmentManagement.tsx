import { Box, Typography, Paper, IconButton, Chip, Alert, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { type ComparisonSegment } from '../../../lib/types/gymComparison';

interface SegmentManagementProps {
  stateId: string;
  stateName: string;
  segments: ComparisonSegment[];
  activeSegmentId: string | null;
  onRemoveSegment: (stateId: string, segmentId: string) => void;
  onEditSegment: (segmentId: string) => void;
  onClearSelection: () => void;
}

export default function SegmentManagement({
  stateId,
  stateName,
  segments,
  activeSegmentId,
  onRemoveSegment,
  onEditSegment,
  onClearSelection,
}: SegmentManagementProps) {
  if (segments.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" gutterBottom>
          Time Segments
        </Typography>
      <Alert severity="info" sx={{ mb: 0 }}>
          Click on marked points on the chart line to add a time segment with different settings starting from that day.
          Segments bypass the 4-comparison limit.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">
          Time Segments for {stateName}
        </Typography>
        {activeSegmentId && (
          <Button 
            size="small" 
            onClick={onClearSelection}
            startIcon={<CheckCircleIcon />}
          >
            Edit Base Config
          </Button>
        )}
      </Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        {activeSegmentId 
          ? 'Editing segment configuration. Changes affect this time period only (keeping original config intact). Click "Edit Base Config" to edit the base period.'
          : 'Click any segment below to edit its configuration independently. The chart shows a continuous line with all segments applied over time.'}
      </Alert>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {segments.map((segment) => {
          const isActive = segment.id === activeSegmentId;
          return (
            <Box
              key={segment.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                border: '2px solid',
                borderColor: isActive ? 'primary.main' : 'divider',
                borderRadius: 1,
                bgcolor: isActive ? 'action.selected' : 'background.paper',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: isActive ? 'action.selected' : 'action.hover',
                },
              }}
              onClick={() => !isActive && onEditSegment(segment.id)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`Day ${segment.startDay}`}
                  size="small"
                  color={isActive ? 'primary' : 'default'}
                  variant="outlined"
                />
                <Typography variant="body2" fontWeight={isActive ? 'bold' : 'normal'}>
                  {segment.name || `day ${segment.startDay}`}
                </Typography>
                {isActive && (
                  <CheckCircleIcon color="primary" fontSize="small" />
                )}
              </Box>
              <Box onClick={(e) => e.stopPropagation()}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onRemoveSegment(stateId, segment.id)}
                  title="Remove segment"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
