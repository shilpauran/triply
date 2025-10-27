package com.futurize.triply.service;

import com.futurize.triply.exception.ResourceAlreadyExistsException;
import com.futurize.triply.exception.ResourceNotFoundException;
import com.futurize.triply.model.Wishlist;
import com.futurize.triply.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class WishlistService {

    private final WishlistRepository wishlistRepository;

    @Autowired
    public WishlistService(WishlistRepository wishlistRepository) {
        this.wishlistRepository = wishlistRepository;
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(WishlistService.class);

    public List<String> getAllWishlistNames() {
        try {
            log.info("Fetching all wishlist names");
            List<String> names = wishlistRepository.findAllWishlistNames();
            log.info("Found {} wishlists", names.size());
            return names;
        } catch (Exception e) {
            log.error("Error fetching wishlist names", e);
            throw new RuntimeException("Failed to fetch wishlist names", e);
        }
    }

    public Wishlist createWishlist(String name) {
        if (wishlistRepository.existsByName(name)) {
            throw new ResourceAlreadyExistsException("Wishlist with this name already exists");
        }

        Wishlist wishlist = new Wishlist();
        wishlist.setName(name);
        return wishlistRepository.save(wishlist);
    }

    public Wishlist getWishlist(String name) {
        return wishlistRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist not found"));
    }

    public Set<String> getWishlistPlaces(String name) {
        return wishlistRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist not found"))
                .getPlaceNames();
    }

    public Wishlist addPlaceToWishlist(String name, String placeName) {
        Wishlist wishlist = wishlistRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist not found"));

        wishlist.addPlace(placeName);
        return wishlistRepository.save(wishlist);
    }

    public void removePlaceFromWishlist(String name, String placeName) {
        Wishlist wishlist = wishlistRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist not found"));

        wishlist.removePlace(placeName);
        wishlistRepository.save(wishlist);
    }

    public void deleteWishlist(String name) {
        Wishlist wishlist = wishlistRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist not found"));
        wishlistRepository.delete(wishlist);
    }
}