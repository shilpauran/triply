package com.futurize.triply.controller;

import com.futurize.triply.service.ItineraryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
public class ItineraryController {

    @Autowired
    private ItineraryService itineraryService;

    @GetMapping("/api/itinerary")
    public String getItinerary(@RequestParam String placeName) {
        return itineraryService.getItinerary(placeName);
    }
}
