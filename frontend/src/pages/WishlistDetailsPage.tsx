import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Button,
  Alert,
  AppBar,
  Toolbar,
  Autocomplete,
  TextField,
  Chip,
  Stack
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaceIcon from '@mui/icons-material/Place';
import { getWishlistDetails, removeFromWishlist, deleteWishlist, getAllWishlists, getWishlist, type WishlistItemDetail } from '../services/wishlistService';
import { getPersonalizedCards, type PersonalizedCardDTO, getInfluencerCards, type InfluencerCardDTO, getMicroItineraryCards, type MicroItineraryCardDTO } from '../services/api';
import MuiCard from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';

const WishlistDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const [details, setDetails] = useState<WishlistItemDetail[] | null>(null);
  const [basePlaces, setBasePlaces] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [otherWishlistPlaces, setOtherWishlistPlaces] = useState<Set<string>>(new Set());
  // Cards state
  const [personalizedCards, setPersonalizedCards] = useState<PersonalizedCardDTO[]>([]);
  const [influencerCards, setInfluencerCards] = useState<InfluencerCardDTO[]>([]);
  const [microCards, setMicroCards] = useState<MicroItineraryCardDTO[]>([]);
  const [cardsLoading, setCardsLoading] = useState<boolean>(false);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  const normalizeName = (s?: string) => (s || '').trim().toLowerCase();

  // Guided questions state (Duration -> City -> Date)
  const [city, setCity] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [durationChoice, setDurationChoice] = useState<string>('');

  // City options
  const INDIAN_CITIES: string[] = [
    'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur',
    'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad',
    'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
    'Amritsar', 'Navi Mumbai', 'Prayagraj', 'Howrah', 'Ranchi', 'Gwalior', 'Jabalpur', 'Coimbatore', 'Vijayawada',
    'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubballi', 'Mysuru', 'Tiruchirappalli',
    'Bareilly', 'Aligarh', 'Tiruppur', 'Gurugram', 'Noida', 'Dehradun', 'Kochi', 'Kozhikode', 'Thiruvananthapuram',
    'Panaji', 'Udaipur', 'Shimla', 'Ooty'
  ];

  // Duration options buckets
  const DURATION_OPTIONS: string[] = [
    '3 - 4 days',
    '6 - 9 days',
    '10 - 12 days',
    '13 - 15 days',
    '15 - 20 days',
    '20+ days'
  ];

  const loadDetails = useCallback(async () => {
    if (!name) return;
    try {
      const d = await getWishlistDetails(name);
      setDetails(d);
    } catch {
      setDetails([]);
    }
  }, [name]);

  const loadBasePlaces = useCallback(async () => {
    if (!name) return;
    try {
      const places = await getWishlist(name);
      setBasePlaces(Array.isArray(places) ? places : []);
    } catch {
      setBasePlaces([]);
    }
  }, [name]);

  useEffect(() => {
    loadDetails();
    loadBasePlaces();
  }, [loadDetails, loadBasePlaces]);

  useEffect(() => {
    // Load places from other wishlists to exclude them from the popup list
    (async () => {
      try {
        const all = await getAllWishlists();
        const currentNameLc = normalizeName(name);
        const others = Array.isArray(all) ? all.filter(w => normalizeName(w) !== currentNameLc) : [];
        const placeSet = new Set<string>();
        for (const wl of others) {
          try {
            const places = await getWishlist(wl);
            for (const p of places) placeSet.add(normalizeName(p));
          } catch {
            // ignore fetch error for a wishlist; continue
          }
        }
        setOtherWishlistPlaces(placeSet);
      } catch {
        setOtherWishlistPlaces(new Set());
      }
    })();
  }, [name]);

  // Ensure data refresh when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      loadDetails();
      loadBasePlaces();
    }
  }, [dialogOpen, loadDetails, loadBasePlaces]);

  const filteredDetails = useMemo(() => {
    const d = Array.isArray(details) ? details : [];
    const base = Array.isArray(basePlaces) ? basePlaces : [];
    const inDetailsSet = new Set(d.map(x => normalizeName(x.placeName)));
    const supplemented: WishlistItemDetail[] = [
      ...d,
      ...base
        .filter(p => !inDetailsSet.has(normalizeName(p)))
        .map(p => ({ placeName: p, description: undefined, imageUrl: undefined, imageBase64: undefined, imageType: undefined }))
    ];
    if (!otherWishlistPlaces || otherWishlistPlaces.size === 0) return supplemented;
    const excluded = supplemented.filter(x => !otherWishlistPlaces.has(normalizeName(x.placeName)));
    // Fallback: if everything got excluded, still show this wishlist's items
    return excluded.length > 0 ? excluded : supplemented;
  }, [details, basePlaces, otherWishlistPlaces]);

  // Apply City filter (case-insensitive substring on place name)
  const cityFilteredDetails = useMemo(() => {
    const term = (city || '').trim().toLowerCase();
    if (!term) return filteredDetails;
    return filteredDetails.filter(it => normalizeName(it.placeName).includes(term));
  }, [filteredDetails, city]);

  const handleRemove = async (placeName: string) => {
    if (!name) return;
    try {
      await removeFromWishlist(name, placeName);
      setDetails((prev) => (prev ? prev.filter(p => p.placeName !== placeName) : prev));
      setBasePlaces((prev) => (prev ? prev.filter(p => normalizeName(p) !== normalizeName(placeName)) : prev));
      setSuccess(`Removed "${placeName}" from "${name}"`);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError(`Failed to remove "${placeName}" from "${name}"`);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Fetch and show cards when Done is clicked
  const handleShowCards = async () => {
    setCardsLoading(true);
    try {
      const [p, i, m] = await Promise.all([
        getPersonalizedCards(),
        getInfluencerCards(),
        getMicroItineraryCards()
      ]);
      console.log('Fetched cards -> personalized:', p?.length || 0, 'influencer:', i?.length || 0, 'micro:', m?.length || 0);
      setPersonalizedCards(Array.isArray(p) ? p : []);
      setInfluencerCards(Array.isArray(i) ? i : []);
      setMicroCards(Array.isArray(m) ? m : []);
    } catch (e) {
      setPersonalizedCards([]);
      setInfluencerCards([]);
      setMicroCards([]);
      setError('Failed to load cards');
      setTimeout(() => setError(null), 3000);
    } finally {
      setCardsLoading(false);
      // scroll results into view after render
      setTimeout(() => {
        if (cardsRef.current) {
          cardsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    }
  };

  const handleDeleteWishlist = async () => {
    if (!name) return;
    if (!window.confirm(`Delete wishlist "${name}"? This cannot be undone.`)) return;
    try {
      await deleteWishlist(name);
      navigate('/');
    } catch {
      setError('Failed to delete wishlist. Please try again.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(-1)} aria-label="back" sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>{name}</Box>
          <Button variant="outlined" onClick={() => setDialogOpen(true)} sx={{ mr: 1 }}>
            Wishlist
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteWishlist}>
            Delete Wishlist
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, maxWidth: 800, width: '100%', mx: 'auto' }}>
        {/* Guided Q&A */}
        {step === 1 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>What is the duration of your holiday?</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {DURATION_OPTIONS.map(opt => (
                <Chip
                  key={opt}
                  label={opt}
                  clickable
                  color={durationChoice === opt ? 'primary' : 'default'}
                  onClick={() => { setDurationChoice(opt); setStep(2); }}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {step === 2 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Where are you travelling from?</Typography>
            <Autocomplete
              options={INDIAN_CITIES}
              freeSolo
              openOnFocus
              inputValue={city}
              onInputChange={(_, value) => setCity(value)}
              renderInput={(params) => (
                <TextField {...params} label="Starting City" size="small" fullWidth />
              )}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="outlined" onClick={() => setStep(1)}>Back</Button>
              <Button variant="contained" onClick={() => setStep(3)} disabled={!city.trim()}>Next</Button>
            </Box>
          </Box>
        )}

        {step === 3 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>When is your departure date?</Typography>
            <TextField
              label="Departure date"
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="outlined" onClick={() => setStep(2)}>Back</Button>
              <Button variant="contained" disabled={!startDate} onClick={handleShowCards}>Done</Button>
            </Box>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {/* Cards results (always shown below Q&A when loaded) */}
        {cardsLoading && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading cards...</Typography>
        )}
        {!cardsLoading && (
          <Box ref={cardsRef} sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {/* Left: Personalized */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Personalized Cards ({personalizedCards.length})</Typography>
              {personalizedCards.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No personalized cards.</Typography>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  {personalizedCards.map((c, idx) => (
                    <MuiCard key={`p-${c.title}-${idx}`} variant="outlined">
                      {c.thumbnailImage && (
                        <CardMedia component="img" height="140" image={c.thumbnailImage} alt={c.title} />
                      )}
                      <CardContent>
                        <Typography variant="subtitle1">{c.title}</Typography>
                        {c.durationDays && (
                          <Typography variant="caption" color="text.secondary">Duration: {c.durationDays} days</Typography>
                        )}
                        {c.shortDescription && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>{c.shortDescription}</Typography>
                        )}
                      </CardContent>
                    </MuiCard>
                  ))}
                </Box>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Influencer Cards ({influencerCards.length})</Typography>
              {influencerCards.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No influencer cards.</Typography>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5 }}>
                  {influencerCards.map((c, idx) => (
                    <MuiCard key={`i-${c.title}-${idx}`} variant="outlined">
                      {c.thumbnailImage && (
                        <CardMedia component="img" height="140" image={c.thumbnailImage} alt={c.title} />
                      )}
                      <CardContent>
                        <Typography variant="subtitle1">{c.title}</Typography>
                        {c.durationDays && (
                          <Typography variant="caption" color="text.secondary">Duration: {c.durationDays} days</Typography>
                        )}
                        {c.shortDescription && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>{c.shortDescription}</Typography>
                        )}
                      </CardContent>
                    </MuiCard>
                  ))}
                </Box>
              )}
            </Box>

            {/* Bottom: Micro Itinerary (full width) */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Micro Itinerary Cards ({microCards.length})</Typography>
              {microCards.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No micro-itinerary cards.</Typography>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  {microCards.map((c, idx) => (
                    <MuiCard key={`m-${c.title}-${idx}`} variant="outlined">
                      {c.thumbnailImage && (
                        <CardMedia component="img" height="140" image={c.thumbnailImage} alt={c.title} />
                      )}
                      <CardContent>
                        <Typography variant="subtitle1">{c.title}</Typography>
                        {c.durationDays && (
                          <Typography variant="caption" color="text.secondary">Duration: {c.durationDays} days</Typography>
                        )}
                        {c.shortDescription && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>{c.shortDescription}</Typography>
                        )}
                      </CardContent>
                    </MuiCard>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default WishlistDetailsPage;
