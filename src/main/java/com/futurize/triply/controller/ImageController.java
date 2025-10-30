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
import java.util.Base64;

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
            @RequestParam("placeName") String placeName,
            @RequestParam("url") String url,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "iconFile", required = false) MultipartFile iconFile) {
        try {
            ImageData savedImage = imageService.uploadImage(file, placeName, url, description, iconFile);
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

    @GetMapping("/by-url")
    public ResponseEntity<?> getImageByUrl(@RequestParam("url") String url) {
        Optional<ImageData> opt = imageService.getImageByUrl(url);
        if (opt.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        ImageData image = opt.get();
        Map<String, Object> body = new HashMap<>();
        body.put("placeName", image.getPlaceName());
        body.put("description", image.getDescription());
        body.put("fileType", image.getFileType());
        body.put("size", image.getSize());
        body.put("imageBase64", Base64.getEncoder().encodeToString(image.getData()));
        if (image.getIconFile() != null) {
            body.put("iconBase64", Base64.getEncoder().encodeToString(image.getIconFile()));
        }
        return new ResponseEntity<>(body, HttpStatus.OK);
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
                if (existingImage.get().getFileType() != null) {
                    response.put("fileType", existingImage.get().getFileType());
                }
                if (existingImage.get().getUrl() != null) {
                    response.put("url", existingImage.get().getUrl());
                }
                if (existingImage.get().getDescription() != null) {
                    response.put("description", existingImage.get().getDescription());
                }
                if (existingImage.get().getIconFile() != null) {
                    response.put("iconBase64", Base64.getEncoder().encodeToString(existingImage.get().getIconFile()));
                }
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

