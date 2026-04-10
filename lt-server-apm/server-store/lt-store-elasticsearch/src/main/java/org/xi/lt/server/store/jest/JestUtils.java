package org.xi.lt.server.store.jest;

import com.alibaba.fastjson.JSONObject;
import io.searchbox.action.BulkableAction;
import io.searchbox.client.JestClient;
import io.searchbox.client.JestClientFactory;
import io.searchbox.client.JestResult;
import io.searchbox.client.config.HttpClientConfig;
import io.searchbox.core.Bulk;
import io.searchbox.core.Index;
import org.xi.lt.server.core.common.ConfigHolder;
import org.xi.lt.server.core.store.StoreFactory;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.DateFormatUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Method;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * @author yuan
 * @date 2018/08/27
 */
public class JestUtils {
    private static Logger logger = LoggerFactory.getLogger(StoreFactory.class);
    static JestClient jestClient;
    static JestUtils inst;
    private static String KEY_INDEX_PREFIX = "lt.store.elasticsearch.indices";
    private static String KEY_CONFIG_PREFIX = "lt.store.elasticsearch.config";
    private static String DEFAULT_INDEX_NAME;
    private static Properties INDEX_MAP;

    public static JestUtils inst() {
        if (jestClient == null) {
            synchronized (JestUtils.class) {
                if (jestClient == null) {
                    inst = new JestUtils();
                    initJestClient();
                }
            }
        }
        return inst;
    }

    private static void initJestClient() {
        INDEX_MAP = ConfigHolder.getProperties(KEY_INDEX_PREFIX, true);
        Properties esConfig = ConfigHolder.getProperties(KEY_CONFIG_PREFIX, true);
        DEFAULT_INDEX_NAME = INDEX_MAP.getProperty("default", "lt-default");
        String[] urls = esConfig.getProperty("url").split(",");
        HttpClientConfig.Builder builder = new HttpClientConfig.Builder(Arrays.asList(urls));
        String userName = esConfig.getProperty("username");
        String password = esConfig.getProperty("password");
        if (StringUtils.isNotBlank(userName)) {
            builder = builder.defaultCredentials(userName, password);
        }
        builder = buildConfig(builder, esConfig);
        JestClientFactory factory = new JestClientFactory();
        factory.setHttpClientConfig(builder.build());
        jestClient = factory.getObject();

    }

    private static HttpClientConfig.Builder buildConfig(HttpClientConfig.Builder builder, Properties esConfig) {
        Object defaultMaxTotalConnectionPerRoute = esConfig.get("defaultMaxTotalConnectionPerRoute");
        if (defaultMaxTotalConnectionPerRoute != null) {
            builder = builder.defaultMaxTotalConnectionPerRoute(Integer.parseInt(String.valueOf(defaultMaxTotalConnectionPerRoute)));
        }
        Object maxTotalConnection = esConfig.get("maxTotalConnection");
        if (maxTotalConnection != null) {
            builder = builder.maxTotalConnection(Integer.parseInt(String.valueOf(maxTotalConnection)));
        }
        Object connTimeout = esConfig.get("connTimeout");
        if (connTimeout != null) {
            builder = builder.connTimeout(Integer.parseInt(String.valueOf(connTimeout)));
        }
        Object maxConnectionIdleTime = esConfig.get("maxConnectionIdleTime");
        if (maxConnectionIdleTime != null) {
            builder = builder.maxConnectionIdleTime(Integer.parseInt(String.valueOf(maxConnectionIdleTime)), TimeUnit.SECONDS);
        }
        Object defaultSchemeForDiscoveredNodes = esConfig.get("defaultSchemeForDiscoveredNodes");
        if (defaultSchemeForDiscoveredNodes != null && StringUtils.isNotBlank(String.valueOf(defaultSchemeForDiscoveredNodes))) {
            builder = builder.defaultSchemeForDiscoveredNodes(String.valueOf(defaultSchemeForDiscoveredNodes));
        }
        Object discoveryEnabled = esConfig.get("discoveryEnabled");
        if (discoveryEnabled != null) {
            builder = builder.discoveryEnabled(Boolean.parseBoolean(String.valueOf(discoveryEnabled)));
        }
        Object discoveryFilter = esConfig.get("discoveryFilter");
        if (discoveryFilter != null && StringUtils.isNotBlank(String.valueOf(discoveryFilter))) {
            builder = builder.discoveryFilter(String.valueOf(discoveryFilter));
        }
        Object discoveryFrequency = esConfig.get("discoveryFrequency");
        if (discoveryFrequency != null) {
            builder = builder.discoveryFrequency(Long.parseLong(String.valueOf(discoveryFrequency)), TimeUnit.MILLISECONDS);
        }
        Object multiThreaded = esConfig.get("multiThreaded");
        if (multiThreaded != null) {
            builder = builder.multiThreaded(Boolean.parseBoolean(String.valueOf(multiThreaded)));
        }
        Object readTimeout = esConfig.get("readTimeout");
        if (readTimeout != null) {
            builder = builder.readTimeout(Integer.parseInt(String.valueOf(readTimeout)));
        }
        return builder;
    }


    public void insert(Object... datas) {
        try {
            if (datas == null || datas.length == 0) {
                return;
            }
            System.out.println("JestUtils.insert called with " + datas.length + " items");
            List<BulkableAction> bulkList = new ArrayList<>();
            for (Object item : datas) {
                JSONObject data = (JSONObject) item;
                String index = getIndexName(data);
                String id = data.getString("id");
                String type = data.getString("type");
                Object time = data.get("time");
                if (time instanceof Long) {
                    data.put("time", new Date((Long) time));
                }
                BulkableAction action = new Index.Builder(data).index(index).type(type).id(id).build();
                bulkList.add(action);
            }
            Bulk bulk = new Bulk.Builder()
                    .addAction(bulkList)
                    .build();
            JestResult jr = jestClient.execute(bulk);
            if (!jr.isSucceeded()) {
                logger.error("Bulk Error : " + jr.getErrorMessage());
            }
        } catch (Exception e) {
            logger.error("", e);
        }
    }

    private String getIndexName(JSONObject data) {
        String type = data.getString("type");
        String date = DateFormatUtils.format(new Date(), "yyyy.MM.dd");
        return INDEX_MAP.getProperty(type, DEFAULT_INDEX_NAME) + "-" + date;
    }


}
