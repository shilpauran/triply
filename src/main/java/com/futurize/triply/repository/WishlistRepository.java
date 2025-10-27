package com.futurize.triply.repository;

import com.futurize.triply.model.Wishlist;
import org.springframework.data.couchbase.repository.CouchbaseRepository;
import org.springframework.data.couchbase.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public interface WishlistRepository extends CouchbaseRepository<Wishlist, String> {
    
    Optional<Wishlist> findByName(String name);
    
    boolean existsByName(String name);
    
    @Query("SELECT META().id FROM #{#n1ql.bucket} WHERE name = $1")
    String findIdByName(String name);
    
    @Query("#{#n1ql.selectEntity} WHERE _class = 'com.futurize.triply.model.Wishlist'")
    List<Wishlist> findAllWishlists();
    
    default List<String> findAllWishlistNames() {
        return findAllWishlists().stream()
            .map(Wishlist::getName)
            .collect(Collectors.toList());
    }
}
