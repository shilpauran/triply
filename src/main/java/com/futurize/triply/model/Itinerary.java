package com.futurize.triply.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.couchbase.core.mapping.Document;
import lombok.Data;

@Document
@Data
public class Itinerary {
    @Id
    private String id;
    private String placeName;
    private String description;
}
