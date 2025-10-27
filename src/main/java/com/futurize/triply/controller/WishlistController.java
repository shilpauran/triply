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

    @PostMapping("/{name}/places")
    public ResponseEntity<Wishlist> addToWishlist(
            @PathVariable String name,
            @RequestBody Map<String, String> request) {
        
        String placeName = request.get("placeName");
        if (placeName == null || placeName.trim().isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        
        try {
            Wishlist wishlist = wishlistService.addPlaceToWishlist(name, placeName);
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
