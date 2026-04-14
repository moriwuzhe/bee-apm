package org.xi.lt.server.infrastructure.store.h2;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * H2数据库工具类
 */
public class H2Utils {
    private static final Logger logger = LoggerFactory.getLogger(H2Utils.class);
    private static H2Utils inst;
    private Connection connection;

    public static H2Utils inst() {
        if (inst == null) {
            synchronized (H2Utils.class) {
                if (inst == null) {
                    inst = new H2Utils();
                    inst.init();
                }
            }
        }
        return inst;
    }

    private void init() {
        try {
            // 使用内存H2数据库
            Class.forName("org.h2.Driver");
            connection = DriverManager.getConnection("jdbc:h2:mem:ltmonitor;DB_CLOSE_DELAY=-1", "sa", "");
            createTable();
            logger.info("H2Store initialized successfully");
        } catch (Exception e) {
            logger.error("Failed to initialize H2Store", e);
        }
    }

    private void createTable() {
        String sql = "CREATE TABLE IF NOT EXISTS spans (" +
                "id VARCHAR(255) PRIMARY KEY," +
                "type VARCHAR(255)," +
                "time BIGINT," +
                "data TEXT" +
                ")";
        try (Statement stmt = connection.createStatement()) {
            stmt.execute(sql);
        } catch (SQLException e) {
            logger.error("Failed to create table", e);
        }
    }

    public void insert(Object... datas) {
        if (datas == null || datas.length == 0) {
            return;
        }
        String sql = "INSERT INTO spans (id, type, time, data) VALUES (?, ?, ?, ?)";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            for (Object data : datas) {
                // 简单处理：假设data有id、type、time字段
                // 实际项目中应该使用反射或Jackson来处理
                pstmt.setString(1, String.valueOf(System.nanoTime()));
                pstmt.setString(2, "span");
                pstmt.setLong(3, System.currentTimeMillis());
                pstmt.setString(4, data.toString());
                pstmt.addBatch();
            }
            pstmt.executeBatch();
        } catch (SQLException e) {
            logger.error("Failed to insert data", e);
        }
    }

    public void cleanOldData(int retentionDays) {
        // H2内存数据库，暂时不实现清理
        logger.info("H2Store cleanOldData called with retentionDays: {}", retentionDays);
    }
}
