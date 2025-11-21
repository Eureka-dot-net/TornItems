import { useState } from 'react';
import { 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
} from '@mui/material';
import { Clear } from '@mui/icons-material';

interface ClearConfigurationButtonProps {
  onClear: () => void;
}

export default function ClearConfigurationButton({ onClear }: ClearConfigurationButtonProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleClear = () => {
    onClear();
    setOpen(false);
  };

  return (
    <>
      <Tooltip title="Clear all current configuration settings from the page (keeps saved configurations)">
        <Button
          variant="outlined"
          startIcon={<Clear />}
          onClick={handleOpen}
          color="warning"
        >
          Clear Configuration
        </Button>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Clear Current Configuration?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will clear all current configuration settings from the page and reload default values.
          </Alert>
          
          <Alert severity="info">
            <strong>What will be cleared:</strong>
            <ul style={{ marginTop: '8px', marginBottom: 0 }}>
              <li>Current comparison states and sections</li>
              <li>Player stats (API key, initial stats, current gym)</li>
              <li>All configuration values (duration, weights, perks, etc.)</li>
            </ul>
            
            <br />
            
            <strong>What will NOT be cleared:</strong>
            <ul style={{ marginTop: '8px', marginBottom: 0 }}>
              <li>Saved configurations (accessible via Load Configuration)</li>
              <li>Cached historical stats data</li>
            </ul>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleClear} 
            variant="contained"
            color="warning"
          >
            Clear Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
