package com.futurize.triply.controller;

import com.futurize.triply.model.Wishlist;
import com.futurize.triply.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.ArrayList;
import java.util.HashMap;

@RestController
@RequestMapping("/api/wishlists")
public class WishlistController {

    private final WishlistService wishlistService;

    @Autowired
    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public ResponseEntity<?> getAllWishlists() {
        try {
            return ResponseEntity.ok(wishlistService.getAllWishlistNames());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Failed to fetch wishlists: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<Wishlist> createWishlist(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        if (name == null || name.trim().isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        
        try {
            Wishlist wishlist = wishlistService.createWishlist(name);
            return new ResponseEntity<>(wishlist, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
    }

    @GetMapping("/{name}")
    public ResponseEntity<Set<String>> getWishlist(@PathVariable String name) {
        try {
            Set<String> places = wishlistService.getWishlistPlaces(name);
            return ResponseEntity.ok(places);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // New endpoint returning place details (placeName, imageUrl, description)
    @GetMapping("/{name}/details")
    public ResponseEntity<List<Map<String, String>>> getWishlistDetails(@PathVariable String name) {
        try {
            Wishlist wishlist = wishlistService.getWishlist(name);
            List<Map<String, String>> details = new ArrayList<>();
            for (String place : wishlist.getPlaceNames()) {
                Map<String, String> item = new HashMap<>();
                item.put("placeName", place);
                String imageUrl = wishlist.getPlaceImageUrls() != null ? wishlist.getPlaceImageUrls().get(place) : null;
                String description = wishlist.getPlaceDescriptions() != null ? wishlist.getPlaceDescriptions().get(place) : null;
                String imageBase64 = wishlist.getPlaceImageBase64() != null ? wishlist.getPlaceImageBase64().get(place) : null;
                String imageType = wishlist.getPlaceImageTypes() != null ? wishlist.getPlaceImageTypes().get(place) : null;
                if (imageUrl != null) item.put("imageUrl", imageUrl);
                if (description != null) item.put("description", description);
                if (imageBase64 != null) item.put("imageBase64", imageBase64);
                if (imageType != null) item.put("imageType", imageType);
                details.add(item);
            }
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{name}/places")
    public ResponseEntity<Wishlist> addToWishlist(
            @PathVariable String name,
            @RequestBody Map<String, String> request) {
        
        String placeName = request.get("placeName");
        String imageUrl = request.get("imageUrl");
        String description = request.get("description");
        String imageBase64 = request.get("imageBase64");
        String imageType = request.get("imageType");
        if (placeName == null || placeName.trim().isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        
        try {
            Wishlist wishlist;
            if ((imageBase64 != null && !imageBase64.trim().isEmpty()) || (imageType != null && !imageType.trim().isEmpty())) {
                wishlist = wishlistService.addPlaceToWishlist(name, placeName, imageUrl, description, imageBase64, imageType);
            } else if ((imageUrl != null && !imageUrl.trim().isEmpty()) || (description != null && !description.trim().isEmpty())) {
                wishlist = wishlistService.addPlaceToWishlist(name, placeName, imageUrl, description);
            } else {
                wishlist = wishlistService.addPlaceToWishlist(name, placeName);
            }
            return ResponseEntity.ok(wishlist);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{name}/places/{placeName}")
    public ResponseEntity<Void> removeFromWishlist(
            @PathVariable String name,
            @PathVariable String placeName) {
        
        try {
            wishlistService.removePlaceFromWishlist(name, placeName);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{name}")
    public ResponseEntity<Void> deleteWishlist(@PathVariable String name) {
        try {
            wishlistService.deleteWishlist(name);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}
