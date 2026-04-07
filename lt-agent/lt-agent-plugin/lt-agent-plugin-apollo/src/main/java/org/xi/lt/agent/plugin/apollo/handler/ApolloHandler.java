package org.xi.lt.agent.plugin.apollo.handler;

import com.ctrip.framework.apollo.model.ConfigChange;
import com.ctrip.framework.apollo.model.ConfigChangeEvent;
import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.LtConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

import java.util.Set;

/**
 * Apollo配置中心拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class ApolloHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("ApolloHandler");
    private static final ThreadLocal<Span> CURRENT_SPAN = new ThreadLocal<>();

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        // Apollo的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return null;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        // Apollo的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return result;
    }

    /**
     * 获取配置属性前
     */
    public void beforeGetProperty(String className, String methodName, Object[] allArguments, Object target) {
        try {
            if (allArguments.length >= 1 && allArguments[0] instanceof String) {
                String key = (String) allArguments[0];
                Object defaultValue = allArguments.length >= 2 ? allArguments[1] : null;
                
                Span span = SpanManager.createEntrySpan("apollo_config_get");
                span.addTag("type", "config");
                span.addTag("action", "get_property");
                span.addTag("key", key);
                if (defaultValue != null) {
                    span.addTag("default_value_type", defaultValue.getClass().getSimpleName());
                }
                CURRENT_SPAN.set(span);
            }
        } catch (Exception e) {
            log.error("ApolloHandler beforeGetProperty error", e);
        }
    }

    /**
     * 获取配置属性后
     */
    public void afterGetProperty(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null) {
                span.setSpend(cost);
                if (t != null) {
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                } else {
                    span.addTag("status", "success");
                    span.addTag("value_exists", String.valueOf(result != null));
                }
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("ApolloHandler afterGetProperty error", e);
        } finally {
            CURRENT_SPAN.remove();
        }
    }

    /**
     * 配置监听操作前
     */
    public void beforeListenerOperation(String className, String methodName, Object[] allArguments, Object target) {
        try {
            Span span = SpanManager.createEntrySpan("apollo_config_listener");
            span.addTag("type", "config");
            span.addTag("action", methodName);
            CURRENT_SPAN.set(span);
        } catch (Exception e) {
            log.error("ApolloHandler beforeListenerOperation error", e);
        }
    }

    /**
     * 配置监听操作后
     */
    public void afterListenerOperation(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null) {
                span.setSpend(cost);
                if (t != null) {
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                } else {
                    span.addTag("status", "success");
                }
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("ApolloHandler afterListenerOperation error", e);
        } finally {
            CURRENT_SPAN.remove();
        }
    }

    /**
     * 配置变更通知前
     */
    public void beforeConfigChange(String className, String methodName, Object[] allArguments, Object target) {
        try {
            if (allArguments.length >= 1 && allArguments[0] instanceof ConfigChangeEvent) {
                ConfigChangeEvent event = (ConfigChangeEvent) allArguments[0];
                Set<String> changedKeys = event.changedKeys();
                
                Span span = SpanManager.createEntrySpan("apollo_config_change");
                span.addTag("type", "config");
                span.addTag("action", "change");
                span.addTag("namespace", event.getNamespace());
                span.addTag("changed_keys_count", String.valueOf(changedKeys.size()));
                
                // 记录变更详情
                int index = 0;
                for (String key : changedKeys) {
                    if (index >= 10) { // 最多记录10个变更key，避免过多
                        break;
                    }
                    ConfigChange change = event.getChange(key);
                    span.addTag("change." + index + ".key", key);
                    span.addTag("change." + index + ".old_value", String.valueOf(change.getOldValue()));
                    span.addTag("change." + index + ".new_value", String.valueOf(change.getNewValue()));
                    span.addTag("change." + index + ".type", change.getChangeType().name());
                    index++;
                }
                if (changedKeys.size() > 10) {
                    span.addTag("change.more_count", String.valueOf(changedKeys.size() - 10));
                }
                
                CURRENT_SPAN.set(span);
            }
        } catch (Exception e) {
            log.error("ApolloHandler beforeConfigChange error", e);
        }
    }

    /**
     * 配置变更通知后
     */
    public void afterConfigChange(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null) {
                span.setSpend(cost);
                if (t != null) {
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                } else {
                    span.addTag("status", "success");
                }
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("ApolloHandler afterConfigChange error", e);
        } finally {
            CURRENT_SPAN.remove();
        }
    }

    /**
     * 配置加载/同步前
     */
    public void beforeConfigLoad(String className, String methodName, Object[] allArguments, Object target) {
        try {
            Span span = SpanManager.createEntrySpan("apollo_config_load");
            span.addTag("type", "config");
            span.addTag("action", methodName);
            span.addTag("repository_type", className.contains("Remote") ? "remote" : "local");
            CURRENT_SPAN.set(span);
        } catch (Exception e) {
            log.error("ApolloHandler beforeConfigLoad error", e);
        }
    }

    /**
     * 配置加载/同步后
     */
    public void afterConfigLoad(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null) {
                span.setSpend(cost);
                if (t != null) {
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                } else {
                    span.addTag("status", "success");
                }
                LtConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("ApolloHandler afterConfigLoad error", e);
        } finally {
            CURRENT_SPAN.remove();
        }
    }
}
