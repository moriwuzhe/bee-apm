package plugin;

import base.PluginTestBase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.jdbc.handler.ConnectionHandler;
import org.xi.lt.agent.plugin.jdbc.handler.PreparedStatementExecuteHandler;
import org.xi.lt.agent.plugin.jdbc.handler.PreparedStatementParamHandler;

import java.sql.*;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * JDBC插件单元测试
 * @author LT Monitor Dev
 */
public class JDBCPluginTest extends PluginTestBase {
    private Connection connection;
    private ConnectionHandler connectionHandler;
    private PreparedStatementParamHandler paramHandler;
    private PreparedStatementExecuteHandler executeHandler;

    @BeforeEach
    public void setup() throws Exception {
        connectionHandler = new ConnectionHandler();
        paramHandler = new PreparedStatementParamHandler();
        executeHandler = new PreparedStatementExecuteHandler();
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection("jdbc:h2:mem:testdb", "sa", "");
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
        PreparedStatement pstmt = prepareStatement("SELECT * FROM t_user WHERE id = 1");
        ResultSet rs = executeQuery(pstmt, "SELECT * FROM t_user WHERE id = 1");
        assertTrue(rs.next());
        assertEquals("张三", rs.getString("name"));
        rs.close();
        pstmt.close();

        List<Span> spans = getSpansByType("sql");
        assertEquals(1, spans.size());

        Span selectSpan = spans.get(0);
        assertEquals("sql", selectSpan.getType());
        assertEquals("Y", selectSpan.getTag("status"));
        assertTrue(String.valueOf(selectSpan.getTag("sql")).contains("SELECT * FROM t_user WHERE id = 1"));
    }

    @Test
    public void testPreparedStatementSelect() throws Exception {
        String sql = "SELECT * FROM t_user WHERE id = ?";
        PreparedStatement pstmt = prepareStatement(sql);
        setParam(pstmt, 1, 2);
        ResultSet rs = executeQuery(pstmt, sql);
        assertTrue(rs.next());
        assertEquals("李四", rs.getString("name"));
        rs.close();
        pstmt.close();

        List<Span> spans = getSpansByType("sql");
        assertEquals(1, spans.size());

        Span selectSpan = spans.get(0);
        assertEquals("sql", selectSpan.getType());
        assertEquals("Y", selectSpan.getTag("status"));
        assertTrue(String.valueOf(selectSpan.getTag("sql")).contains("SELECT * FROM t_user WHERE id = ?"));

        List<Span> paramSpans = getSpansByType("sqlp");
        assertEquals(1, paramSpans.size());
        assertEquals(selectSpan.getId(), paramSpans.get(0).getId());
        assertNotNull(paramSpans.get(0).getTag("args"));
    }

    @Test
    public void testInsertQuery() throws Exception {
        String sql = "INSERT INTO t_user VALUES (4, '赵六')";
        PreparedStatement pstmt = prepareStatement(sql);
        int affectedRows = executeUpdate(pstmt, sql);
        assertEquals(1, affectedRows);
        pstmt.close();

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
        String sql = "UPDATE t_user SET name = ? WHERE id = ?";
        PreparedStatement pstmt = prepareStatement(sql);
        setParam(pstmt, 1, "张三新");
        setParam(pstmt, 2, 1);
        int affectedRows = executeUpdate(pstmt, sql);
        assertEquals(1, affectedRows);
        pstmt.close();

        List<Span> spans = getSpansByType("sql");
        assertEquals(1, spans.size());

        Span updateSpan = spans.get(0);
        assertEquals("sql", updateSpan.getType());
        assertEquals("Y", updateSpan.getTag("status"));
        assertEquals("1", String.valueOf(updateSpan.getTag("count")));

        List<Span> paramSpans = getSpansByType("sqlp");
        assertEquals(1, paramSpans.size());
        assertEquals(updateSpan.getId(), paramSpans.get(0).getId());
        assertNotNull(paramSpans.get(0).getTag("args"));
    }

