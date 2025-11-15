import { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
} from '@mui/material';
import { Save, Delete, ContentCopy } from '@mui/icons-material';

interface SaveConfigurationButtonProps {
  getCurrentSettings: () => Record<string, unknown>;
}

interface SavedConfiguration {
  name: string;
  timestamp: string;
  settings: Record<string, unknown>;
}

const STORAGE_KEY = 'gymComparison_savedConfigurations';

export default function SaveConfigurationButton({ getCurrentSettings }: SaveConfigurationButtonProps) {
  const [open, setOpen] = useState(false);
  const [configName, setConfigName] = useState('');
  const [error, setError] = useState('');
  const [savedConfigs, setSavedConfigs] = useState<SavedConfiguration[]>([]);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [configToCopy, setConfigToCopy] = useState<SavedConfiguration | null>(null);
  const [copyName, setCopyName] = useState('');

  useEffect(() => {
    if (open) {
      loadSavedConfigurations();
    }
  }, [open]);

  const loadSavedConfigurations = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const configs = JSON.parse(saved) as SavedConfiguration[];
        setSavedConfigs(configs);
      } else {
        setSavedConfigs([]);
      }
    } catch {
      setSavedConfigs([]);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setConfigName('');
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    if (!configName.trim()) {
      setError('Please enter a configuration name.');
      return;
    }

    try {
      const settings = getCurrentSettings();
      const newConfig: SavedConfiguration = {
        name: configName.trim(),
        timestamp: new Date().toISOString(),
        settings,
      };

      // Check if name already exists
      const existingIndex = savedConfigs.findIndex(c => c.name === newConfig.name);
      let updatedConfigs: SavedConfiguration[];
      
      if (existingIndex >= 0) {
        // Update existing
        updatedConfigs = [...savedConfigs];
        updatedConfigs[existingIndex] = newConfig;
      } else {
        // Add new
        updatedConfigs = [...savedConfigs, newConfig];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigs));
      setSavedConfigs(updatedConfigs);
      setConfigName('');
      setError('');
      setOpen(false);
    } catch (err) {
      setError('Failed to save configuration. Please try again.');
      console.error('Save error:', err);
    }
  };

  const handleDelete = (name: string) => {
    try {
      const updatedConfigs = savedConfigs.filter(c => c.name !== name);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigs));
      setSavedConfigs(updatedConfigs);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleCopy = (name: string) => {
    const configToCopy = savedConfigs.find(c => c.name === name);
    if (!configToCopy) return;
    
    setConfigToCopy(configToCopy);
    setCopyName(`${configToCopy.name} (Copy)`);
    setCopyDialogOpen(true);
  };

  const handleConfirmCopy = () => {
    if (!configToCopy || !copyName.trim()) {
      setError('Please enter a name for the copy.');
      return;
    }

    try {
      // Create a new configuration with all the same settings and segments
      const copiedConfig: SavedConfiguration = {
        name: copyName.trim(),
        timestamp: new Date().toISOString(),
        settings: JSON.parse(JSON.stringify(configToCopy.settings)), // Deep clone the settings
      };

      // Add the copied configuration to the list
      const updatedConfigs = [...savedConfigs, copiedConfig];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigs));
      setSavedConfigs(updatedConfigs);
      setCopyDialogOpen(false);
      setConfigToCopy(null);
      setCopyName('');
    } catch (err) {
      console.error('Copy error:', err);
      setError('Failed to copy configuration. Please try again.');
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Save />}
        onClick={handleOpen}
      >
        Save Configuration
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Save Configuration</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Save your current settings to quickly load them later. Configurations are stored locally in your browser.
          </Alert>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Configuration Name"
            fullWidth
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            placeholder='E.g., "My EDVD Build" or "Speed Focus Setup"'
            sx={{ mb: 3 }}
            autoFocus
          />

          {savedConfigs.length > 0 && (
            <Box>
              <Alert severity="info" sx={{ mb: 1 }}>
                Saved Configurations ({savedConfigs.length})
              </Alert>
              <List dense>
                {savedConfigs.map((config) => (
                  <ListItem key={config.name}>
                    <ListItemText 
                      primary={config.name}
                      secondary={new Date(config.timestamp).toLocaleString()}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        aria-label="copy"
                        onClick={() => handleCopy(config.name)}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <ContentCopy />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleDelete(config.name)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!configName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Configuration Dialog */}
      <Dialog open={copyDialogOpen} onClose={() => setCopyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Copy Configuration</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Enter a name for the copied configuration.
          </Alert>
          
          <TextField
            label="Configuration Name"
            fullWidth
            value={copyName}
            onChange={(e) => setCopyName(e.target.value)}
            placeholder='E.g., "My EDVD Build (Copy)"'
            sx={{ mt: 1 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmCopy} 
            variant="contained"
            disabled={!copyName.trim()}
          >
            Copy
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
