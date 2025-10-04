import {
  Build
} from "@mui/icons-material";
import {
  Container, Paper, Typography, Box, Avatar
} from "@mui/material";

function UnderConstructionPage() {
  return (
    <Container maxWidth="lg">
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="100vh"
      >
        {/* Main Maintenance Notice */}
        <Paper elevation={3} sx={{ p: 6, textAlign: 'center', maxWidth: 600 }}>
          <Avatar sx={{ bgcolor: 'warning.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
            <Build fontSize="large" />
          </Avatar>
          
          <Typography variant="h3" gutterBottom sx={{ color: 'warning.main' }}>
            🚧 Under Construction
          </Typography>
          
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            We're currently building something awesome!
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            This application is under active development. Please check back soon to see what we're working on.
          </Typography>
        </Paper>

        {/* Footer Message */}
        <Paper elevation={1} sx={{ p: 2, mt: 4, opacity: 0.8, textAlign: 'center', maxWidth: 600 }}>
          <Typography variant="body2" color="text.secondary">
            💡 <strong>Tip:</strong> Bookmark this page and check back regularly for updates!
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default UnderConstructionPage;