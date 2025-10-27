package com.futurize.triply.controller;

import com.futurize.triply.model.ImageData;
import com.futurize.triply.service.ImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final ImageService imageService;

    @Autowired
    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<ImageData> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("placeName") String placeName) {
        try {
            ImageData savedImage = imageService.uploadImage(file, placeName);
            return new ResponseEntity<>(savedImage, HttpStatus.CREATED);
        } catch (IOException e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getImage(@PathVariable String id) {
        return imageService.getImage(id)
                .map(image -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(image.getFileType()));
                    headers.setContentLength(image.getSize());
                    return new ResponseEntity<>(image.getData(), headers, HttpStatus.OK);
                })
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public ResponseEntity<List<ImageData>> getAllImages() {
        List<ImageData> images = imageService.getAllImages();
        return new ResponseEntity<>(images, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable String id) {
        imageService.deleteImage(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    @PostMapping("/check")
    public ResponseEntity<?> checkImage(@RequestParam("file") MultipartFile file) {
        try {
            byte[] imageData = file.getBytes();
            Optional<ImageData> existingImage = imageService.findSimilarImage(imageData);
            
            if (existingImage.isPresent()) {
                // Return the place name if a matching image is found
                Map<String, String> response = new HashMap<>();
                response.put("status", "found");
                response.put("placeName", existingImage.get().getPlaceName());
                response.put("imageId", existingImage.get().getId());
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                Map<String, String> response = new HashMap<>();
                response.put("status", "not_found");
                response.put("message", "No matching image found in the database");
                return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
            }
        } catch (IOException e) {
            return new ResponseEntity<>(
                Collections.singletonMap("error", "Failed to process the image"), 
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
