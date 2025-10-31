import React, { useEffect, useMemo, useState } from 'react';
import { Button, Typography, Box, TextField, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getPersonalizedCards, type PersonalizedCardDTO } from '../services/api';

interface ItineraryPageProps {
  wishlistName: string;
  onBack: () => void;
}

const ItineraryPage: React.FC<ItineraryPageProps> = ({ wishlistName, onBack }) => {
  const [cards, setCards] = useState<PersonalizedCardDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Filters
  const [city, setCity] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  // Rooms & Guests dialog state
  type Room = { adults: number; children: number };
  const [roomsData, setRoomsData] = useState<Room[]>([{ adults: 2, children: 0 }]);
  const [roomsDialogOpen, setRoomsDialogOpen] = useState<boolean>(false);

  const totalRoomsGuestsSummary = useMemo(() => {
    const rooms = roomsData.length;
    const totalAdults = roomsData.reduce((s, r) => s + r.adults, 0);
    const totalChildren = roomsData.reduce((s, r) => s + r.children, 0);
    return `${rooms} room${rooms !== 1 ? 's' : ''}, ${totalAdults} adult${totalAdults !== 1 ? 's' : ''}, ${totalChildren} child${totalChildren !== 1 ? 'ren' : ''}`;
  }, [roomsData]);

  // Hardcoded list of Indian cities
  const INDIAN_CITIES: string[] = [
    'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur',
    'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad',
    'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
    'Amritsar', 'Navi Mumbai', 'Prayagraj', 'Howrah', 'Ranchi', 'Gwalior', 'Jabalpur', 'Coimbatore', 'Vijayawada',
    'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubballi', 'Mysuru', 'Tiruchirappalli',
    'Bareilly', 'Aligarh', 'Tiruppur', 'Gurugram', 'Noida', 'Dehradun', 'Kochi', 'Kozhikode', 'Thiruvananthapuram',
    'Panaji', 'Udaipur', 'Shimla', 'Ooty'
  ];

  const durationOptions = useMemo(() => {
    const set = new Set<string>(cards.map(c => c.durationDays).filter(Boolean));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [cards]);

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const matchesCity = city.trim()
        ? c.title.toLowerCase().includes(city.trim().toLowerCase())
        : true;
      const matchesDuration = duration.trim()
        ? (parseInt(c.durationDays, 10) === Number(duration))
        : true;
      // startDate, rooms, guests are captured for itinerary personalization
      // but do not filter cards yet (no backend field to match). Kept for future use.
      return matchesCity && matchesDuration;
    });
  }, [cards, city, duration]);

  // Rooms dialog handlers
  const addRoom = () => setRoomsData(prev => [...prev, { adults: 2, children: 0 }]);
  const removeRoom = (index: number) => setRoomsData(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  const updateRoom = (index: number, deltaAdults: number, deltaChildren: number) => {
    setRoomsData(prev => prev.map((room, i) => {
      if (i !== index) return room;
      let adults = room.adults + deltaAdults;
      let children = room.children + deltaChildren;
      adults = Math.max(1, adults); // at least 1 adult
      children = Math.max(0, children);
      // Enforce max 4 guests per room
      if (adults + children > 4) {
        // clamp children first
        const extra = adults + children - 4;
        if (deltaChildren > 0 && children >= extra) {
          children -= extra;
        } else {
          // otherwise reduce adults but keep at least 1
          adults = Math.max(1, 4 - children);
        }
      }
      return { adults, children };
    }));
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getPersonalizedCards();
        setCards(data);
      } catch (e) {
        setError('Failed to load recommendations');
      }
    })();
  }, []);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      p: 3,
      maxWidth: 800,
      margin: '0 auto'
    }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ alignSelf: 'flex-start', mb: 3 }}
      >
        Back to Wishlist
      </Button>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Personalize your itinerary for {wishlistName}
      </Typography>

      {/* Filters */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
          gap: 2,
          mb: 2,
          alignItems: 'center'
        }}
      >
        <Autocomplete
          options={INDIAN_CITIES}
          freeSolo
          openOnFocus
          inputValue={city}
          onInputChange={(_, value) => setCity(value)}
          renderInput={(params) => (
            <TextField {...params} label="Starting City" size="small" />
          )}
        />
        <TextField
          label="Starting date"
          size="small"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Autocomplete
          options={durationOptions}
          freeSolo
          openOnFocus
          inputValue={duration}
          onInputChange={(_, value) => setDuration(value)}
          renderInput={(params) => (
            <TextField {...params} label="Duration (days)" size="small" />
          )}
        />
        <Button variant="outlined" size="small" onClick={() => setRoomsDialogOpen(true)}>
          Rooms & Guests
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      )}

      {/* Rooms & Guests Dialog */}
      <Dialog open={roomsDialogOpen} onClose={() => setRoomsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rooms & Guests</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Maximum 4 guests per room. Children are under 12 years.
          </Typography>
          {roomsData.map((room, idx) => {
            const total = room.adults + room.children;
            const canIncrementAdults = total < 4;
            const canIncrementChildren = total < 4;
            const canDecrementAdults = room.adults > 1;
            const canDecrementChildren = room.children > 0;
            return (
              <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 500 }}>Room {idx + 1}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeRoom(idx)}
                    disabled={roomsData.length <= 1}
                    aria-label="remove room"
                    sx={{ ml: 'auto' }}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ minWidth: 72 }}>Adults</Typography>
                  <IconButton size="small" onClick={() => updateRoom(idx, -1, 0)} disabled={!canDecrementAdults} aria-label="decrease adults">
                    <RemoveCircleOutlineIcon fontSize="small" />
                  </IconButton>
                  <Typography>{room.adults}</Typography>
                  <IconButton size="small" onClick={() => updateRoom(idx, +1, 0)} disabled={!canIncrementAdults} aria-label="increase adults">
                    <AddCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ minWidth: 72 }}>Children</Typography>
                  <IconButton size="small" onClick={() => updateRoom(idx, 0, -1)} disabled={!canDecrementChildren} aria-label="decrease children">
                    <RemoveCircleOutlineIcon fontSize="small" />
                  </IconButton>
                  <Typography>{room.children}</Typography>
                  <IconButton size="small" onClick={() => updateRoom(idx, 0, +1)} disabled={!canIncrementChildren} aria-label="increase children">
                    <AddCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
          <Button startIcon={<AddCircleOutlineIcon />} onClick={addRoom} variant="text">
            Add another room
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomsDialogOpen(false)} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        {filteredCards.map((c) => (
          <Card key={c.title} variant="outlined">
            {c.thumbnailImage && (
              <CardMedia
                component="img"
                height="140"
                image={c.thumbnailImage}
                alt={c.title}
              />
            )}
            <CardContent>
              <Typography variant="h6" gutterBottom>{c.title}</Typography>
              <Typography variant="body2" color="text.secondary">{c.shortDescription}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Duration: {c.durationDays}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small">Select</Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default ItineraryPage;
