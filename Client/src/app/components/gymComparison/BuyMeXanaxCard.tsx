import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import { Favorite } from '@mui/icons-material';

export default function BuyMeXanaxCard() {
  return (
    <Card 
      sx={{ 
        border: '2px solid',
        borderColor: 'primary.main',
        backgroundColor: 'background.paper',
        boxShadow: 2,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Favorite sx={{ color: '#ff6b6b' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Support This Tool
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mb: 2, opacity: 0.85 }}>
          If this gym comparison tool has helped you optimize your training, consider buying me a Xanax in-game! 
          Your support helps keep this hobby project running and motivates me to add more features.
          If you would prefer to remain anonymous please let me know. 
        </Typography>
        <Button
          variant="contained"
          href="https://www.torn.com/profiles.php?XID=3926388"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            fontWeight: 'bold',
            textTransform: 'none',
            borderRadius: 2,
          }}
        >
          Send a Xanax 💊
        </Button>
      </CardContent>
    </Card>
  );
}
