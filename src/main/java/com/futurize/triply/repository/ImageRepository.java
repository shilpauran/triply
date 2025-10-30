package com.futurize.triply.repository;

import com.futurize.triply.model.ImageData;
import org.springframework.data.couchbase.repository.CouchbaseRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImageRepository extends CouchbaseRepository<ImageData, String> {
    
    // Find all images for a specific place
    List<ImageData> findByPlaceName(String placeName);
    
    // Count images for a specific place
    long countByPlaceName(String placeName);

    // Find a single image by its unique URL
    Optional<ImageData> findByUrl(String url);
}
