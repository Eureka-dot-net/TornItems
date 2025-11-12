import { Box, Typography, Paper, IconButton, Chip, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { type ComparisonSegment } from '../../../lib/types/gymComparison';

interface SegmentManagementProps {
  stateId: string;
  stateName: string;
  segments: ComparisonSegment[];
  onRemoveSegment: (stateId: string, segmentId: string) => void;
  onEditSegment: (segmentId: string) => void;
}

export default function SegmentManagement({
  stateId,
  stateName,
  segments,
  onRemoveSegment,
  onEditSegment,
}: SegmentManagementProps) {
  if (segments.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" gutterBottom>
          Time Segments
        </Typography>
        <Alert severity="info" sx={{ mb: 0 }}>
          Click on the chart line to add a time segment with different settings starting from that day.
          Segments bypass the 4-comparison limit.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
      <Typography variant="subtitle2" gutterBottom>
        Time Segments for {stateName}
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Click on the chart to add more segments. Each segment can have its own configuration.
      </Alert>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {segments.map((segment) => (
          <Box
            key={segment.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`Day ${segment.startDay}`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Typography variant="body2">
                {segment.name || `day ${segment.startDay}`}
              </Typography>
            </Box>
            <Box>
              <IconButton
                size="small"
                onClick={() => onEditSegment(segment.id)}
                title="Edit segment configuration"
              >
                <EditIcon fontSize="small" />
              </IconButton>
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
        ))}
      </Box>
    </Paper>
  );
}
