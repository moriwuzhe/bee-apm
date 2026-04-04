package plugin;

import base.PluginTestBase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.jdbc.ConnectionPlugin;
import org.xi.lt.agent.plugin.jdbc.PreparedStatementExecutePlugin;
import org.xi.lt.agent.plugin.jdbc.PreparedStatementParamPlugin;

import java.sql.*;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * JDBC插件单元测试
 * @author LT Monitor Dev
 */
public class JDBCPluginTest extends PluginTestBase {
    private Connection connection;

    @BeforeEach
    public void setup() throws Exception {
        installPlugin(new ConnectionPlugin());
        installPlugin(new PreparedStatementParamPlugin());
        installPlugin(new PreparedStatementExecutePlugin());
        // 使用H2内存数据库测试
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection("jdbc:h2:mem:testdb", "sa", "");
        // 初始化测试表
        Statement stmt = connection.createStatement();
        stmt.execute("CREATE TABLE IF NOT EXISTS t_user (id INT PRIMARY KEY, name VARCHAR(100))");
        stmt.execute("INSERT INTO t_user VALUES (1, '张三'), (2, '李四'), (3, '王五')");
        stmt.close();
        clearSpans();
    }

    @AfterEach
    public void teardown() throws SQLException {
        if (connection != null) {
            Statement stmt = connection.createStatement();
            stmt.execute("DROP TABLE t_user");
            stmt.close();
            connection.close();
        }
        clearSpans();
    }

    @Test
    public void testSelectQuery() throws Exception {
        // 执行查询SQL
        PreparedStatement pstmt = connection.prepareStatement("SELECT * FROM t_user WHERE id = 1");
        ResultSet rs = pstmt.executeQuery();
        assertTrue(rs.next());
        assertEquals("张三", rs.getString("name"));
        rs.close();
        pstmt.close();

        // 验证Span上报
        List<Span> spans = getSpansByType("sql");
        assertEquals(1, spans.size());

        Span selectSpan = spans.get(0);
        assertEquals("sql", selectSpan.getType());
        assertEquals("Y", selectSpan.getTag("status"));
        assertTrue(String.valueOf(selectSpan.getTag("sql")).contains("SELECT * FROM t_user WHERE id = 1"));
    }

    @Test
    public void testPreparedStatementSelect() throws Exception {
        // 执行预编译查询
        String sql = "SELECT * FROM t_user WHERE id = ?";
        PreparedStatement pstmt = connection.prepareStatement(sql);
        pstmt.setInt(1, 2);
        ResultSet rs = pstmt.executeQuery();
        assertTrue(rs.next());
        assertEquals("李四", rs.getString("name"));
        rs.close();
        pstmt.close();

        // 验证Span上报
        List<Span> spans = getSpansByType("sql");
        assertEquals(1, spans.size());

        Span selectSpan = spans.get(0);
        assertEquals("sql", selectSpan.getType());
        assertEquals("Y", selectSpan.getTag("status"));
        assertTrue(String.valueOf(selectSpan.getTag("sql")).contains("SELECT * FROM t_user WHERE id = ?"));

        List<Span> paramSpans = getSpansByType("sqlp");
        assertEquals(1, paramSpans.size());
        assertEquals(selectSpan.getId(), paramSpans.get(0).getId());
        assertTrue(String.valueOf(paramSpans.get(0).getTag("args")).contains("2"));
    }

    @Test
    public void testInsertQuery() throws Exception {
        // 执行插入SQL
        PreparedStatement pstmt = connection.prepareStatement("INSERT INTO t_user VALUES (4, '赵六')");
        int affectedRows = pstmt.executeUpdate();
        assertEquals(1, affectedRows);
        pstmt.close();

        // 验证Span上报
        List<Span> spans = getSpansByType("sql");
        assertEquals(1, spans.size());

        Span insertSpan = spans.get(0);
        assertEquals("sql", insertSpan.getType());
        assertEquals("Y", insertSpan.getTag("status"));
        assertEquals("1", String.valueOf(insertSpan.getTag("count")));
        assertTrue(String.valueOf(insertSpan.getTag("sql")).contains("INSERT INTO t_user VALUES (4, '赵六')"));
    }

    @Test
    public void testUpdateQuery() throws Exception {
        // 执行更新SQL
        PreparedStatement pstmt = connection.prepareStatement("UPDATE t_user SET name = ? WHERE id = ?");
        pstmt.setString(1, "张三新");
        pstmt.setInt(2, 1);
        int affectedRows = pstmt.executeUpdate();
        assertEquals(1, affectedRows);
        pstmt.close();

        // 验证Span上报
        List<Span> spans = getSpansByType("sql");
        assertEquals(1, spans.size());

        Span updateSpan = spans.get(0);
        assertEquals("sql", updateSpan.getType());
        assertEquals("Y", updateSpan.getTag("status"));
        assertEquals("1", String.valueOf(updateSpan.getTag("count")));

        List<Span> paramSpans = getSpansByType("sqlp");
        assertEquals(1, paramSpans.size());
        assertEquals(updateSpan.getId(), paramSpans.get(0).getId());
        assertTrue(String.valueOf(paramSpans.get(0).getTag("args")).contains("张三新"));
        assertTrue(String.valueOf(paramSpans.get(0).getTag("args")).contains("1"));
    }

    @Test
    public void testDeleteQuery() throws Exception {
        // 执行删除SQL
        PreparedStatement pstmt = connection.prepareStatement("DELETE FROM t_user WHERE id = 3");
        int affectedRows = pstmt.executeUpdate();
        assertEquals(1, affectedRows);
        pstmt.close();

        // 验证Span上报
        List<Span> spans = getSpansByType("sql");
        assertEquals(1, spans.size());

        Span deleteSpan = spans.get(0);
        assertEquals("sql", deleteSpan.getType());
        assertEquals("Y", deleteSpan.getTag("status"));
        assertEquals("1", String.valueOf(deleteSpan.getTag("count")));
    }

    @Test
    public void testSlowSql() throws Exception {
        // 执行慢SQL（模拟）
        PreparedStatement pstmt = connection.prepareStatement("SELECT * FROM t_user t1, t_user t2, t_user t3");
        // H2不会真的慢，这里验证慢SQL阈值逻辑
        long start = System.currentTimeMillis();
        ResultSet rs = pstmt.executeQuery(); // 笛卡尔积模拟慢查询
        while (rs.next()) {
            // 遍历结果
        }
        long cost = System.currentTimeMillis() - start;
        rs.close();
        pstmt.close();

        // 验证Span上报
        List<Span> spans = getSpansByType("sql");
        assertEquals(1, spans.size());

        Span slowSpan = spans.get(0);
        // 如果耗时超过默认阈值1000ms会标记为慢SQL
        if (cost >= 1000) {
            assertTrue(slowSpan.getSpend() >= 1000);
        }
    }

    @Test
    public void testErrorSql() throws Exception {
        // 执行错误的SQL
        try {
            PreparedStatement pstmt = connection.prepareStatement("SELECT * FROM not_exist_table");
            pstmt.executeQuery();
            pstmt.close();
            fail("Should throw exception");
        } catch (SQLException e) {
            // 预期异常
        }

        // 验证错误Span上报
        List<Span> spans = getSpansByType("sql");
        assertEquals(1, spans.size());

        Span errorSpan = spans.get(0);
        assertEquals("sql", errorSpan.getType());
        assertEquals("N", errorSpan.getTag("status"));
        assertTrue(String.valueOf(errorSpan.getTag("sql")).contains("not_exist_table"));
    }
}
