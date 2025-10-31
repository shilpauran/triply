package com.futurize.triply.controller;

import com.futurize.triply.model.Card;
import com.futurize.triply.repository.CardRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/personalized-cards")
public class PersonalizedCardController {

    private final CardRepository cardRepository;

    public PersonalizedCardController(CardRepository cardRepository) {
        this.cardRepository = cardRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getPersonalizedCards() {
        List<Card> cards = cardRepository.findAll();
        List<Map<String, Object>> payload = cards.stream().map(c -> {
            String thumb = null;
            if (c.getThumbnailData() != null && c.getThumbnailData().length > 0 && c.getThumbnailType() != null) {
                thumb = "data:" + c.getThumbnailType() + ";base64," + Base64.getEncoder().encodeToString(c.getThumbnailData());
            }
            java.util.HashMap<String, Object> m = new java.util.HashMap<>();
            m.put("title", c.getTitle());
            m.put("shortDescription", c.getShortDescription());
            m.put("durationDays", c.getDurationDays());
            m.put("thumbnailImage", thumb == null ? "" : thumb);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(payload);
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<Card> createCard(
            @RequestParam("title") String title,
            @RequestParam("shortDescription") String shortDescription,
            @RequestParam("durationDays") String durationDays,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail
    ) {
        try {
            // Create a new entity without setting the id so Couchbase generates it
            Card toSave = new Card();
            toSave.setTitle(title);
            toSave.setShortDescription(shortDescription);
            toSave.setDurationDays(durationDays);
            if (thumbnail != null && !thumbnail.isEmpty()) {
                toSave.setThumbnailData(thumbnail.getBytes());
                toSave.setThumbnailType(thumbnail.getContentType());
            }
            Card saved = cardRepository.save(toSave);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
