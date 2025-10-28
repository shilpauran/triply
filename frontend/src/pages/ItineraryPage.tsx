import React from 'react';
import { Button, Typography, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface ItineraryPageProps {
  wishlistName: string;
  onBack: () => void;
}

const ItineraryPage: React.FC<ItineraryPageProps> = ({ wishlistName, onBack }) => {
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
        Are you ready to prepare itinerary for {wishlistName}?
      </Typography>
    </Box>
  );
};

export default ItineraryPage;
