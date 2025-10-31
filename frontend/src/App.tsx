import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import ItineraryPage from './pages/ItineraryPage';
import WishlistDetailsPage from './pages/WishlistDetailsPage';
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
  Toolbar,
  InputAdornment,
  Tooltip
} from '@mui/material';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PlaceIcon from '@mui/icons-material/Place';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ArrowBack from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { checkImage, type CheckImageResponse } from './services/api';
import { getImageByUrl, ImageByUrlResponse, getImage } from './services/api';
import { createWishlist, getAllWishlists, addToWishlist, getWishlist, removeFromWishlist, deleteWishlist, getWishlistDetails, type WishlistItemDetail } from './services/wishlistService';

const App: React.FC = () => {
  const navigate = useNavigate();
  // URL search states
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [displayImageSrc, setDisplayImageSrc] = useState<string | null>(null);
  const [displayMeta, setDisplayMeta] = useState<{ placeName: string; description?: string } | null>(null);
  const [lastByUrlData, setLastByUrlData] = useState<ImageByUrlResponse | null>(null);
  const [lastCheckedImage, setLastCheckedImage] = useState<{ base64?: string; type?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CheckImageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Upload helpers
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Wishlist states
  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false);
  const [wishlists, setWishlists] = useState<{name: string, places: string[]}[]>([]);
  const [selectedWishlist, setSelectedWishlist] = useState<{name: string, places: string[]} | null>(null);
  const [selectedWishlistDetails, setSelectedWishlistDetails] = useState<WishlistItemDetail[] | null>(null);
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

  const handleSearch = useCallback(async () => {
    if (!imageUrlInput.trim()) {
      setError('Please enter an image URL');
      return;
    }
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    setDisplayMeta(null);
    setLastByUrlData(null);
    try {
      const data: ImageByUrlResponse = await getImageByUrl(imageUrlInput.trim());
      const src = `data:${data.fileType};base64,${data.imageBase64}`;
      setDisplayImageSrc(src);
      setDisplayMeta({ placeName: data.placeName, description: data.description });
      setLastByUrlData(data);
    } catch (e) {
      setDisplayImageSrc(null);
      setDisplayMeta(null);
      setError('Image not found for the given URL');
    } finally {
      setIsLoading(false);
    }
  }, [imageUrlInput]);

  const handleSubmit = useCallback(async () => {}, []);

  const handleOpenFilePicker = useCallback(() => {
    setError(null);
    setSuccess(null);
    fileInputRef.current?.click();
  }, []);

  const handleFileChosen = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    // reset input value to allow same file selection again
    e.currentTarget.value = '';
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await checkImage(file);
      if (!imageUrlInput.trim()) {
        // Make upload behave like the URL search flow when no URL is entered
        if (response.status === 'found') {
          // If we have a URL, fetch full image and meta like handleSearch
          if (response.url) {
            try {
              const data = await getImageByUrl(response.url);
              const src = `data:${data.fileType};base64,${data.imageBase64}`;
              setDisplayImageSrc(src);
              setDisplayMeta({ placeName: data.placeName, description: data.description });
              setLastByUrlData(data);
              setImageUrlInput(response.url);
            } catch {
              // Fallback to using available response/icon or image bytes
              if (response.iconBase64 && response.fileType) {
                setDisplayImageSrc(`data:${response.fileType};base64,${response.iconBase64}`);
                setDisplayMeta({ placeName: response.placeName || '', description: response.description });
                setLastCheckedImage({ base64: response.iconBase64, type: response.fileType });
              } else if (response.imageId) {
                try {
                  const dataUrl = await getImage(response.imageId);
                  setDisplayImageSrc(dataUrl);
                  const commaIdx = dataUrl.indexOf(',');
                  const semiIdx = dataUrl.indexOf(';');
                  const type = dataUrl.substring(5, semiIdx);
                  const base64 = dataUrl.substring(commaIdx + 1);
                  setLastCheckedImage({ base64, type });
                  setDisplayMeta({ placeName: response.placeName || '', description: response.description });
                } catch {
                  setDisplayImageSrc(null);
                  setDisplayMeta(null);
                  setLastCheckedImage(null);
                }
              } else {
                setDisplayImageSrc(null);
                setDisplayMeta(null);
                setLastCheckedImage(null);
              }
            }
          } else if (response.iconBase64 && response.fileType) {
            // No URL: still render like search using the available image/icon
            setDisplayImageSrc(`data:${response.fileType};base64,${response.iconBase64}`);
            setDisplayMeta({ placeName: response.placeName || '', description: response.description });
            setLastCheckedImage({ base64: response.iconBase64, type: response.fileType });
            setLastByUrlData(null);
          } else if (response.imageId) {
            try {
              const dataUrl = await getImage(response.imageId);
              setDisplayImageSrc(dataUrl);
              const commaIdx = dataUrl.indexOf(',');
              const semiIdx = dataUrl.indexOf(';');
              const type = dataUrl.substring(5, semiIdx);
              const base64 = dataUrl.substring(commaIdx + 1);
              setLastCheckedImage({ base64, type });
              setDisplayMeta({ placeName: response.placeName || '', description: response.description });
              setLastByUrlData(null);
            } catch {
              setDisplayImageSrc(null);
              setDisplayMeta(null);
              setLastCheckedImage(null);
              setLastByUrlData(null);
            }
          } else {
            setDisplayImageSrc(null);
            setDisplayMeta(null);
            setLastCheckedImage(null);
            setLastByUrlData(null);
          }
          // Hide the detection-specific result section for consistency with search view
          setResult(null);
          setSuccess(null);
        } else {
          // Not found -> match search behavior
          setDisplayImageSrc(null);
          setDisplayMeta(null);
          setLastCheckedImage(null);
          setLastByUrlData(null);
          setResult(null);
          setError('Image not found for the given URL');
        }
      } else {
        // URL input has text: keep original detection behavior
        if (response.status === 'found') {
          setResult(response);
          // Prefer iconBase64 from response; otherwise, if found by ID, fetch bytes
          if (response.iconBase64 && response.fileType) {
            setLastCheckedImage({ base64: response.iconBase64, type: response.fileType });
          } else if (response.imageId) {
            try {
              const dataUrl = await getImage(response.imageId);
              const commaIdx = dataUrl.indexOf(',');
              const semiIdx = dataUrl.indexOf(';');
              const type = dataUrl.substring(5, semiIdx);
              const base64 = dataUrl.substring(commaIdx + 1);
              setLastCheckedImage({ base64, type });
            } catch {
              setLastCheckedImage(null);
            }
          } else {
            setLastCheckedImage(null);
          }
          setSuccess('Image checked successfully');
        } else {
          setLastCheckedImage(null);
          setResult(null);
          setError('Failed to find a matching image');
        }
      }
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error('Error checking image:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const handleAddToWishlist = async (wishlistName: string, placeNameParam?: string) => {
    const placeName = placeNameParam || (result && result.placeName ? result.placeName : (displayMeta ? displayMeta.placeName : ''));
    if (!placeName) return;
    try {
      setWishlistError(null);
      const wishlist = wishlists.find(wl => wl.name === wishlistName);
      if (wishlist && wishlist.places.includes(placeName)) {
        setWishlistError(`"${placeName}" is already in this wishlist`);
        setTimeout(() => setWishlistError(null), 3000);
        return;
      }
      const imageUrlForAdd = displayMeta ? imageUrlInput.trim() : (result && result.url ? result.url : undefined);
      const descriptionForAdd = displayMeta ? displayMeta.description : (result && result.description ? result.description : undefined);
      const imageBase64ForAdd = lastByUrlData
        ? (lastByUrlData.iconBase64 || lastByUrlData.imageBase64)
        : (lastCheckedImage?.base64 || (result && result.iconBase64 ? result.iconBase64 : undefined));
      const imageTypeForAdd = lastByUrlData
        ? lastByUrlData.fileType
        : (lastCheckedImage?.type || (result && result.fileType ? result.fileType : undefined));
      await addToWishlist(wishlistName, placeName, imageUrlForAdd, descriptionForAdd, imageBase64ForAdd, imageTypeForAdd);
      const updatedWishlists = wishlists.map(wl => {
        if (wl.name === wishlistName) {
          return { ...wl, places: [...wl.places, placeName] };
        }
        return wl;
      });
      setWishlists(updatedWishlists);
      setWishlistSuccess(`"${placeName}" has been added to "${wishlistName}"`);
      setTimeout(() => setWishlistSuccess(null), 3000);
      if (selectedWishlist && selectedWishlist.name === wishlistName) {
        // refresh details to include imageUrl/description
        try {
          const details = await getWishlistDetails(wishlistName);
          setSelectedWishlistDetails(details);
          setSelectedWishlist({
            ...selectedWishlist,
            places: [...selectedWishlist.places, placeName]
          });
        } catch { /* ignore */ }
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
    setWishlistDialogOpen(false);
    navigate(`/wishlist/${encodeURIComponent(wishlist.name)}`);
  };

  const handleBackToWishlists = () => {
    setSelectedWishlist(null);
    setSelectedWishlistDetails(null);
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

  const homeElement = (
      <>
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div">
              Triply
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
              Enter an image URL to view the stored image.
            </Typography>
            <Box sx={{ my: 4 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
                <TextField
                  label="Image URL"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Upload image">
                          <span>
                            <IconButton size="small" onClick={handleOpenFilePicker} disabled={isLoading} aria-label="upload image">
                              <CloudUploadIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                />
                {/* Hidden file input for upload */}
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChosen} />
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={isLoading || !imageUrlInput.trim()}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Search'}
                </Button>
              </Box>
              {displayImageSrc && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img
                    src={displayImageSrc}
                    alt="Fetched from URL"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  {displayMeta && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle1">{displayMeta.placeName}</Typography>
                      {displayMeta.description && (
                        <Typography variant="body2" color="text.secondary">{displayMeta.description}</Typography>
                      )}
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<BookmarkAddIcon />}
                          onClick={async () => {
                            await loadWishlists();
                            setWishlistDialogOpen(true);
                          }}
                          sx={{ mt: 1 }}
                        >
                          Add to Wishlist
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
            {/* Detection flow disabled for URL-based viewing */}
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
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                        Places in this wishlist:
                      </Typography>
                      <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                        {selectedWishlistDetails && selectedWishlistDetails.length > 0 ? (
                          selectedWishlistDetails.map((item, index) => (
                            <React.Fragment key={index}>
                              <ListItem
                                sx={{ pr: 9 }}
                                secondaryAction={
                                  <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    onClick={() => handleRemoveFromWishlist(selectedWishlist.name, item.placeName)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                }
                                disablePadding
                              >
                                <ListItemButton>
                                  <ListItemIcon>
                                    {(() => {
                                      const thumbSrc = item.imageBase64 && item.imageType
                                        ? `data:${item.imageType};base64,${item.imageBase64}`
                                        : (item.imageUrl || undefined);
                                      return thumbSrc ? (
                                        <img
                                          src={thumbSrc}
                                          alt={item.placeName}
                                          style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }}
                                        />
                                      ) : (
                                        <PlaceIcon color="primary" />
                                      );
                                    })()}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={item.placeName}
                                    secondary={item.description}
                                  />
                                </ListItemButton>
                              </ListItem>
                              <Divider />
                            </React.Fragment>
                          ))
                        ) : (
                          selectedWishlist.places.length > 0 ? (
                            selectedWishlist.places.map((place, index) => (
                              <React.Fragment key={index}>
                                <ListItem
                                  sx={{ pr: 9 }}
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
                          )
                        )}
                      </List>
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigateToItinerary(selectedWishlist)}
                            sx={{ mt: 2 }}
                        >
                          Personalize My Itinerary
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
                                      sx={{ pr: 20 }}
                                      secondaryAction={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <IconButton
                                              edge="end"
                                              aria-label="navigate"
                                              onClick={() => handleViewWishlist(wishlist)}
                                          >
                                            <ChevronRight />
                                          </IconButton>
                                          <IconButton
                                              edge="end"
                                              aria-label="delete"
                                              onClick={() => handleDeleteWishlist(wishlist.name)}
                                          >
                                            <DeleteIcon />
                                          </IconButton>
                                        </Box>
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
                                      {(result || displayMeta) && (
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          onClick={(e) => { e.stopPropagation(); handleAddToWishlist(wishlist.name); }}
                                          sx={{ ml: 'auto' }}
                                        >
                                          Add here
                                        </Button>
                                      )}
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

  return (
    <Routes>
      <Route path="/wishlist/:name" element={<WishlistDetailsPage />} />
      <Route path="*" element={homeElement} />
    </Routes>
  );
};

export default App;