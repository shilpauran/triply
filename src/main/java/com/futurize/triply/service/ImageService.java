package com.futurize.triply.service;

import com.futurize.triply.model.ImageData;
import com.futurize.triply.repository.ImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class ImageService {

    private final ImageRepository imageRepository;

    @Autowired
    public ImageService(ImageRepository imageRepository) {
        this.imageRepository = imageRepository;
    }

    public ImageData uploadImage(MultipartFile file, String placeName) throws IOException {
        ImageData imageData = new ImageData();
        imageData.setFileName(file.getOriginalFilename());
        imageData.setFileType(file.getContentType());
        imageData.setData(file.getBytes());
        imageData.setSize(file.getSize());
        imageData.setPlaceName(placeName);
        
        return imageRepository.save(imageData);
    }

    public Optional<ImageData> getImage(String id) {
        return imageRepository.findById(id);
    }

    public List<ImageData> getAllImages() {
        return imageRepository.findAll();
    }

    public void deleteImage(String id) {
        imageRepository.deleteById(id);
    }
    
    public Optional<ImageData> findSimilarImage(byte[] imageData) {
        // Get all images (for small datasets)
        List<ImageData> allImages = imageRepository.findAll();
        
        // Simple byte-by-byte comparison (for exact matches)
        for (ImageData existingImage : allImages) {
            if (java.util.Arrays.equals(existingImage.getData(), imageData)) {
                return Optional.of(existingImage);
            }
        }
        return Optional.empty();
    }
}
