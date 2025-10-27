package com.futurize.triply.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.couchbase.core.mapping.Document;
import org.springframework.data.couchbase.core.mapping.Field;
import org.springframework.data.couchbase.core.mapping.id.GeneratedValue;
import org.springframework.data.couchbase.core.mapping.id.GenerationStrategy;
import org.springframework.data.couchbase.core.mapping.id.IdPrefix;
import org.springframework.data.couchbase.core.mapping.id.IdSuffix;
import org.springframework.data.couchbase.core.mapping.id.IdAttribute;
import org.springframework.data.annotation.TypeAlias;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

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
    
    public void addPlace(String placeName) {
        this.placeNames.add(placeName);
    }
    
    public void removePlace(String placeName) {
        this.placeNames.remove(placeName);
    }
    
    public Set<String> getPlaceNames() {
        return placeNames;
    }
}
