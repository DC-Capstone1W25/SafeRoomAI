// src/components/NavBar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  IconButton,
  Tooltip,
  ListItemIcon
} from '@mui/material';
import {
  Home,
  Timeline,
  Analytics,
  AccountCircle,
  ExitToApp,
  PersonAdd,
  VpnKey
} from '@mui/icons-material';
import DarkModeToggle from './DarkModeToggle';
import logo from './logo.png';
import { useAuth } from '../context/AuthContext';

export default function NavBar({ darkMode, onToggleDarkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

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
          
          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleMenu}
                  size="small"
                  sx={{ ml: 2 }}
                  aria-controls={open ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : <AccountCircle />}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => navigate('/profile')}>
                  <Avatar /> Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <ExitToApp fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
              <Button
                color="inherit"
                component={Link}
                to="/login"
                startIcon={<VpnKey />}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                component={Link}
                to="/signup"
                startIcon={<PersonAdd />}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