    @Test
    public void testDeleteQuery() throws Exception {
        String sql = "DELETE FROM t_user WHERE id = 3";
        PreparedStatement pstmt = prepareStatement(sql);
        int affectedRows = executeUpdate(pstmt, sql);
        assertEquals(1, affectedRows);
        pstmt.close();

        List<Span> spans = getSpansByType("sql");
        assertEquals(1, spans.size());

        Span deleteSpan = spans.get(0);
        assertEquals("sql", deleteSpan.getType());
        assertEquals("Y", deleteSpan.getTag("status"));
        assertEquals("1", String.valueOf(deleteSpan.getTag("count")));
    }

    @Test
    public void testSlowSql() throws Exception {
        String sql = "SELECT * FROM t_user t1, t_user t2, t_user t3";
        PreparedStatement pstmt = prepareStatement(sql);
        long start = System.currentTimeMillis();
        ResultSet rs = executeQuery(pstmt, sql);
        while (rs.next()) {
        }
        long cost = System.currentTimeMillis() - start;
        rs.close();
        pstmt.close();

        List<Span> spans = getSpansByType("sql");
        assertEquals(1, spans.size());

        Span slowSpan = spans.get(0);
        if (cost >= 1000) {
            assertTrue(slowSpan.getSpend() >= 1000);
        }
    }

    @Test
    public void testErrorSql() throws Exception {
        String sql = "SELECT * FROM not_exist_table";
        try {
            PreparedStatement pstmt = prepareStatement(sql);
            pstmt.close();
            fail("Should throw exception");
        } catch (SQLException e) {
            assertNotNull(e);
        }

        List<Span> spans = getSpansByType("sql");
        assertEquals(0, spans.size());
    }

    private PreparedStatement prepareStatement(String sql) throws SQLException {
        connectionHandler.before(Connection.class.getName(), "prepareStatement", new Object[]{sql}, null);
        try {
            PreparedStatement pstmt = connection.prepareStatement(sql);
            connectionHandler.after(Connection.class.getName(), "prepareStatement", new Object[]{sql}, pstmt, null, null);
            return pstmt;
        } catch (SQLException e) {
            connectionHandler.after(Connection.class.getName(), "prepareStatement", new Object[]{sql}, null, e, null);
            throw e;
        }
    }

    private void setParam(PreparedStatement pstmt, int index, Object value) throws SQLException {
        Object[] args = new Object[]{index, value};
        String methodName = value instanceof String ? "setString" : "setInt";
        paramHandler.before(PreparedStatement.class.getName(), methodName, args, null);
        try {
            if (value instanceof String) {
                pstmt.setString(index, (String) value);
            } else if (value instanceof Integer) {
                pstmt.setInt(index, (Integer) value);
            } else {
                throw new IllegalArgumentException("Unsupported value type: " + value.getClass());
            }
            paramHandler.after(PreparedStatement.class.getName(), methodName, args, null, null, null);
        } catch (SQLException e) {
            paramHandler.after(PreparedStatement.class.getName(), methodName, args, null, e, null);
            throw e;
        }
    }

    private ResultSet executeQuery(PreparedStatement pstmt, String sql) throws SQLException {
        executeHandler.before(PreparedStatement.class.getName(), "executeQuery", new Object[]{}, null);
        try {
            ResultSet rs = pstmt.executeQuery();
            executeHandler.after(PreparedStatement.class.getName(), "executeQuery", new Object[]{}, rs, null, new Object[]{pstmt});
            return rs;
        } catch (SQLException e) {
            executeHandler.after(PreparedStatement.class.getName(), "executeQuery", new Object[]{}, null, e, new Object[]{pstmt});
            throw e;
        }
    }

    private int executeUpdate(PreparedStatement pstmt, String sql) throws SQLException {
        executeHandler.before(PreparedStatement.class.getName(), "executeUpdate", new Object[]{}, null);
        try {
            int result = pstmt.executeUpdate();
            executeHandler.after(PreparedStatement.class.getName(), "executeUpdate", new Object[]{}, result, null, new Object[]{pstmt});
            return result;
        } catch (SQLException e) {
            executeHandler.after(PreparedStatement.class.getName(), "executeUpdate", new Object[]{}, null, e, new Object[]{pstmt});
            throw e;
        }
    }
}
