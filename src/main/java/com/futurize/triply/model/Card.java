package com.futurize.triply.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.couchbase.core.mapping.Document;
import org.springframework.data.couchbase.core.mapping.id.GeneratedValue;
import org.springframework.data.couchbase.core.mapping.id.GenerationStrategy;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document
public class Card {
    @Id
    @GeneratedValue(strategy = GenerationStrategy.UNIQUE, delimiter = "::")
    private String id;
    private String title;
    private String shortDescription;
    // duration can be free-form text (e.g., "3 days", "1 week")
    private String durationDays;
    // Thumbnail image bytes and metadata
    private byte[] thumbnailData;
    private String thumbnailType; // e.g., image/jpeg
}
