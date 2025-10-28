import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Calculate total places in all wishlists
  const totalPlaces = wishlists.reduce((sum, wl) => sum + wl.places.length, 0);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {
      // This is a no-op function that will be overridden
    }
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
      console.log('Fetching wishlists...');
      const wishlistNames = await getAllWishlists();
      console.log('Received wishlist names:', wishlistNames);

      // Ensure wishlistNames is an array
      if (!Array.isArray(wishlistNames)) {
        console.error('Expected wishlistNames to be an array, got:', wishlistNames);
        setWishlists([]);
        return;
      }

      // For each wishlist name, fetch its places
      const wishlistsWithPlaces = [];
      for (const name of wishlistNames) {
        try {
          const places = await getWishlist(name);
          wishlistsWithPlaces.push({ name, places });
        } catch (err) {
          console.error(`Failed to load places for wishlist ${name}:`, err);
          // Continue with other wishlists even if one fails
          wishlistsWithPlaces.push({ name, places: [] });
        }
      }

      console.log('Fetched wishlists with places:', wishlistsWithPlaces);
      setWishlists(wishlistsWithPlaces);
    } catch (err) {
      console.error('Failed to load wishlists:', err);
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
      // Clear any previous messages
      setWishlistError(null);

      // Check if the place is already in this wishlist
      const wishlist = wishlists.find(wl => wl.name === wishlistName);
      if (wishlist && wishlist.places.includes(result.placeName)) {
        setWishlistError(`"${result.placeName}" is already in this wishlist`);
        setTimeout(() => setWishlistError(null), 3000);
        return;
      }

      await addToWishlist(wishlistName, result.placeName);

      // Update the local state
      const updatedWishlists = wishlists.map(wl => {
        if (wl.name === wishlistName) {
          return {
            ...wl,
            places: [...wl.places, result.placeName]
          };
        }
        return wl;
      });

      setWishlists(updatedWishlists);
      setWishlistSuccess(`"${result.placeName}" has been added to "${wishlistName}"`);
      setTimeout(() => setWishlistSuccess(null), 3000);

      // Update the selected wishlist if it's currently being viewed
      if (selectedWishlist && selectedWishlist.name === wishlistName) {
        const updatedWishlist = {
          ...selectedWishlist,
          places: [...selectedWishlist.places, result.placeName]
        };
        setSelectedWishlist(updatedWishlist);
      }
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

      // Add the new wishlist to local state
      const newWishlist = { name: newWishlistName, places: [] };
      setWishlists([...wishlists, newWishlist]);

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

  const handleViewWishlist = (wishlist: {name: string, places: string[]}) => {
    // Don't show any error when just viewing the wishlist
    setWishlistError(null);
    setWishlistSuccess(null);
    setSelectedWishlist(wishlist);
  };

  const handleBackToWishlists = () => {
    setSelectedWishlist(null);
  };

  const handleRemoveFromWishlist = async (wishlistName: string, placeName: string) => {
    console.log('Removing', placeName, 'from', wishlistName);
    if (!window.confirm(`Are you sure you want to remove "${placeName}" from this wishlist?`)) {
      return;
    }

    try {
      // Make the API call to remove the place from the wishlist
      await removeFromWishlist(wishlistName, placeName);

      // Update the wishlists state
      const updatedWishlists = wishlists.map(wl => {
        if (wl.name === wishlistName) {
          return {
            ...wl,
            places: wl.places.filter(p => p !== placeName)
          };
        }
        return wl;
      });

      setWishlists(updatedWishlists);

      // Update the selected wishlist if it's currently being viewed
      if (selectedWishlist && selectedWishlist.name === wishlistName) {
        const updatedSelectedWishlist = {
          ...selectedWishlist,
          places: selectedWishlist.places.filter(p => p !== placeName)
        };
        setSelectedWishlist(updatedSelectedWishlist);
      }

      // Show success message
      setWishlistSuccess(`Successfully removed "${placeName}" from "${wishlistName}"`);
      setTimeout(() => setWishlistSuccess(null), 3000);

    } catch (error) {
      console.error('Error removing place from wishlist:', error);
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

          // Update local state
          const updatedWishlists = wishlists.filter(wl => wl.name !== wishlistName);
          setWishlists(updatedWishlists);

          // Clear selected wishlist if it's the one being deleted
          if (selectedWishlist && selectedWishlist.name === wishlistName) {
            setSelectedWishlist(null);
          }

          setWishlistSuccess(`Wishlist "${wishlistName}" has been deleted`);
          setTimeout(() => setWishlistSuccess(null), 3000);
        } catch (err) {
          console.error('Error deleting wishlist:', err);
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
                <Alert severity="error" sx={{ mt: 2 }}>
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
                    // Wishlist details view
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
                                            color="error"
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
                                  {index < selectedWishlist.places.length - 1 && <Divider />}
                                </React.Fragment>
                            ))
                        ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                              No places in this wishlist yet.
                            </Typography>
                        )}
                      </List>
                      {selectedWishlist && (
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                  // TODO: Add prepare itinerary functionality
                                  console.log('Prepare itinerary for:', selectedWishlist.name);
                                }}
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
                      )}
                    </>
                ) : (
                    // Wishlist list view
                    <>
                      <List>
                        {wishlists.length > 0 ? (
                            wishlists.map((wishlist) => (
                                <div key={wishlist.name}>
                                  <ListItem
                                      secondaryAction={
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                          <Button
                                              variant="contained"
                                              size="small"
                                              color="primary"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // TODO: Add prepare itinerary functionality
                                                console.log('Prepare itinerary for:', wishlist.name);
                                              }}
                                          >
                                            Prepare Itinerary
                                          </Button>
                                          <IconButton
                                              edge="end"
                                              aria-label="delete"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteWishlist(wishlist.name);
                                              }}
                                              color="error"
                                          >
                                            <DeleteIcon />
                                          </IconButton>
                                        </Box>
                                      }
                                      disablePadding
                                  >
                                    <ListItemButton onClick={() => handleViewWishlist(wishlist)}>
                                      <ListItemIcon>
                                      </ListItemIcon>
                                      <ListItemText
                                          primary={wishlist.name}
                                          secondary={`${wishlist.places.length} ${wishlist.places.length === 1 ? 'place' : 'places'}`}
                                      />
                                      <ChevronRight color="action" />
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
}

export default App;