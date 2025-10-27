package com.futurize.triply.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.couchbase.core.mapping.Document;
import org.springframework.data.couchbase.core.mapping.Field;
import org.springframework.data.couchbase.core.mapping.id.GeneratedValue;
import org.springframework.data.couchbase.core.mapping.id.GenerationStrategy;
import lombok.Data;

import java.time.LocalDateTime;

@Document
@Data
public class WishlistItem {
    
    @Id
    @GeneratedValue(strategy = GenerationStrategy.UNIQUE, delimiter = "::")
    private String id;
    
    @Field
    private String wishlistName;
    
    @Field
    private String placeId;
    
    @Field
    private String placeName;
    
    @Field
    private String notes;
    
    @Field
    private LocalDateTime addedOn = LocalDateTime.now();
    
    @Field
    private LocalDateTime visitedOn;
    
    @Field
    private boolean visited = false;
    
    public WishlistItem() {}
    
    public WishlistItem(String wishlistName, String placeId, String placeName, String notes) {
        this.wishlistName = wishlistName;
        this.placeId = placeId;
        this.placeName = placeName;
        this.notes = notes;
    }
}
