import { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { FolderOpen, Delete } from '@mui/icons-material';

interface LoadConfigurationButtonProps {
  onLoadSettings: (settings: Record<string, unknown>) => void;
}

interface SavedConfiguration {
  name: string;
  timestamp: string;
  settings: Record<string, unknown>;
}

const STORAGE_KEY = 'gymComparison_savedConfigurations';

export default function LoadConfigurationButton({ onLoadSettings }: LoadConfigurationButtonProps) {
  const [open, setOpen] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfiguration[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);

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
    setSelectedConfig(null);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleLoad = () => {
    if (!selectedConfig) return;

    const config = savedConfigs.find(c => c.name === selectedConfig);
    if (config) {
      onLoadSettings(config.settings);
      setOpen(false);
    }
  };

  const handleDelete = (name: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const updatedConfigs = savedConfigs.filter(c => c.name !== name);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigs));
      setSavedConfigs(updatedConfigs);
      if (selectedConfig === name) {
        setSelectedConfig(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FolderOpen />}
        onClick={handleOpen}
      >
        Load Configuration
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Load Configuration</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Select a saved configuration to load all its settings.
          </Alert>

          {savedConfigs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" color="text.secondary">
                No saved configurations found.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Use "Save Configuration" to save your current settings.
              </Typography>
            </Box>
          ) : (
            <List>
              {savedConfigs.map((config) => (
                <ListItemButton
                  key={config.name}
                  selected={selectedConfig === config.name}
                  onClick={() => setSelectedConfig(config.name)}
                >
                  <ListItemText 
                    primary={config.name}
                    secondary={new Date(config.timestamp).toLocaleString()}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={(e) => handleDelete(config.name, e)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleLoad} 
            variant="contained"
            disabled={!selectedConfig}
          >
            Load
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
