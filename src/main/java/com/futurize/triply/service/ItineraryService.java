package com.futurize.triply.service;

import com.futurize.triply.model.Itinerary;
import com.futurize.triply.repository.ItineraryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ItineraryService {

    @Autowired
    private ItineraryRepository itineraryRepository;

    public String getItinerary(String placeName) {
        Optional<Itinerary> itinerary = itineraryRepository.findByPlaceName(placeName);
        return itinerary.map(Itinerary::getDescription)
                      .orElse("No itinerary found for " + placeName);
    }
}
