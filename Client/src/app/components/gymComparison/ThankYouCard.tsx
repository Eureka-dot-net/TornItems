import { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { EmojiPeople } from '@mui/icons-material';
import { agent } from '../../../lib/api/agent';

interface Donation {
  _id: string;
  playerName: string;
  donationItem: string;
  createdAt: string;
}

export default function ThankYouCard() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const response = await agent.get<Donation[]>('/gym/donations');
        setDonations(response.data);
      } catch (err) {
        console.error('Failed to fetch donations:', err);
        setError('Failed to load thank you list');
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  if (loading) {
    return (
      <Card 
        sx={{ 
          border: '2px solid',
          borderColor: 'success.main',
          backgroundColor: 'background.paper',
          boxShadow: 2,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100 }}>
            <CircularProgress size={30} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card 
        sx={{ 
          border: '2px solid',
          borderColor: 'success.main',
          backgroundColor: 'background.paper',
          boxShadow: 2,
        }}
      >
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        border: '2px solid',
        borderColor: 'success.main',
        backgroundColor: 'background.paper',
        boxShadow: 2,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <EmojiPeople sx={{ color: 'success.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Thank You!
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mb: 2, opacity: 0.85 }}>
          Thank you to these generous players who have supported this page:
        </Typography>
        
        {donations.length === 0 ? (
          <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
            Be the first to support this page!
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {donations.map((donation) => (
              <Chip
                key={donation._id}
                label={`${donation.playerName} - ${donation.donationItem}`}
                variant="outlined"
                size="small"
                sx={{ 
                  borderColor: 'success.main',
                  color: 'text.primary',
                }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
