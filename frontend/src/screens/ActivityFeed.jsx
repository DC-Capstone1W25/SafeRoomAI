import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Box,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Pagination,
  Alert
} from '@mui/material';
import {
  Search,
  Refresh,
  Warning,
  Close as CloseIcon,
  AccessTime
} from '@mui/icons-material';
import { format } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

export default function ActivityFeed() {
  const [entries, setEntries] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 12;

  // Fetch list with metadata
  useEffect(() => {
    async function fetchList() {
      try {
        setLoading(true);
        const res = await fetch('/predict/activity/list');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setEntries(data);
          setError(null);
        } else {
          setEntries([]);
          setError('No activity found.');
        }
      } catch (e) {
        console.error(e);
        setEntries([]);
        setError('Failed to load activity.');
      } finally {
        setLoading(false);
      }
    }
    fetchList();
    const iv = setInterval(fetchList, 10000);
    return () => clearInterval(iv);
  }, []);

  // Filter by filename or metadata_id
  useEffect(() => {
    const list = entries.filter(item => {
      if (!searchTerm) return true;
      return (
        item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.metadata_id || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFiltered(list);
    setPage(1);
  }, [entries, searchTerm]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/predict/activity/list');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Failed to refresh activity.');
    } finally {
      setLoading(false);
    }
  };

  // Parse timestamp from filename prefix
  const tsFromFilename = fn => {
    const p = fn.slice(0, 15);
    return new Date(
      `${p.slice(0,4)}-${p.slice(4,6)}-${p.slice(6,8)}T${p.slice(9,11)}:${p.slice(11,13)}:${p.slice(13,15)}`
    );
  };

  // Dismiss anomaly
  const handleDismiss = async filename => {
    if (!window.confirm('Mark this anomaly as cleared?')) return;
    try {
      const res = await fetch(`/predict/activity/${filename}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEntries(e => e.filter(x => x.filename !== filename));
      setFiltered(f => f.filter(x => x.filename !== filename));
    } catch (e) {
      console.error('Dismiss failed', e);
      alert('Failed to clear anomaly.');
    }
  };

  // Pagination
  const total = Math.ceil(filtered.length / perPage);
  const pageItems = filtered.slice((page-1)*perPage, page*perPage);

  if (loading) return <LoadingSpinner message="Loading activity feed..." />;

  return (
    <Container maxWidth="xl">
      <Box mb={3}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Activity Feed
        </Typography>
        <Typography color="text.secondary">
          Recent anomaly detections and security events
        </Typography>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          placeholder="Search by file or ID..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search/></InputAdornment>
          }}
        />
        <IconButton onClick={handleRefresh}><Refresh/></IconButton>
        <Chip icon={<AccessTime/>} label={`${filtered.length} events`} variant="outlined" />
      </Box>

      {error && <ErrorAlert message={error} onRetry={handleRefresh} sx={{ mb: 3 }} />}

      {filtered.length === 0 && !error ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No activity snapshots found.
        </Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {pageItems.map(({ filename, metadata_id, is_anomaly }) => {
              const ts = tsFromFilename(filename);
              const displayTime = format(ts, 'MMM dd, yyyy HH:mm:ss');

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={metadata_id || filename}>
                  <Card
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      '&:hover': { transform: 'scale(1.02)' }
                    }}
                    onClick={() => setSelected({ filename, metadata_id, ts })}
                  >
                    {/* Dismiss button */}
                    <IconButton
                      size="small"
                      onClick={e => { e.stopPropagation(); handleDismiss(filename); }}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(255,255,255,0.8)'
                      }}
                    >
                      <CloseIcon fontSize="small"/>
                    </IconButton>

                    {/* Filename */}
                    <Box px={1} pt={1}>
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ width: '100%', textOverflow: 'ellipsis' }}
                      >
                        {filename}
                      </Typography>
                    </Box>

                    {/* Metadata ID */}
                    <Box px={1}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        ID: {metadata_id || '—'}
                      </Typography>
                    </Box>

                    <CardMedia
                      component="img"
                      height="180"
                      image={`/predict/activity/${filename}`}
                      alt={`Anomaly at ${displayTime}`}
                      sx={{ objectFit: 'cover' }}
                    />

                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Warning color="warning" fontSize="small"/>
                        <Typography variant="caption" color="warning.main" fontWeight="bold">
                          {is_anomaly ? 'ANOMALY' : 'CLEARED'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {displayTime}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {total > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={total}
                page={page}
                onChange={(e, p) => setPage(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        maxWidth="md"
        fullWidth
      >
        {selected && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  {selected.filename} — {format(selected.ts, 'MMM dd, yyyy HH:mm:ss')}
                </Typography>
                <IconButton onClick={() => setSelected(null)}>
                  <CloseIcon/>
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <img
                src={`/predict/activity/${selected.filename}`}
                alt="Anomaly detail"
                style={{ width: '100%', borderRadius: 8 }}
              />
              <Box mt={2}>
                <Typography variant="body2">
                  <strong>Metadata ID:</strong> {selected.metadata_id}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {selected.is_anomaly ? 'Anomaly' : 'Cleared'}
                </Typography>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  );
}
