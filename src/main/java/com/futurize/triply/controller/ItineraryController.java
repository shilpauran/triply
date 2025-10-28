package com.futurize.triply.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futurize.triply.model.Itinerary;
import com.futurize.triply.service.ItineraryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/itineraries")
public class ItineraryController {

    private final ItineraryService itineraryService;
    private final ObjectMapper objectMapper;

    @Autowired
    public ItineraryController(ItineraryService itineraryService,
                             ObjectMapper objectMapper) {
        this.itineraryService = itineraryService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Itinerary> createItinerary(
            @RequestPart("itinerary") String itineraryJson,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail) {
        try {
            // Parse the JSON string to Itinerary object
            Itinerary itinerary = objectMapper.readValue(itineraryJson, Itinerary.class);
            
            // Handle the uploaded file
            if (thumbnail != null && !thumbnail.isEmpty()) {
                // Store the file data directly in Couchbase
                itinerary.setThumbnailImage(thumbnail.getBytes());
                // Optionally store the content type if needed
                // itinerary.setThumbnailContentType(thumbnail.getContentType());
            }
            
            Itinerary created = itineraryService.createItinerary(itinerary);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (IOException e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<byte[]> getItineraryThumbnail(@PathVariable String id) {
        Optional<Itinerary> optionalItinerary = itineraryService.getItineraryById(id);
        if (optionalItinerary.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Itinerary itinerary = optionalItinerary.get();
        if (itinerary.getThumbnailImage() == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(itinerary.getThumbnailImage());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Itinerary> getItineraryById(@PathVariable String id) {
        return itineraryService.getItineraryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/place/{placeId}")
    public ResponseEntity<List<Itinerary>> getItinerariesByPlaceId(@PathVariable String placeId) {
        List<Itinerary> itineraries = itineraryService.getItinerariesByPlaceId(placeId);
        return ResponseEntity.ok(itineraries);
    }

    @GetMapping
    public ResponseEntity<List<Itinerary>> getAllItineraries() {
        List<Itinerary> itineraries = itineraryService.getAllItineraries();
        return ResponseEntity.ok(itineraries);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Itinerary> updateItinerary(
            @PathVariable String id,
            @RequestBody Itinerary itinerary) {
        return ResponseEntity.ok(itineraryService.updateItinerary(id, itinerary));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItinerary(@PathVariable String id) {
        itineraryService.deleteItinerary(id);
        return ResponseEntity.noContent().build();
    }
}
