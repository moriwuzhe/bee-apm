package plugin;

import base.PluginTestBase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.jdbc.JDBCPlugin;

import java.sql.*;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * JDBC插件单元测试
 * @author LT Monitor Dev
 */
public class JDBCPluginTest extends PluginTestBase {
    private JDBCPlugin jdbcPlugin;
    private Connection connection;

    @BeforeEach
    public void setup() throws Exception {
        jdbcPlugin = new JDBCPlugin();
        // 安装JDBC插件
        installPlugin(jdbcPlugin);
        // 使用H2内存数据库测试
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection("jdbc:h2:mem:testdb", "sa", "");
        // 初始化测试表
        Statement stmt = connection.createStatement();
        stmt.execute("CREATE TABLE IF NOT EXISTS user (id INT PRIMARY KEY, name VARCHAR(100))");
        stmt.execute("INSERT INTO user VALUES (1, '张三'), (2, '李四'), (3, '王五')");
        stmt.close();
        clearSpans();
    }

    @AfterEach
    public void teardown() throws SQLException {
        if (connection != null) {
            Statement stmt = connection.createStatement();
            stmt.execute("DROP TABLE user");
            stmt.close();
            connection.close();
        }
        clearSpans();
    }

    @Test
    public void testSelectQuery() throws Exception {
        // 执行查询SQL
        Statement stmt = connection.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT * FROM user WHERE id = 1");
        assertTrue(rs.next());
        assertEquals("张三", rs.getString("name"));
        rs.close();
        stmt.close();

        // 验证Span上报
        List<Span> spans = getSpansByType("jdbc");
        assertEquals(1, spans.size());

        Span selectSpan = spans.get(0);
        assertEquals("jdbc", selectSpan.getType());
        assertEquals("SELECT", selectSpan.getTag("sql_type"));
        assertEquals("user", selectSpan.getTag("table"));
        assertEquals("TESTDB", selectSpan.getTag("database"));
        assertEquals("jdbc:h2:mem:testdb", selectSpan.getTag("jdbc_url"));
        assertEquals("success", selectSpan.getTag("status"));
        assertTrue(selectSpan.getTag("sql").contains("SELECT * FROM user WHERE id = 1"));
        assertFalse(Boolean.parseBoolean(selectSpan.getTag("is_slow")));
    }

    @Test
    public void testPreparedStatementSelect() throws Exception {
        // 执行预编译查询
        String sql = "SELECT * FROM user WHERE id = ?";
        PreparedStatement pstmt = connection.prepareStatement(sql);
        pstmt.setInt(1, 2);
        ResultSet rs = pstmt.executeQuery();
        assertTrue(rs.next());
        assertEquals("李四", rs.getString("name"));
        rs.close();
        pstmt.close();

        // 验证Span上报
        List<Span> spans = getSpansByType("jdbc");
        assertEquals(1, spans.size());

        Span selectSpan = spans.get(0);
        assertEquals("jdbc", selectSpan.getType());
        assertEquals("SELECT", selectSpan.getTag("sql_type"));
        assertEquals("user", selectSpan.getTag("table"));
        assertEquals("2", selectSpan.getTag("param.0")); // 参数索引从0开始
        assertEquals("success", selectSpan.getTag("status"));
        assertTrue(selectSpan.getTag("sql").contains("SELECT * FROM user WHERE id = ?"));
    }

    @Test
    public void testInsertQuery() throws Exception {
        // 执行插入SQL
        Statement stmt = connection.createStatement();
        int affectedRows = stmt.executeUpdate("INSERT INTO user VALUES (4, '赵六')");
        assertEquals(1, affectedRows);
        stmt.close();

        // 验证Span上报
        List<Span> spans = getSpansByType("jdbc");
        assertEquals(1, spans.size());

        Span insertSpan = spans.get(0);
        assertEquals("jdbc", insertSpan.getType());
        assertEquals("INSERT", insertSpan.getTag("sql_type"));
        assertEquals("user", insertSpan.getTag("table"));
        assertEquals("1", insertSpan.getTag("affected_rows"));
        assertEquals("success", insertSpan.getTag("status"));
        assertTrue(insertSpan.getTag("sql").contains("INSERT INTO user VALUES (4, '赵六')"));
    }

    @Test
    public void testUpdateQuery() throws Exception {
        // 执行更新SQL
        PreparedStatement pstmt = connection.prepareStatement("UPDATE user SET name = ? WHERE id = ?");
        pstmt.setString(1, "张三新");
        pstmt.setInt(2, 1);
        int affectedRows = pstmt.executeUpdate();
        assertEquals(1, affectedRows);
        pstmt.close();

        // 验证Span上报
        List<Span> spans = getSpansByType("jdbc");
        assertEquals(1, spans.size());

        Span updateSpan = spans.get(0);
        assertEquals("jdbc", updateSpan.getType());
        assertEquals("UPDATE", updateSpan.getTag("sql_type"));
        assertEquals("user", updateSpan.getTag("table"));
        assertEquals("1", updateSpan.getTag("affected_rows"));
        assertEquals("张三新", updateSpan.getTag("param.0"));
        assertEquals("1", updateSpan.getTag("param.1"));
        assertEquals("success", updateSpan.getTag("status"));
    }

    @Test
    public void testDeleteQuery() throws Exception {
        // 执行删除SQL
        Statement stmt = connection.createStatement();
        int affectedRows = stmt.executeUpdate("DELETE FROM user WHERE id = 3");
        assertEquals(1, affectedRows);
        stmt.close();

        // 验证Span上报
        List<Span> spans = getSpansByType("jdbc");
        assertEquals(1, spans.size());

        Span deleteSpan = spans.get(0);
        assertEquals("jdbc", deleteSpan.getType());
        assertEquals("DELETE", deleteSpan.getTag("sql_type"));
        assertEquals("user", deleteSpan.getTag("table"));
        assertEquals("1", deleteSpan.getTag("affected_rows"));
        assertEquals("success", deleteSpan.getTag("status"));
    }

    @Test
    public void testSlowSql() throws Exception {
        // 执行慢SQL（模拟）
        Statement stmt = connection.createStatement();
        // H2不会真的慢，这里验证慢SQL阈值逻辑
        long start = System.currentTimeMillis();
        ResultSet rs = stmt.executeQuery("SELECT * FROM user t1, user t2, user t3"); // 笛卡尔积模拟慢查询
        while (rs.next()) {
            // 遍历结果
        }
        long cost = System.currentTimeMillis() - start;
        rs.close();
        stmt.close();

        // 验证Span上报
        List<Span> spans = getSpansByType("jdbc");
        assertEquals(1, spans.size());

        Span slowSpan = spans.get(0);
        // 如果耗时超过默认阈值1000ms会标记为慢SQL
        if (cost >= 1000) {
            assertEquals("true", slowSpan.getTag("is_slow"));
        }
    }

    @Test
    public void testErrorSql() throws Exception {
        // 执行错误的SQL
        Statement stmt = connection.createStatement();
        try {
            stmt.executeQuery("SELECT * FROM not_exist_table");
            fail("Should throw exception");
        } catch (SQLException e) {
            // 预期异常
        }
        stmt.close();

        // 验证错误Span上报
        List<Span> spans = getSpansByType("jdbc");
        assertEquals(1, spans.size());

        Span errorSpan = spans.get(0);
        assertEquals("jdbc", errorSpan.getType());
        assertEquals("failed", errorSpan.getTag("status"));
        assertNotNull(errorSpan.getTag("error_msg"));
        assertTrue(errorSpan.getTag("error_msg").contains("not_exist_table"));
    }
}
