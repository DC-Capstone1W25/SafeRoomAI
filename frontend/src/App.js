// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { lightTheme, darkTheme } from './theme/theme';
import DarkModeToggle from './components/DarkModeToggle';
import NavBar from './components/NavBar';
import HomeScreen from './screens/HomeScreen';

import ActivityFeed from './screens/ActivityFeed';
import Analytics from './screens/Analytics';
import NotFound from './components/NotFound';
import Footer from './components/Footer';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false; // Default to light mode
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const currentTheme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <NavBar
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
          />

          <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 2 }}>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/dashboard" element={<Analytics />} />
              <Route path="/activity" element={<ActivityFeed />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>

          <Footer />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
