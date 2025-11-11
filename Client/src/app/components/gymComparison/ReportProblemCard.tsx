import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Collapse,
} from '@mui/material';
import { BugReport, ContentCopy, Check, ExpandMore, ExpandLess } from '@mui/icons-material';

interface ReportProblemCardProps {
  getCurrentSettings: () => Record<string, unknown>;
}

export default function ReportProblemCard({ getCurrentSettings }: ReportProblemCardProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setCopied(false);
    setMessage('');
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCopyReport = async () => {
    const settings = getCurrentSettings();
    const report = {
      message,
      timestamp: new Date().toISOString(),
      settings,
    };
    
    const reportText = `
=== GYM COMPARISON TOOL - PROBLEM REPORT ===
Timestamp: ${report.timestamp}
Message: ${report.message}

Settings (JSON):
${JSON.stringify(report.settings, null, 2)}

=== INSTRUCTIONS FOR DEVELOPER ===
To reproduce this issue:
1. Go to the Gym Comparison Tool
2. Click "Load Settings from Report" button
3. Paste the Settings JSON above
4. The tool will restore all configuration options

Report this issue at: https://www.torn.com/profiles.php?XID=3926388
`.trim();

    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const settings = getCurrentSettings();
  const settingsJson = JSON.stringify(settings, null, 2);

  return (
    <>
      <Card 
        sx={{ 
          border: '2px solid',
          borderColor: 'error.dark',
          backgroundColor: 'background.paper',
          boxShadow: 2,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <BugReport />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Report a Problem
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.85 }}>
            Found a bug or have a suggestion? Report it here! Your current settings will be included 
            to help me reproduce and fix the issue faster.
          </Typography>
          <Button
            variant="contained"
            onClick={handleOpen}
            color="error"
            sx={{
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            Report Issue 🐛
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Report a Problem</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Since this is a hobby project without email service, please copy the report below 
            and send it to me via{' '}
            <a 
              href="https://www.torn.com/messages.php#/p=compose&XID=3926388" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'inherit', fontWeight: 'bold', textDecoration: 'underline' }}
            >
              Torn mail
            </a>
            {' '}or the forums. The report includes your current settings so I can reproduce the issue. 
            Your API key will NOT be included in the report for security reasons.
          </Alert>
          
          <TextField
            label="Describe the problem"
            multiline
            rows={4}
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="E.g., The calculations seem incorrect when using EDVD jumps..."
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <Button
              onClick={() => setShowSettings(!showSettings)}
              endIcon={showSettings ? <ExpandLess /> : <ExpandMore />}
              size="small"
            >
              {showSettings ? 'Hide' : 'Show'} Settings Preview
            </Button>
            <Collapse in={showSettings}>
              <TextField
                multiline
                fullWidth
                value={settingsJson}
                InputProps={{
                  readOnly: true,
                  sx: { fontFamily: 'monospace', fontSize: '0.75rem' }
                }}
                sx={{ mt: 1 }}
                rows={10}
              />
            </Collapse>
          </Box>

          {copied && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Report copied to clipboard! Please send it to me via Torn mail.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleCopyReport} 
            variant="contained" 
            startIcon={copied ? <Check /> : <ContentCopy />}
            disabled={!message.trim()}
          >
            {copied ? 'Copied!' : 'Copy Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
