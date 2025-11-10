import { useState } from 'react';
import { 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { Upload } from '@mui/icons-material';

interface LoadSettingsButtonProps {
  onLoadSettings: (settings: Record<string, unknown>) => void;
}

export default function LoadSettingsButton({ onLoadSettings }: LoadSettingsButtonProps) {
  const [open, setOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');

  const handleOpen = () => {
    setOpen(true);
    setJsonInput('');
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleLoad = () => {
    try {
      const settings = JSON.parse(jsonInput);
      onLoadSettings(settings);
      setOpen(false);
      setError('');
    } catch {
      setError('Invalid JSON format. Please check the input and try again.');
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<Upload />}
        onClick={handleOpen}
        sx={{ textTransform: 'none' }}
      >
        Load Settings from Report
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Load Settings from Problem Report</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Paste the Settings JSON from a problem report here to restore the exact configuration 
            that was used when the issue occurred.
          </Alert>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Settings JSON"
            multiline
            rows={15}
            fullWidth
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Paste the Settings JSON here...'
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleLoad} 
            variant="contained"
            disabled={!jsonInput.trim()}
          >
            Load Settings
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
