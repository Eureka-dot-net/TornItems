import { Grid } from '@mui/material';
import BuyMeXanaxCard from '../gymComparison/BuyMeXanaxCard';
import ThankYouCard from '../gymComparison/ThankYouCard';
import ReportProblemCard from '../gymComparison/ReportProblemCard';

interface SupportCardsSectionProps {
  /**
   * Function to get the current settings for the problem report.
   * Should return a record of settings with sensitive data (like API keys) redacted.
   */
  getCurrentSettings: () => Record<string, unknown>;
}

/**
 * Reusable component that displays the "Support this Tool", "Report a Problem", 
 * and "Thank You!" cards in a responsive grid layout.
 */
export default function SupportCardsSection({ getCurrentSettings }: SupportCardsSectionProps) {
  return (
    <Grid container spacing={2} sx={{ mt: 8 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <BuyMeXanaxCard />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ReportProblemCard getCurrentSettings={getCurrentSettings} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <ThankYouCard />
      </Grid>
    </Grid>
  );
}
