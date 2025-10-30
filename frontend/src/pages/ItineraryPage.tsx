import React, { useEffect, useState } from 'react';
import { Button, Typography, Box } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getCards, type CardDTO } from '../services/api';

interface ItineraryPageProps {
  wishlistName: string;
  onBack: () => void;
}

const ItineraryPage: React.FC<ItineraryPageProps> = ({ wishlistName, onBack }) => {
  const [cards, setCards] = useState<CardDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCards();
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

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        {cards.map((c) => (
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
