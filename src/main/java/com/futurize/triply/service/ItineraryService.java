package com.futurize.triply.service;

import com.futurize.triply.model.Itinerary;
import com.futurize.triply.repository.ItineraryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ItineraryService {

    private final ItineraryRepository itineraryRepository;

    @Autowired
    public ItineraryService(ItineraryRepository itineraryRepository) {
        this.itineraryRepository = itineraryRepository;
    }

    public Itinerary createItinerary(Itinerary itinerary) {
        return itineraryRepository.save(itinerary);
    }

    public Optional<Itinerary> getItineraryById(String id) {
        return itineraryRepository.findById(id);
    }

    public List<Itinerary> getItinerariesByPlaceId(String placeId) {
        return itineraryRepository.findByPlaceId(placeId);
    }

    public List<Itinerary> getAllItineraries() {
        return (List<Itinerary>) itineraryRepository.findAll();
    }

    public Itinerary updateItinerary(String id, Itinerary itineraryDetails) {
        return itineraryRepository.findById(id)
                .map(existingItinerary -> {
                    // Update all fields except ID
                    existingItinerary.setPlaceId(itineraryDetails.getPlaceId());
                    existingItinerary.setTitle(itineraryDetails.getTitle());
                    existingItinerary.setTitleDescription(itineraryDetails.getTitleDescription());
                    existingItinerary.setType(itineraryDetails.getType());
                    existingItinerary.setTotalHours(itineraryDetails.getTotalHours());
                    existingItinerary.setFullDescription(itineraryDetails.getFullDescription());
                    existingItinerary.setHighlights(itineraryDetails.getHighlights());
                    existingItinerary.setItinerary(itineraryDetails.getItinerary());
                    existingItinerary.setIncludes(itineraryDetails.getIncludes());
                    existingItinerary.setExcludes(itineraryDetails.getExcludes());
                    existingItinerary.setNotSuitableFor(itineraryDetails.getNotSuitableFor());
                    existingItinerary.setImportantInformation(itineraryDetails.getImportantInformation());
                    existingItinerary.setPrice(itineraryDetails.getPrice());
                    return itineraryRepository.save(existingItinerary);
                })
                .orElseThrow(() -> new RuntimeException("Itinerary not found with id: " + id));
    }

    public void deleteItinerary(String id) {
        itineraryRepository.deleteById(id);
    }
}
