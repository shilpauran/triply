import React, { useState, useCallback, useEffect } from 'react';
import {
  Button, 
  Container, 
  Typography, 
  Box, 
  Paper, 
  CircularProgress, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import { styled } from '@mui/material/styles';
import { checkImage, ImageData } from './services/api';
import { createWishlist, getAllWishlists, addToWishlist } from './services/wishlistService';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Wishlist states
  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false);
  const [wishlists, setWishlists] = useState<string[]>([]);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [wishlistSuccess, setWishlistSuccess] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await checkImage(selectedFile);
      setResult(response);
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error('Error uploading file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  // Load wishlists when the dialog opens
  const loadWishlists = useCallback(async () => {
    try {
      console.log('Fetching wishlists...');
      const data = await getAllWishlists();
      console.log('Received wishlists data:', data);
      setWishlists(data);
    } catch (err) {
      console.error('Failed to load wishlists:', err);
      setWishlistError('Failed to load wishlists. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (wishlistDialogOpen) {
      loadWishlists();
    }
  }, [wishlistDialogOpen, loadWishlists]);

  const handleAddToWishlist = async (wishlistName: string) => {
    if (!result) return;
    
    try {
      await addToWishlist(wishlistName, result.placeName);
      setWishlistSuccess(`Added to ${wishlistName} successfully!`);
      setTimeout(() => setWishlistSuccess(null), 3000);
    } catch (err) {
      setWishlistError('Failed to add to wishlist. Please try again.');
      console.error('Error adding to wishlist:', err);
    }
  };

  const handleCreateWishlist = async () => {
    if (!newWishlistName.trim()) {
      setWishlistError('Please enter a wishlist name');
      return;
    }
    
    try {
      console.log('Creating wishlist:', newWishlistName);
      await createWishlist(newWishlistName);
      console.log('Wishlist created, refreshing list...');
      await loadWishlists();
      setNewWishlistName('');
      setWishlistError(null);
      setWishlistSuccess(`Wishlist "${newWishlistName}" created successfully!`);
      setTimeout(() => setWishlistSuccess(null), 3000);
    } catch (err) {
      const errorMsg = 'Failed to create wishlist. The name might already exist.';
      console.error('Error creating wishlist:', err);
      setWishlistError(errorMsg);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Image Place Recognition
        </Typography>
        
        <Typography variant="body1" paragraph>
          Upload an image to detect the place shown in it.
        </Typography>

        <Box sx={{ my: 4 }}>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={isLoading}
          >
            {selectedFile ? selectedFile.name : 'Choose Image'}
            <VisuallyHiddenInput 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </Button>
        </Box>

        {selectedFile && (
          <Box sx={{ my: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={isLoading}
              sx={{ minWidth: 120 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Detect the Place'}
            </Button>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6">Detected Place: {result.placeName}</Typography>
            <img 
              src={`data:${result.type};base64,${result.data}`} 
              alt="Detected place" 
              style={{ maxWidth: '100%', marginTop: '1rem' }} 
            />
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<BookmarkAddIcon />}
                onClick={() => setWishlistDialogOpen(true)}
              >
                Add to Wishlist
              </Button>
            </Box>
          </Box>
        )}

        {/* Wishlist Dialog */}
        <Dialog 
          open={wishlistDialogOpen} 
          onClose={() => setWishlistDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add to Wishlist</DialogTitle>
          <DialogContent>
            {wishlistError && (
              <Alert severity="error" sx={{ mb: 2 }}>{wishlistError}</Alert>
            )}
            {wishlistSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>{wishlistSuccess}</Alert>
            )}
            
            <Typography variant="h6" gutterBottom>Select a wishlist:</Typography>
            <List>
              {wishlists.map((wishlist) => (
                <React.Fragment key={wishlist}>
                  <ListItemButton 
                    onClick={() => handleAddToWishlist(wishlist)}
                  >
                    <ListItemText primary={wishlist} />
                  </ListItemButton>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Or create a new wishlist:</Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="New wishlist name"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                />
                <Button 
                  variant="contained" 
                  onClick={handleCreateWishlist}
                  disabled={!newWishlistName.trim()}
                >
                  Create
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWishlistDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}

export default App;
