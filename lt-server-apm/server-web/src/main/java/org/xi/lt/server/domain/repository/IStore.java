package org.xi.lt.server.domain.repository;

/**
 * @author yuan
 * @date 2018/08/27
 */
public interface IStore {
    /**
     * 初始化操作
     */
    void init();

    /**
     * 保存数据
     * @param stream
     */
    void save(Object ... stream);

    /**
     * Clean old data based on retention days
     * @param retentionDays Number of days to retain data
     */
    default void clean(int retentionDays) {
        // default no-op
    }
}
