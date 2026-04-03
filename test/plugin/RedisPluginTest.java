package plugin;

import base.PluginTestBase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.redis.RedisPlugin;
import redis.clients.jedis.Jedis;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Redis插件单元测试
 * @author LT Monitor Dev
 */
public class RedisPluginTest extends PluginTestBase {
    private RedisPlugin redisPlugin;
    private Jedis jedis;

    @BeforeEach
    public void setup() throws Exception {
        redisPlugin = new RedisPlugin();
        // 安装Redis插件
        installPlugin(redisPlugin);
        // 初始化Jedis（这里用Mock或者连接本地测试Redis）
        // 测试用可以用Embedded Redis
        jedis = new Jedis("localhost", 6379);
        clearSpans();
    }

    @AfterEach
    public void teardown() {
        if (jedis != null) {
            jedis.close();
        }
        clearSpans();
    }

    @Test
    public void testRedisGetCommand() {
        // 执行GET命令
        jedis.set("test-key", "test-value");
        String value = jedis.get("test-key");
        assertEquals("test-value", value);

        // 验证Span上报
        List<Span> spans = getSpansByType("redis");
        assertEquals(2, spans.size()); // SET + GET

        // 验证GET Span
        Span getSpan = spans.get(1);
        assertEquals("redis", getSpan.getType());
        assertEquals("GET", getSpan.getTag("command"));
        assertEquals("test-key", getSpan.getTag("key"));
        assertEquals("read", getSpan.getTag("operation"));
        assertEquals("success", getSpan.getTag("status"));
        assertTrue(getSpan.getSpend() >= 0);
    }

    @Test
    public void testRedisSetCommand() {
        // 执行SET命令
        String result = jedis.set("test-set-key", "test-set-value");
        assertEquals("OK", result);

        // 验证Span上报
        List<Span> spans = getSpansByType("redis");
        assertEquals(1, spans.size());

        // 验证SET Span
        Span setSpan = spans.get(0);
        assertEquals("redis", setSpan.getType());
        assertEquals("SET", setSpan.getTag("command"));
        assertEquals("test-set-key", setSpan.getTag("key"));
        assertEquals("write", setSpan.getTag("operation"));
        assertEquals("success", setSpan.getTag("status"));
    }

    @Test
    public void testRedisDelCommand() {
        // 先设置再删除
        jedis.set("test-del-key", "test-del-value");
        clearSpans();

        Long result = jedis.del("test-del-key");
        assertEquals(1, result);

        // 验证Span上报
        List<Span> spans = getSpansByType("redis");
        assertEquals(1, spans.size());

        // 验证DEL Span
        Span delSpan = spans.get(0);
        assertEquals("redis", delSpan.getType());
        assertEquals("DEL", delSpan.getTag("command"));
        assertEquals("test-del-key", delSpan.getTag("key"));
        assertEquals("write", delSpan.getTag("operation"));
        assertEquals("success", delSpan.getTag("status"));
    }

    @Test
    public void testRedisErrorCommand() {
        try {
            // 执行错误的命令
            jedis.eval("wrong lua script");
            fail("Should throw exception");
        } catch (Exception e) {
            // 预期异常
        }

        // 验证错误Span上报
        List<Span> spans = getSpansByType("redis");
        assertEquals(1, spans.size());

        Span errorSpan = spans.get(0);
        assertEquals("redis", errorSpan.getType());
        assertEquals("EVAL", errorSpan.getTag("command"));
        assertEquals("failed", errorSpan.getTag("status"));
        assertNotNull(errorSpan.getTag("error_msg"));
    }

    @Test
    public void testRedisHashCommand() {
        // 执行HSET命令
        Long result = jedis.hset("test-hash-key", "field1", "value1");
        assertEquals(1, result);

        // 执行HGET命令
        String value = jedis.hget("test-hash-key", "field1");
        assertEquals("value1", value);

        // 验证Span上报
        List<Span> spans = getSpansByType("redis");
        assertEquals(2, spans.size());

        // 验证HSET Span
        Span hsetSpan = spans.get(0);
        assertEquals("HSET", hsetSpan.getTag("command"));
        assertEquals("test-hash-key", hsetSpan.getTag("key"));
        assertEquals("write", hsetSpan.getTag("operation"));

        // 验证HGET Span
        Span hgetSpan = spans.get(1);
        assertEquals("HGET", hgetSpan.getTag("command"));
        assertEquals("test-hash-key", hgetSpan.getTag("key"));
        assertEquals("read", hgetSpan.getTag("operation"));
    }
}
