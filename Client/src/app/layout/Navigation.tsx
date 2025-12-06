import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Box } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const TRAINING_TOKEN_KEY = 'trainingAuthToken';

const allNavItems = [
  { label: 'Stock Recommendations', path: '/recommendations' },
  { label: 'Profit Analysis', path: '/profit' },
  { label: 'Stock Profit', path: '/stockProfit' },
  { label: 'Gym Comparison', path: '/gymComparison' },
  { label: 'Training Breakdown', path: '/trainingBreakdown' },
];

const trainingRecommendationsNavItem = { label: 'Training Recommendations', path: '/trainingRecommendations' };

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navItems, setNavItems] = useState(allNavItems);
  const navigate = useNavigate();
  const location = useLocation();

  // Update navigation items based on user permissions
  useEffect(() => {
    const updateNavItems = () => {
      const showAllNav = localStorage.getItem('showAllNavigation') === 'true';
      const hasTrainingAuth = !!localStorage.getItem(TRAINING_TOKEN_KEY);
      
      let items;
      if (showAllNav) {
        items = [...allNavItems];
      } else {
        items = [
          { label: 'Gym Comparison', path: '/gymComparison' },
          { label: 'Training Breakdown', path: '/trainingBreakdown' },
        ];
      }
      
      // Add Training Recommendations if user is authorized
      if (hasTrainingAuth) {
        items.push(trainingRecommendationsNavItem);
      }
      
      setNavItems(items);
    };

    updateNavItems();
    
    // Listen for storage changes (e.g., when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TRAINING_TOKEN_KEY || e.key === 'showAllNavigation') {
        updateNavItems();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also update on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateNavItems();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // Note: location.pathname is included to ensure nav updates after same-tab auth changes
    // (storage event only fires in other tabs, not the current one)
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        TornItems
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              sx={{
                textAlign: 'center',
                backgroundColor: location.pathname === item.path ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
              }}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }}
          >
            TornItems
          </Typography>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                sx={{
                  color: '#fff',
                  backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  '&:hover': {
                    backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  },
                  mx: 0.5,
                }}
                onClick={() => handleNavigation(item.path)}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'block', md: 'none' }, textAlign: 'center' }}
          >
            TornItems
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
