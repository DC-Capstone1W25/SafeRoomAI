// src/components/NavBar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Home,
  Timeline,
  Analytics
} from '@mui/icons-material';
import DarkModeToggle from './DarkModeToggle';
import logo from './logo.png';

export default function NavBar({ darkMode, onToggleDarkMode }) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getTabValue = () => {
    switch (location.pathname) {
      case '/': return 0;
      case '/activity': return 1;
      case '/analytics': return 2;
      default: return 0;
    }
  };

  const navItems = [
    { label: 'Live Feed', path: '/', icon: <Home /> },
    { label: 'Activity', path: '/activity', icon: <Timeline /> },
    { label: 'Analytics', path: '/analytics', icon: <Analytics /> },
  ];

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
          <img 
            src={logo} 
            alt="SafeRoom AI Logo" 
            style={{ height: '40px', width: 'auto' }} 
          />
          <Typography variant="h6" component="div" fontWeight="bold">
            SafeRoom AI
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Tabs
            value={getTabValue()}
            textColor="primary"
            indicatorColor="primary"
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
          >
            {navItems.map((item) => (
              <Tab
                key={item.path}
                label={isMobile ? '' : item.label}
                icon={item.icon}
                iconPosition={isMobile ? 'top' : 'start'}
                component={Link}
                to={item.path}
                sx={{
                  minWidth: isMobile ? 60 : 120,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              />
            ))}
          </Tabs>

          <DarkModeToggle
            darkMode={darkMode}
            onToggle={onToggleDarkMode}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
