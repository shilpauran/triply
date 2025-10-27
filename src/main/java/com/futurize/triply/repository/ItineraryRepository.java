package com.futurize.triply.repository;

import com.futurize.triply.model.Itinerary;
import org.springframework.data.couchbase.repository.CouchbaseRepository;
import org.springframework.data.couchbase.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ItineraryRepository extends CouchbaseRepository<Itinerary, String> {
    @Query("#{#n1ql.selectEntity} WHERE placeName = $1")
    Optional<Itinerary> findByPlaceName(String placeName);
}
