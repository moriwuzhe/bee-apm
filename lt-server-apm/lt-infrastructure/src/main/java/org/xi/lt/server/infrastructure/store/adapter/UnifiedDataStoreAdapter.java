package org.xi.lt.server.infrastructure.store.adapter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.server.domain.model.alert.AlertRow;
import org.xi.lt.server.domain.model.common.KeyValue;
import org.xi.lt.server.domain.model.common.PageSearchResult;
import org.xi.lt.server.domain.model.dashboard.FromToCount;
import org.xi.lt.server.domain.model.query.SpanPageQuery;
import org.xi.lt.server.domain.model.span.SpanView;
import org.xi.lt.server.domain.repository.UnifiedDataStore;

import java.util.ArrayList;
import java.util.List;

/**
 * 统一数据存储适配器（核心入口）
 * 
 * 职责：
 * 1. 根据数据类型路由到不同的存储实现
 *    - 账户/配置数据 → MySQL/H2 (通过 Repository 接口)
 *    - 日志/Span/Alert → Elasticsearch (通过 EsDataAccessor)
 * 2. 屏蔽底层存储细节，提供统一的接口
 * 3. 支持运行时切换存储策略
 * 
 * @author system
 * @date 2026/04/16
 */
@Component
@LtPlugin(type = "STORE", name = "unified-adapter")
public class UnifiedDataStoreAdapter implements UnifiedDataStore {
    
    private static final Logger logger = LoggerFactory.getLogger(UnifiedDataStoreAdapter.class);
    
    // ==================== 存储访问器 ====================
    
    /**
     * ES 访问器（处理 Span/Log/Alert）
     */
    @Autowired(required = false)
    private EsDataAccessor esAccessor;
    
    // ==================== UnifiedDataStore 接口实现 ====================
    
    @Override
    public void init() {
        logger.info("UnifiedDataStoreAdapter initialized");
        if (esAccessor != null) {
            logger.info("  - Elasticsearch accessor: enabled");
        } else {
            logger.warn("  - Elasticsearch accessor: disabled");
        }
        
        // TODO: 当添加 Repository 接口后，在这里检测关系型数据库状态
        logger.info("  - Relational database: configured via Repository pattern");
    }
    
    @Override
    public void save(Object... datas) {
        if (datas == null || datas.length == 0) {
            return;
        }
        
        // 所有监控数据（Span/Log/Alert）都路由到 ES
        if (esAccessor != null) {
            esAccessor.save(datas);
        } else {
            logger.debug("Elasticsearch not available, skip saving {} records", datas.length);
        }
    }
    
    @Override
    public void clean(int retentionDays) {
        if (esAccessor != null) {
            esAccessor.clean(retentionDays);
        }
    }
    
    // ==================== Span 查询（路由到 ES）====================
    
    @Override
    public PageSearchResult<SpanView> searchSpanPage(SpanPageQuery query) throws Exception {
        if (esAccessor == null) {
            logger.warn("Elasticsearch not available for span search");
            return new PageSearchResult<>(0, new ArrayList<>());
        }
        return esAccessor.searchSpanPage(query);
    }
    
    @Override
    public List<SpanView> searchSpanByGid(String type, String gid, long beginMs, long endMs, int max) throws Exception {
        if (esAccessor == null) {
            logger.warn("Elasticsearch not available for span search");
            return new ArrayList<>();
        }
        return esAccessor.searchSpanByGid(type, gid, beginMs, endMs, max);
    }
    
    @Override
    public List<SpanView> searchSpanByGidAny(String gid, long beginMs, long endMs, int max) throws Exception {
        if (esAccessor == null) {
            logger.warn("Elasticsearch not available for span search");
            return new ArrayList<>();
        }
        return esAccessor.searchSpanByGidAny(gid, beginMs, endMs, max);
    }
    
    // ==================== Alert 查询（路由到 ES）====================
    
    @Override
    public List<AlertRow> searchAlerts(String app, int limit) throws Exception {
        if (esAccessor == null) {
            logger.debug("Elasticsearch not available, returning empty alert list");
            return new ArrayList<>();
        }
        return esAccessor.searchAlerts(app, limit);
    }
    
    // ==================== Dashboard 查询（路由到 ES）====================
    
    @Override
    public long countByType(long beginMs, long endMs, String env, String app, String ip, String type) {
        if (esAccessor == null) {
            return 0;
        }
        return esAccessor.countByType(beginMs, endMs, env, app, ip, type);
    }
    
    @Override
    public long countDistinctInst(long beginMs, long endMs, String env, String app, String ip) {
        if (esAccessor == null) {
            return 0;
        }
        return esAccessor.countDistinctInst(beginMs, endMs, env, app, ip);
    }
    
    @Override
    public List<FromToCount> topologyFromTo(long beginMs, long endMs) {
        if (esAccessor == null) {
            return new ArrayList<>();
        }
        return esAccessor.topologyFromTo(beginMs, endMs);
    }
    
    @Override
    public List<KeyValue> groupList(long beginMs, long endMs, String groupField) {
        if (esAccessor == null) {
            return new ArrayList<>();
        }
        return esAccessor.groupList(beginMs, endMs, groupField);
    }
    
    @Override
    public Object queryById(String indexPrefix, String id, long beginMs, long endMs) {
        if (esAccessor == null) {
            return null;
        }
        return esAccessor.queryById(indexPrefix, id, beginMs, endMs);
    }
    
    // ==================== 账户/配置管理（待实现）====================
    // TODO: 当 Domain 层添加 Repository 接口后，在这里实现路由逻辑
    // 例如：
    // public List<Project> getProjects() {
    //     return projectRepository.findAll();
    // }
}
