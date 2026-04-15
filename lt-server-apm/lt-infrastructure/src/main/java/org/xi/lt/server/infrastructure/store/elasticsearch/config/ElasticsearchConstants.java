package org.xi.lt.server.infrastructure.store.elasticsearch.config;

/**
 * Elasticsearch索引和字段名常量
 * 统一管理所有ES相关的常量，避免硬编码
 * 
 * @author system
 * @date 2026/04/15
 */
public final class ElasticsearchConstants {
    
    // ==================== 索引名称模式 ====================
    /**
     * Span索引模式
     */
    public static final String INDEX_PATTERN_SPAN = "lt-apm-span-*";
    
    /**
     * Log索引模式
     */
    public static final String INDEX_PATTERN_LOG = "lt-apm-log-*";
    
    /**
     * Alert索引模式
     */
    public static final String INDEX_PATTERN_ALERT = "lt-apm-alert-*";
    
    /**
     * 通用索引模式（用于聚合查询）
     */
    public static final String INDEX_PATTERN_ALL = "lt-*";
    
    // ==================== 时间字段 ====================
    /**
     * Span时间字段
     */
    public static final String FIELD_TIME = "time";
    
    /**
     * Log时间戳字段
     */
    public static final String FIELD_TIMESTAMP = "timestamp";
    
    // ==================== 文档类型字段 ====================
    /**
     * 类型字段（带keyword后缀用于精确匹配）
     */
    public static final String FIELD_TYPE_KEYWORD = "type.keyword";
    
    /**
     * 心跳类型值
     */
    public static final String TYPE_HEARTBEAT = "hb";
    
    /**
     * 拓扑类型值
     */
    public static final String TYPE_TOPOLOGY = "topo";
    
    // ==================== 实例字段 ====================
    /**
     * 实例字段（带keyword后缀）
     */
    public static final String FIELD_INST_KEYWORD = "inst.keyword";
    
    // ==================== 拓扑字段 ====================
    /**
     * from_to字段（带keyword后缀）
     */
    public static final String FIELD_FROM_TO_KEYWORD = "tags.from_to.keyword";
    
    // ==================== 聚合配置 ====================
    /**
     * 默认聚合桶大小
     */
    public static final int DEFAULT_AGGREGATION_SIZE = 1000;
    
    /**
     * 分组列表默认大小
     */
    public static final int GROUP_LIST_SIZE = 200;
    
    // ==================== 清理配置 ====================
    /**
     * 每次清理的最大文档数
     */
    public static final int CLEAN_BATCH_SIZE = 1000;
    
    // ==================== 分页配置 ====================
    /**
     * 默认每页大小
     */
    public static final int DEFAULT_PAGE_SIZE = 20;
    
    /**
     * 默认排序字段
     */
    public static final String DEFAULT_SORT_FIELD = "time";
    
    // 私有构造函数，防止实例化
    private ElasticsearchConstants() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }
}
