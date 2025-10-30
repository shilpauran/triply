package com.futurize.triply.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.couchbase.core.mapping.Document;
import org.springframework.data.couchbase.core.mapping.id.GeneratedValue;
import org.springframework.data.couchbase.core.mapping.id.GenerationStrategy;
import lombok.Data;

import java.time.Instant;

@Document
@Data
public class ImageData {
    @Id
    @GeneratedValue(strategy = GenerationStrategy.UNIQUE, delimiter = "::")
    private String id;
    private String fileName;
    private String fileType;
    private byte[] data;
    private long size;
    private Instant uploadedAt;
    private String placeName;
    private String url;
    private String description;
    // Icon image to be used in wishlists
    private byte[] iconFile;
    
    public ImageData() {
        this.uploadedAt = Instant.now();
    }
}
