package com.futurize.triply.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.couchbase.core.mapping.Document;
import org.springframework.data.couchbase.core.mapping.Field;
import org.springframework.data.couchbase.core.mapping.id.GeneratedValue;
import org.springframework.data.couchbase.core.mapping.id.GenerationStrategy;
import org.springframework.data.annotation.TypeAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import java.util.List;

@Document
@TypeAlias("com.futurize.triply.model.Itinerary")
@Data
public class Itinerary {
    @Id
    @GeneratedValue(strategy = GenerationStrategy.UNIQUE, delimiter = "::")
    private String id;
    @Field
    private String placeId;
    
    @Field
    private String title;
    
    @Field
    private String titleDescription;
    
    @Field
    private String type; // e.g., guided tour, water activity, day trip
    
    @Field
    private Integer totalHours;
    @Field
    private byte[] thumbnailImage;
    
    // Getter and setter needed for JSON serialization
    public byte[] getThumbnailImage() {
        return thumbnailImage;
    }
    
    public void setThumbnailImage(byte[] thumbnailImage) {
        this.thumbnailImage = thumbnailImage;
    }
    
    private String fullDescription;
    private List<String> highlights;
    private List<ItineraryStep> itinerary;
    private List<String> includes;
    private List<String> excludes;
    private List<String> notSuitableFor;
    private String importantInformation;
    private Double price;
    
    @Data
    public static class ItineraryStep {
        private String title;
        private String description;
        private String stopType;
        private Integer durationMinutes;
    }
}
