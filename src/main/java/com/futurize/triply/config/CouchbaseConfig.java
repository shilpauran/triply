package com.futurize.triply.config;

import com.couchbase.client.java.Cluster;
import com.couchbase.client.java.Collection;
import com.couchbase.client.java.env.ClusterEnvironment;
import org.springframework.data.couchbase.SimpleCouchbaseClientFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.couchbase.config.AbstractCouchbaseConfiguration;
import org.springframework.data.couchbase.core.CouchbaseTemplate;
import org.springframework.data.couchbase.core.convert.MappingCouchbaseConverter;
import org.springframework.data.couchbase.repository.config.EnableCouchbaseRepositories;

import java.time.Duration;

@Configuration
@EnableCouchbaseRepositories(basePackages = "com.futurize.triply.repository")
public class CouchbaseConfig extends AbstractCouchbaseConfiguration {
    
    private static final String BUCKET_NAME = "triply";
    private static final String SCOPE_NAME = "_default";
    private static final String CONNECTION_STRING = "couchbase://127.0.0.1";
    private static final String USERNAME = "Administrator";
    private static final String PASSWORD = "password123";
    private static final int CONNECTION_TIMEOUT = 10000; // 10 seconds

    @Override
    protected void configureEnvironment(ClusterEnvironment.Builder builder) {
        builder
            .timeoutConfig()
                .connectTimeout(Duration.ofMillis(CONNECTION_TIMEOUT))
                .kvTimeout(Duration.ofSeconds(5))
                .queryTimeout(Duration.ofSeconds(30));
    }

    @Override
    public String getConnectionString() {
        return CONNECTION_STRING;
    }

    @Override
    public String getUserName() {
        return USERNAME;
    }

    @Override
    public String getPassword() {
        return PASSWORD;
    }

    @Override
    public String getBucketName() {
        return BUCKET_NAME;
    }

    @Override
    public String getScopeName() {
        return SCOPE_NAME;
    }

    @Bean
    public CouchbaseTemplate couchbaseTemplate(Cluster couchbaseCluster, 
                                             MappingCouchbaseConverter mappingCouchbaseConverter) {
        return new CouchbaseTemplate(
            new SimpleCouchbaseClientFactory(couchbaseCluster, BUCKET_NAME, SCOPE_NAME),
            mappingCouchbaseConverter
        );
    }

    @Bean
    public Collection couchbaseCollection() {
        return couchbaseTemplate(null, null).getCouchbaseClientFactory()
            .getBucket()
            .defaultCollection();
    }
}
