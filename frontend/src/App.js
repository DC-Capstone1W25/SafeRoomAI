// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { lightTheme, darkTheme } from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import NavBar from './components/NavBar';
import HomeScreen from './screens/HomeScreen';
import Login from './screens/Login';
import Signup from './screens/Signup';
import ActivityFeed from './screens/ActivityFeed';
import Analytics from './screens/Analytics';
import Profile from './screens/Profile';
import NotFound from './components/NotFound';
import Footer from './components/Footer';

// A wrapper component to handle authentication state
const AuthWrapper = ({ children, darkMode, onToggleDarkMode }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
      />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 2 }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

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
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <AuthWrapper darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)}>
                  <ProtectedRoute>
                    <HomeScreen />
                  </ProtectedRoute>
                </AuthWrapper>
              }
            />
            <Route
              path="/activity"
              element={
                <AuthWrapper darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)}>
                  <ProtectedRoute>
                    <ActivityFeed />
                  </ProtectedRoute>
                </AuthWrapper>
              }
            />
            <Route
              path="/analytics"
              element={
                <AuthWrapper darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)}>
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                </AuthWrapper>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthWrapper darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)}>
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                </AuthWrapper>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
