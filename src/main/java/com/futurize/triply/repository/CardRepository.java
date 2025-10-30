package com.futurize.triply.repository;

import com.futurize.triply.model.Card;
import org.springframework.data.couchbase.repository.CouchbaseRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CardRepository extends CouchbaseRepository<Card, String> {
}
