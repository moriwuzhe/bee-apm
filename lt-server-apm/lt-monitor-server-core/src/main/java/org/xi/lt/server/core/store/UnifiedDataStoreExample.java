package org.xi.lt.server.core.store;

import org.xi.lt.server.domain.model.common.PageSearchResult;
import org.xi.lt.server.domain.model.query.SpanPageQuery;
import org.xi.lt.server.domain.model.span.SpanView;
import org.xi.lt.server.domain.repository.UnifiedDataStore;

import java.util.List;

/**
 * 统一数据存储使用示例
 * 
 * 展示了如何使用 StorageManager 和 UnifiedDataStore 进行数据操作
 * 
 * @author system
 * @date 2026/04/15
 */
public class UnifiedDataStoreExample {
    
    /**
     * 示例1：基本写入操作
     */
    public void example1_write() {
        // 获取统一数据存储
        UnifiedDataStore store = StorageManager.getInstance().getUnifiedStore();
        
        // 保存数据
        Object data1 = createSpanData();
        Object data2 = createLogData();
        store.save(data1, data2);
    }
    
    /**
     * 示例2：分页查询 Span
     */
    public void example2_spanPageQuery() throws Exception {
        UnifiedDataStore store = StorageManager.getInstance().getUnifiedStore();
        
        // 构建查询条件
        SpanPageQuery query = new SpanPageQuery();
        query.setType("http");
        query.setApp("my-app");
        query.setEnv("production");
        query.setBeginMs(System.currentTimeMillis() - 3600000); // 1小时前
        query.setEndMs(System.currentTimeMillis());
        query.setFrom(0);
        query.setSize(20);
        
        // 执行查询
        PageSearchResult<SpanView> result = store.searchSpanPage(query);
        
        System.out.println("Total: " + result.getTotal());
        for (SpanView span : result.getRows()) {
            System.out.println("Span: " + span);
        }
    }
    
    /**
     * 示例3：根据 GID 查询追踪链路
     */
    public void example3_traceByGid() throws Exception {
        UnifiedDataStore store = StorageManager.getInstance().getUnifiedStore();
        
        String gid = "trace-12345";
        long beginMs = System.currentTimeMillis() - 3600000;
        long endMs = System.currentTimeMillis();
        
        // 查询指定类型的 Span
        List<SpanView> spans = store.searchSpanByGid("http", gid, beginMs, endMs, 100);
        
        // 或者查询所有类型的 Span
        List<SpanView> allSpans = store.searchSpanByGidAny(gid, beginMs, endMs, 100);
        
        System.out.println("Found " + spans.size() + " spans");
    }
    
    /**
     * 示例4：Dashboard 统计查询
     */
    public void example4_dashboardStats() {
        UnifiedDataStore store = StorageManager.getInstance().getUnifiedStore();
        
        long beginMs = System.currentTimeMillis() - 3600000;
        long endMs = System.currentTimeMillis();
        
        // 统计数据量
        long count = store.countByType(beginMs, endMs, "production", "my-app", null, "http");
        System.out.println("HTTP request count: " + count);
        
        // 统计独立实例数
        long instCount = store.countDistinctInst(beginMs, endMs, "production", "my-app", null);
        System.out.println("Instance count: " + instCount);
    }
    
    /**
     * 示例5：清理过期数据
     */
    public void example5_cleanOldData() {
        UnifiedDataStore store = StorageManager.getInstance().getUnifiedStore();
        
        // 清理30天前的数据
        int retentionDays = 30;
        store.clean(retentionDays);
    }
    
    /**
     * 示例6：配置不同的存储类型
     * 
     * 在 application.yml 或 config.yml 中配置：
     * 
     * # 使用 ElasticSearch（推荐生产环境）
     * lt:
     *   store:
     *     name: elasticsearch-adapter
     * 
     * # 使用 H2（适合开发测试）
     * lt:
     *   store:
     *     name: h2-adapter
     * 
     * # 使用 MySQL
     * lt:
     *   store:
     *     name: mysql-adapter
     */
    public void example6_configuration() {
        // 配置由 StorageManager 自动处理
        // 只需在配置文件中设置 lt.store.name 即可
    }
    
    // ==================== 辅助方法 ====================
    
    private Object createSpanData() {
        // 创建 Span 数据的示例
        return null;
    }
    
    private Object createLogData() {
        // 创建 Log 数据的示例
        return null;
    }
}
