package org.xi.lt.server.web.infrastructure.es;

import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestHighLevelClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.IOException;

@Component
public class EsClientHolder {
    private RestClient restClient;
    private RestHighLevelClient client;

    @Value("${elasticsearch.host:127.0.0.1}")
    private String host;

    @Value("${elasticsearch.port:9200}")
    private int port;

    @Value("${elasticsearch.scheme:http}")
    private String scheme;

    @PostConstruct
    public void init() {
        restClient = RestClient.builder(new HttpHost(host, port, scheme)).build();
        client = new RestHighLevelClient(restClient);
    }

    public RestHighLevelClient getClient() {
        return client;
    }

    @PreDestroy
    public void close() throws IOException {
        if (restClient != null) {
            restClient.close();
        }
    }
}
