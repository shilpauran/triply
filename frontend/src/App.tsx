import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ItineraryPage from './pages/ItineraryPage';
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
  DialogContentText,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Badge,
  AppBar,
  Toolbar
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PlaceIcon from '@mui/icons-material/Place';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ArrowBack from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import { checkImage, ImageData } from './services/api';
import { createWishlist, getAllWishlists, addToWishlist, getWishlist, removeFromWishlist, deleteWishlist } from './services/wishlistService';

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

const App: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Wishlist states
  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false);
  const [wishlists, setWishlists] = useState<{name: string, places: string[]}[]>([]);
  const [selectedWishlist, setSelectedWishlist] = useState<{name: string, places: string[]} | null>(null);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [wishlistSuccess, setWishlistSuccess] = useState<string | null>(null);
  const [showItineraryPage, setShowItineraryPage] = useState(false);
  const [currentWishlist, setCurrentWishlist] = useState<{name: string} | null>(null);

  // Handle navigation to itinerary page
  const navigateToItinerary = (wishlist: {name: string}) => {
    setCurrentWishlist(wishlist);
    setShowItineraryPage(true);
  };

  // Handle going back from itinerary page
  const handleBackFromItinerary = () => {
    setShowItineraryPage(false);
    setCurrentWishlist(null);
  };

  // Calculate total places in all wishlists
  const totalPlaces = wishlists.reduce((sum, wl) => sum + wl.places.length, 0);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

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
      const wishlistNames = await getAllWishlists();
      if (!Array.isArray(wishlistNames)) {
        setWishlists([]);
        return;
      }
      const wishlistsWithPlaces = [];
      for (const name of wishlistNames) {
        try {
          const places = await getWishlist(name);
          wishlistsWithPlaces.push({ name, places });
        } catch {
          wishlistsWithPlaces.push({ name, places: [] });
        }
      }
      setWishlists(wishlistsWithPlaces);
    } catch {
      setWishlistError('Failed to load wishlists. Please try again.');
      setWishlists([]);
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
      setWishlistError(null);
      const wishlist = wishlists.find(wl => wl.name === wishlistName);
      if (wishlist && wishlist.places.includes(result.placeName)) {
        setWishlistError(`"${result.placeName}" is already in this wishlist`);
        setTimeout(() => setWishlistError(null), 3000);
        return;
      }
      await addToWishlist(wishlistName, result.placeName);
      const updatedWishlists = wishlists.map(wl => {
        if (wl.name === wishlistName) {
          return { ...wl, places: [...wl.places, result.placeName] };
        }
        return wl;
      });
      setWishlists(updatedWishlists);
      setWishlistSuccess(`"${result.placeName}" has been added to "${wishlistName}"`);
      setTimeout(() => setWishlistSuccess(null), 3000);
      if (selectedWishlist && selectedWishlist.name === wishlistName) {
        setSelectedWishlist({
          ...selectedWishlist,
          places: [...selectedWishlist.places, result.placeName]
        });
      }
    } catch {
      setWishlistError('Failed to add to wishlist. Please try again.');
    }
  };

  const handleCreateWishlist = async () => {
    if (!newWishlistName.trim()) {
      setWishlistError('Please enter a wishlist name');
      return;
    }
    try {
      await createWishlist(newWishlistName);
      setWishlists([...wishlists, { name: newWishlistName, places: [] }]);
      setNewWishlistName('');
      setWishlistError(null);
      setWishlistSuccess(`Wishlist "${newWishlistName}" created successfully!`);
      setTimeout(() => setWishlistSuccess(null), 3000);
    } catch {
      setWishlistError('Failed to create wishlist. The name might already exist.');
    }
  };

  const handleViewWishlist = (wishlist: {name: string, places: string[]}) => {
    setWishlistError(null);
    setWishlistSuccess(null);
    setSelectedWishlist(wishlist);
  };

  const handleBackToWishlists = () => {
    setSelectedWishlist(null);
  };

  const handleRemoveFromWishlist = async (wishlistName: string, placeName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${placeName}" from this wishlist?`)) {
      return;
    }
    try {
      await removeFromWishlist(wishlistName, placeName);
      const updatedWishlists = wishlists.map(wl => {
        if (wl.name === wishlistName) {
          return { ...wl, places: wl.places.filter(p => p !== placeName) };
        }
        return wl;
      });
      setWishlists(updatedWishlists);
      if (selectedWishlist && selectedWishlist.name === wishlistName) {
        setSelectedWishlist({
          ...selectedWishlist,
          places: selectedWishlist.places.filter(p => p !== placeName)
        });
      }
      setWishlistSuccess(`Successfully removed "${placeName}" from "${wishlistName}"`);
      setTimeout(() => setWishlistSuccess(null), 3000);
    } catch {
      setWishlistError(`Failed to remove "${placeName}" from "${wishlistName}". Please try again.`);
      setTimeout(() => setWishlistError(null), 3000);
    }
  };

  const handleDeleteWishlist = (wishlistName: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Wishlist',
      message: `Are you sure you want to delete the wishlist "${wishlistName}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteWishlist(wishlistName);
          setWishlists(wishlists.filter(wl => wl.name !== wishlistName));
          if (selectedWishlist && selectedWishlist.name === wishlistName) {
            setSelectedWishlist(null);
          }
          setWishlistSuccess(`Wishlist "${wishlistName}" has been deleted`);
          setTimeout(() => setWishlistSuccess(null), 3000);
        } catch {
          setWishlistError('Failed to delete wishlist. Please try again.');
          setTimeout(() => setWishlistError(null), 3000);
        }
      }
    });
  };

  const handleCloseDialog = () => {
    setWishlistDialogOpen(false);
    setSelectedWishlist(null);
    setWishlistError(null);
    setWishlistSuccess(null);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  };

  if (showItineraryPage && currentWishlist) {
    return (
        <ItineraryPage
            wishlistName={currentWishlist.name}
            onBack={handleBackFromItinerary}
        />
    );
  }

  return (
      <>
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div">
              Image Place Recognition
            </Typography>
            <IconButton
                color="inherit"
                onClick={() => setWishlistDialogOpen(true)}
                aria-label="View wishlists"
            >
              <Badge badgeContent={totalPlaces} color="error">
                <FavoriteIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Discover Places
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
                {selectedFile ? 'Choose Another Image' : 'Choose Image'}
                <VisuallyHiddenInput
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />
              </Button>
              {selectedFile && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Uploaded preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    />
                  </Box>
              )}
            </Box>
            {selectedFile && !result && (
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
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
            )}
            {result && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6">Detected Place: {result.placeName}</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<BookmarkAddIcon />}
                        onClick={async () => {
                          await loadWishlists();
                          setWishlistDialogOpen(true);
                        }}
                        sx={{ mt: 2 }}
                    >
                      Add to Wishlist
                    </Button>
                  </Box>
                </Box>
            )}
            {/* Wishlist Dialog */}
            <Dialog
                open={wishlistDialogOpen}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
              <DialogTitle>
                <Box display="flex" alignItems="center">
                  {selectedWishlist && (
                      <IconButton
                          edge="start"
                          onClick={handleBackToWishlists}
                          aria-label="back"
                          sx={{ mr: 1 }}
                      >
                        <ArrowBack />
                      </IconButton>
                  )}
                  <Box flexGrow={1}>
                    {selectedWishlist ? selectedWishlist.name : 'My Wishlists'}
                  </Box>
                  <IconButton edge="end" onClick={handleCloseDialog} aria-label="close">
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent>
                {wishlistError && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setWishlistError(null)}>
                      {wishlistError}
                    </Alert>
                )}
                {wishlistSuccess && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setWishlistSuccess(null)}>
                      {wishlistSuccess}
                    </Alert>
                )}
                {selectedWishlist ? (
                    <>
                      {result && (
                          <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Adding to wishlist:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <PlaceIcon color="primary" />
                              <Typography variant="body1">{result.placeName}</Typography>
                              <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleAddToWishlist(selectedWishlist.name)}
                                  sx={{ ml: 'auto' }}
                              >
                                Add here
                              </Button>
                            </Box>
                          </Box>
                      )}
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                        Places in this wishlist:
                      </Typography>
                      <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                        {selectedWishlist.places.length > 0 ? (
                            selectedWishlist.places.map((place, index) => (
                                <React.Fragment key={index}>
                                  <ListItem
                                      secondaryAction={
                                        <IconButton
                                            edge="end"
                                            aria-label="delete"
                                            onClick={() => handleRemoveFromWishlist(selectedWishlist.name, place)}
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      }
                                      disablePadding
                                  >
                                    <ListItemButton>
                                      <ListItemIcon>
                                        <PlaceIcon color="primary" />
                                      </ListItemIcon>
                                      <ListItemText primary={place} />
                                    </ListItemButton>
                                  </ListItem>
                                  <Divider />
                                </React.Fragment>
                            ))
                        ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                              No places in this wishlist yet.
                            </Typography>
                        )}
                      </List>
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigateToItinerary(selectedWishlist)}
                            sx={{ mt: 2 }}
                        >
                          Prepare Itinerary
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteWishlist(selectedWishlist.name)}
                            sx={{ mt: 2 }}
                        >
                          Delete Wishlist
                        </Button>
                      </Box>
                    </>
                ) : (
                    <>
                      <List>
                        {wishlists.length > 0 ? (
                            wishlists.map((wishlist) => (
                                <div key={wishlist.name}>
                                  <ListItem
                                      secondaryAction={
                                        <IconButton
                                            edge="end"
                                            aria-label="delete"
                                            onClick={() => handleDeleteWishlist(wishlist.name)}
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      }
                                      disablePadding
                                  >
                                    <ListItemButton onClick={() => handleViewWishlist(wishlist)}>
                                      <ListItemIcon>
                                        <ListAltIcon color="primary" />
                                      </ListItemIcon>
                                      <ListItemText
                                          primary={wishlist.name}
                                          secondary={`${wishlist.places.length} place${wishlist.places.length !== 1 ? 's' : ''}`}
                                      />
                                      <ChevronRight />
                                    </ListItemButton>
                                  </ListItem>
                                  <Divider />
                                </div>
                            ))
                        ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                              No wishlists yet. Create your first one below!
                            </Typography>
                        )}
                      </List>
                      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
                        <Typography variant="h6" gutterBottom>Create New Wishlist</Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                          <TextField
                              fullWidth
                              size="small"
                              label="Wishlist name"
                              value={newWishlistName}
                              onChange={(e) => setNewWishlistName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleCreateWishlist()}
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
                    </>
                )}
              </DialogContent>
            </Dialog>
            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={handleCloseConfirmDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">
                {confirmDialog.title}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  {confirmDialog.message}
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
                <Button
                    onClick={() => {
                      confirmDialog.onConfirm();
                      handleCloseConfirmDialog();
                    }}
                    color="error"
                    autoFocus
                >
                  Confirm
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Container>
      </>
  );
};

export default App;