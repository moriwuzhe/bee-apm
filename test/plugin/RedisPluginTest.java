package plugin;

import base.PluginTestBase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.redis.handler.RedisHandler;
import redis.clients.jedis.Jedis;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Redis插件单元测试
 * @author LT Monitor Dev
 */
public class RedisPluginTest extends PluginTestBase {
    private Jedis jedis;
    private RedisHandler redisHandler;

    @BeforeEach
    public void setup() {
        jedis = new Jedis("localhost", 6379);
        jedis.flushDB();
        redisHandler = new RedisHandler();
        clearSpans();
    }

    @AfterEach
    public void teardown() {
        if (jedis != null) {
            jedis.flushDB();
            jedis.close();
        }
        clearSpans();
    }

    @Test
    public void testRedisGetCommand() {
        executeRedis("set", new Object[]{"test-key", "test-value"}, () -> jedis.set("test-key", "test-value"));
        String value = jedis.get("test-key");
        executeRedis("get", new Object[]{"test-key"}, () -> jedis.get("test-key"));
        assertEquals("test-value", value);

        List<Span> spans = getSpansByType("redis");
        assertEquals(2, spans.size());

        Span getSpan = spans.get(1);
        assertEquals("redis", getSpan.getType());
        assertEquals("GET", getSpan.getTag("command"));
        assertEquals("test-key", getSpan.getTag("key"));
        assertNotNull(getSpan.getTag("host"));
        assertNotNull(getSpan.getTag("port"));
        assertTrue(getSpan.getSpend() >= 0);
    }

    @Test
    public void testRedisSetCommand() {
        String result = executeRedis("set", new Object[]{"test-set-key", "test-set-value"}, () -> jedis.set("test-set-key", "test-set-value"));
        assertEquals("OK", result);

        List<Span> spans = getSpansByType("redis");
        assertEquals(1, spans.size());

        Span setSpan = spans.get(0);
        assertEquals("redis", setSpan.getType());
        assertEquals("SET", setSpan.getTag("command"));
        assertEquals("test-set-key", setSpan.getTag("key"));
        assertNotNull(setSpan.getTag("host"));
        assertNotNull(setSpan.getTag("port"));
    }

    @Test
    public void testRedisDelCommand() {
        jedis.set("test-del-key", "test-del-value");
        clearSpans();

        Long result = executeRedis("del", new Object[]{"test-del-key"}, () -> jedis.del("test-del-key"));
        assertEquals(1, result);

        List<Span> spans = getSpansByType("redis");
        assertEquals(1, spans.size());

        Span delSpan = spans.get(0);
        assertEquals("redis", delSpan.getType());
        assertEquals("DEL", delSpan.getTag("command"));
        assertEquals("test-del-key", delSpan.getTag("key"));
        assertNotNull(delSpan.getTag("host"));
        assertNotNull(delSpan.getTag("port"));
    }

    @Test
    public void testRedisErrorCommand() {
        try {
            executeRedis("eval", new Object[]{"wrong lua script"}, () -> jedis.eval("wrong lua script"));
            fail("Should throw exception");
        } catch (Exception e) {
            assertNotNull(e);
        }

        List<Span> spans = getSpansByType("redis");
        assertEquals(1, spans.size());

        Span errorSpan = spans.get(0);
        assertEquals("redis", errorSpan.getType());
        assertEquals("EVAL", errorSpan.getTag("command"));
        assertEquals("true", errorSpan.getTag("error"));
        assertNotNull(errorSpan.getTag("error.message"));
    }

    @Test
    public void testRedisHashCommand() {
        Long result = executeRedis("hset", new Object[]{"test-hash-key", "field1", "value1"}, () -> jedis.hset("test-hash-key", "field1", "value1"));
        assertEquals(1, result);

        String value = executeRedis("hget", new Object[]{"test-hash-key", "field1"}, () -> jedis.hget("test-hash-key", "field1"));
        assertEquals("value1", value);

        List<Span> spans = getSpansByType("redis");
        assertEquals(2, spans.size());

        Span hsetSpan = spans.get(0);
        assertEquals("HSET", hsetSpan.getTag("command"));
        assertEquals("test-hash-key", hsetSpan.getTag("key"));
        assertNotNull(hsetSpan.getTag("host"));
        assertNotNull(hsetSpan.getTag("port"));

        Span hgetSpan = spans.get(1);
        assertEquals("HGET", hgetSpan.getTag("command"));
        assertEquals("test-hash-key", hgetSpan.getTag("key"));
        assertNotNull(hgetSpan.getTag("host"));
        assertNotNull(hgetSpan.getTag("port"));
    }

    private <T> T executeRedis(String methodName, Object[] args, RedisAction<T> action) {
        redisHandler.before("redis.clients.jedis.Jedis", methodName, args, new Object[]{jedis});
        try {
            T result = action.run();
            redisHandler.after("redis.clients.jedis.Jedis", methodName, args, result, null, null);
            return result;
        } catch (Throwable t) {
            redisHandler.after("redis.clients.jedis.Jedis", methodName, args, null, t, null);
            throw new RuntimeException(t);
        }
    }

    @FunctionalInterface
    private interface RedisAction<T> {
        T run() throws Exception;
    }
}
