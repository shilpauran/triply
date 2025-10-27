import React, { useState, useCallback } from 'react';
import { Button, Container, Typography, Box, Paper, CircularProgress, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import { checkImage, ImageData } from './services/api';

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

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
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
          <Box sx={{ mt: 4, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Detection Result
            </Typography>
            <Typography variant="body1">
              <strong>Place Name:</strong> {result.placeName}
            </Typography>
            {result.data && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Processed Image:
                </Typography>
                <img 
                  src={`data:image/jpeg;base64,${result.data}`} 
                  alt="Processed" 
                  style={{ maxWidth: '100%', maxHeight: '300px', marginTop: '10px' }} 
                />
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default App;
