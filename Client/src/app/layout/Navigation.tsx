import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Box } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const allNavItems = [
  { label: 'Stock Recommendations', path: '/' },
  { label: 'Profit Analysis', path: '/profit' },
  { label: 'Stock Profit', path: '/stockProfit' },
  { label: 'Gym Comparison', path: '/gymComparison' },
  { label: 'Training Breakdown', path: '/trainingBreakdown' },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navItems, setNavItems] = useState(allNavItems);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide navigation items unless user has the flag set in localStorage
  // Owner sets: localStorage.setItem('showAllNavigation', 'true')
  // Everyone else (friends) sees only Gym Comparison and Training Breakdown by default
  useEffect(() => {
    const showAllNav = localStorage.getItem('showAllNavigation') === 'true';
    if (showAllNav) {
      setNavItems(allNavItems);
    } else {
      setNavItems([
        { label: 'Gym Comparison', path: '/gymComparison' },
        { label: 'Training Breakdown', path: '/trainingBreakdown' },
      ]);
    }
  }, []);

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
