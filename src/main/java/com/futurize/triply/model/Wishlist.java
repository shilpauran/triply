package com.futurize.triply.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.couchbase.core.mapping.Document;
import org.springframework.data.couchbase.core.mapping.Field;
import org.springframework.data.couchbase.core.mapping.id.GeneratedValue;
import org.springframework.data.couchbase.core.mapping.id.GenerationStrategy;
import org.springframework.data.annotation.TypeAlias;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;
import java.util.HashMap;
import java.util.Map;

@Document
@Data
@TypeAlias("com.futurize.triply.model.Wishlist")
public class Wishlist {
    
    @Id
    @GeneratedValue(strategy = GenerationStrategy.UNIQUE, delimiter = "::")
    private String id;
    
    @Field
    private String name;
    
    @Field
    private Set<String> placeNames = new HashSet<>();

    // Optional metadata: map placeName -> image URL
    @Field
    private Map<String, String> placeImageUrls = new HashMap<>();

    // Optional metadata: map placeName -> description
    @Field
    private Map<String, String> placeDescriptions = new HashMap<>();

    // Optional metadata: map placeName -> image Base64 (actual image content)
    @Field
    private Map<String, String> placeImageBase64 = new HashMap<>();

    // Optional metadata: map placeName -> image mime type (e.g., image/jpeg)
    @Field
    private Map<String, String> placeImageTypes = new HashMap<>();
    
    public void addPlace(String placeName) {
        this.placeNames.add(placeName);
    }
    public void addPlace(String placeName, String imageUrl, String description) {
        this.placeNames.add(placeName);
        if (imageUrl != null && !imageUrl.isEmpty()) {
            this.placeImageUrls.put(placeName, imageUrl);
        }
        if (description != null && !description.isEmpty()) {
            this.placeDescriptions.put(placeName, description);
        }
    }
    public void addPlace(String placeName, String imageUrl, String description, String imageBase64, String imageType) {
        addPlace(placeName, imageUrl, description);
        if (imageBase64 != null && !imageBase64.isEmpty()) {
            this.placeImageBase64.put(placeName, imageBase64);
        }
        if (imageType != null && !imageType.isEmpty()) {
            this.placeImageTypes.put(placeName, imageType);
        }
    }
    
    public void removePlace(String placeName) {
        this.placeNames.remove(placeName);
        this.placeImageUrls.remove(placeName);
        this.placeDescriptions.remove(placeName);
        this.placeImageBase64.remove(placeName);
        this.placeImageTypes.remove(placeName);
    }
    
    public Set<String> getPlaceNames() {
        return placeNames;
    }
}

