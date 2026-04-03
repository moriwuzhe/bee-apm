package org.xi.lt.agent.plugin.mongodb.handler;

import com.mongodb.MongoNamespace;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

import java.lang.reflect.Field;
import java.util.Optional;

/**
 * MongoDB调用拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class MongoDBHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("MongoDBHandler");

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        try {
            // 创建MongoDB操作Span
            Span span = SpanManager.createEntrySpan("mongodb");
            
            Object collection = extVal[0];
            
            // 获取命名空间（数据库名 + 集合名）
            Optional<MongoNamespace> namespaceOpt = getNamespace(collection);
            namespaceOpt.ifPresent(namespace -> {
                span.addTag("db", namespace.getDatabaseName());
                span.addTag("collection", namespace.getCollectionName());
            });
            
            // 提取操作类型
            String opType = methodName.replace("execute", "");
            span.addTag("operation", opType);
            
            // 提取操作参数
            if (allArguments != null && allArguments.length > 0) {
                Object firstArg = allArguments[0];
                if (firstArg != null) {
                    span.addTag("arg_type", firstArg.getClass().getSimpleName());
                    // 可以选择采集参数的toString，注意不要采集太大的数据
                    // span.addTag("argument", firstArg.toString());
                }
            }
            
            return span;
        } catch (Exception e) {
            log.error("MongoDBHandler before error", e);
            return null;
        }
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        try {
            Span span = SpanManager.getExitSpan();
            if (span != null && span.getType().equals("mongodb")) {
                // 计算耗时
                calculateSpend(span);
                
                // 处理异常
                if (t != null) {
                    span.addTag("error", "true");
                    span.addTag("error.message", t.getMessage());
                }
                
                // 上报Span
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
            return result;
        } catch (Exception e) {
            log.error("MongoDBHandler after error", e);
            return result;
        }
    }

    /**
     * 反射获取MongoCollection的命名空间
     */
    private Optional<MongoNamespace> getNamespace(Object collection) {
        try {
            Field namespaceField;
            try {
                namespaceField = collection.getClass().getDeclaredField("namespace");
            } catch (NoSuchFieldException e) {
                // 兼容不同版本的字段名
                namespaceField = collection.getClass().getDeclaredField("namespace");
            }
            namespaceField.setAccessible(true);
            return Optional.ofNullable((MongoNamespace) namespaceField.get(collection));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
