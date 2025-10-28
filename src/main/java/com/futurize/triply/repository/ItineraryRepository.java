package com.futurize.triply.repository;

import com.futurize.triply.model.Itinerary;
import org.springframework.data.couchbase.repository.CouchbaseRepository;
import org.springframework.data.couchbase.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItineraryRepository extends CouchbaseRepository<Itinerary, String> {
    @Query("#{#n1ql.selectEntity} WHERE placeId = $1")
    List<Itinerary> findByPlaceId(String placeId);
}
