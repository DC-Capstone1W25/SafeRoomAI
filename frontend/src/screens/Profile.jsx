import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  Avatar,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Search as SearchIcon,
  Event as EventIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, action: 'Logged in', timestamp: '2025-07-16T18:30:00Z' },
    { id: 2, action: 'Viewed analytics', timestamp: '2025-07-16T17:15:00Z' },
    { id: 3, action: 'Checked activity feed', timestamp: '2025-07-16T15:45:00Z' },
  ]);

  const handleSaveProfile = () => {
    // In a real app, you would make an API call to update the user's profile
    updateUser({ ...user, name, email });
    setEditMode(false);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = () => {
    // In a real app, you would validate and send this to your backend
    console.log('Changing password:', passwordData);
    setOpenChangePassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const filteredActivities = recentActivities.filter(activity =>
    activity.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Profile Settings
          </Typography>
          {!editMode ? (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveProfile}
            >
              Save Changes
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              }
            >
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  fontSize: '3rem',
                  bgcolor: 'primary.main',
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
            <Button
              variant="outlined"
              startIcon={<LockIcon />}
              onClick={() => setOpenChangePassword(true)}
              sx={{ mt: 2 }}
            >
              Change Password
            </Button>
          </Box>

          <Box sx={{ flex: 1 }}>
            {editMode ? (
              <>
                <TextField
                  label="Full Name"
                  fullWidth
                  margin="normal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  label="Email"
                  fullWidth
                  margin="normal"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h5" gutterBottom>
                  {user?.name}
                </Typography>
                <Typography color="text.secondary" paragraph>
                  {user?.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Member since {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Recent Activities
          </Typography>
          <TextField
            size="small"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <List>
          {filteredActivities.map((activity) => (
            <ListItem key={activity.id} divider>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.light' }}>
                  <EventIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={activity.action}
                secondary={new Date(activity.timestamp).toLocaleString()}
              />
            </ListItem>
          ))}
          {filteredActivities.length === 0 && (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No activities found
            </Typography>
          )}
        </List>
      </Paper>

      {/* Change Password Dialog */}
      <Dialog open={openChangePassword} onClose={() => setOpenChangePassword(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter your current password and your new password below.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="currentPassword"
            label="Current Password"
            type="password"
            fullWidth
            variant="standard"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
          />
          <TextField
            margin="dense"
            name="newPassword"
            label="New Password"
            type="password"
            fullWidth
            variant="standard"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
          />
          <TextField
            margin="dense"
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            fullWidth
            variant="standard"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChangePassword(false)}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained" color="primary">
            Update Password
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
