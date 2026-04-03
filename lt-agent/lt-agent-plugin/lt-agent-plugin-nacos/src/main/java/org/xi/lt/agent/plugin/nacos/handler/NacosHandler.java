package org.xi.lt.agent.plugin.nacos.handler;

import org.xi.lt.agent.common.*;
import org.xi.lt.agent.config.BeeConfig;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.plugin.handler.AbstractHandler;
import org.xi.lt.agent.reporter.ReporterFactory;

/**
 * Nacos配置中心/服务注册发现拦截处理器
 * @author LT Monitor Dev
 * @date 2026/04/03
 */
public class NacosHandler extends AbstractHandler {
    private static final ILog log = LogFactory.getLog("NacosHandler");
    private static final ThreadLocal<Span> CURRENT_SPAN = new ThreadLocal<>();

    @Override
    public Span before(String className, String methodName, Object[] allArguments, Object[] extVal) {
        // Nacos的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return null;
    }

    @Override
    public Object after(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object[] extVal) {
        // Nacos的处理逻辑在Advice里分发给了具体方法，这里不需要处理
        return result;
    }

    /**
     * 拉取配置前
     */
    public void beforeGetConfig(String className, String methodName, Object[] allArguments, Object target) {
        try {
            if (allArguments.length >= 2) {
                String dataId = (String) allArguments[0];
                String group = (String) allArguments[1];
                
                Span span = SpanManager.createEntrySpan("nacos_config_get");
                span.addTag("type", "config");
                span.addTag("action", "get");
                span.addTag("data_id", dataId);
                span.addTag("group", group);
                if (allArguments.length >= 3) {
                    span.addTag("timeout_ms", allArguments[2].toString());
                }
                CURRENT_SPAN.set(span);
            }
        } catch (Exception e) {
            log.error("NacosHandler beforeGetConfig error", e);
        }
    }

    /**
     * 拉取配置后
     */
    public void afterGetConfig(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null) {
                span.setSpend(cost);
                if (t != null) {
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                } else {
                    span.addTag("status", "success");
                    if (result instanceof String) {
                        String content = (String) result;
                        span.addTag("content_length", String.valueOf(content.length()));
                    }
                }
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("NacosHandler afterGetConfig error", e);
        } finally {
            CURRENT_SPAN.remove();
        }
    }

    /**
     * 配置监听操作前
     */
    public void beforeListenerOperation(String className, String methodName, Object[] allArguments, Object target) {
        try {
            if (allArguments.length >= 2) {
                String dataId = (String) allArguments[0];
                String group = (String) allArguments[1];
                
                Span span = SpanManager.createEntrySpan("nacos_config_listener");
                span.addTag("type", "config");
                span.addTag("action", methodName);
                span.addTag("data_id", dataId);
                span.addTag("group", group);
                CURRENT_SPAN.set(span);
            }
        } catch (Exception e) {
            log.error("NacosHandler beforeListenerOperation error", e);
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
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("NacosHandler afterListenerOperation error", e);
        } finally {
            CURRENT_SPAN.remove();
        }
    }

    /**
     * 配置变更通知前
     */
    public void beforeConfigChange(String className, String methodName, Object[] allArguments, Object target) {
        try {
            if (allArguments.length >= 1 && allArguments[0] instanceof String) {
                String configInfo = (String) allArguments[0];
                
                Span span = SpanManager.createEntrySpan("nacos_config_change");
                span.addTag("type", "config");
                span.addTag("action", "change");
                span.addTag("content_length", String.valueOf(configInfo.length()));
                CURRENT_SPAN.set(span);
            }
        } catch (Exception e) {
            log.error("NacosHandler beforeConfigChange error", e);
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
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("NacosHandler afterConfigChange error", e);
        } finally {
            CURRENT_SPAN.remove();
        }
    }

    /**
     * 服务注册/注销前
     */
    public void beforeServiceRegister(String className, String methodName, Object[] allArguments, Object target) {
        try {
            if (allArguments.length >= 1 && allArguments[0] instanceof String) {
                String serviceName = (String) allArguments[0];
                
                Span span = SpanManager.createEntrySpan("nacos_service_register");
                span.addTag("type", "service");
                span.addTag("action", methodName);
                span.addTag("service_name", serviceName);
                if (allArguments.length >= 3) {
                    span.addTag("ip", allArguments[1].toString());
                    span.addTag("port", allArguments[2].toString());
                }
                CURRENT_SPAN.set(span);
            }
        } catch (Exception e) {
            log.error("NacosHandler beforeServiceRegister error", e);
        }
    }

    /**
     * 服务注册/注销后
     */
    public void afterServiceRegister(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
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
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("NacosHandler afterServiceRegister error", e);
        } finally {
            CURRENT_SPAN.remove();
        }
    }

    /**
     * 服务发现前
     */
    public void beforeServiceDiscovery(String className, String methodName, Object[] allArguments, Object target) {
        try {
            if (allArguments.length >= 1 && allArguments[0] instanceof String) {
                String serviceName = (String) allArguments[0];
                
                Span span = SpanManager.createEntrySpan("nacos_service_discovery");
                span.addTag("type", "service");
                span.addTag("action", methodName);
                span.addTag("service_name", serviceName);
                CURRENT_SPAN.set(span);
            }
        } catch (Exception e) {
            log.error("NacosHandler beforeServiceDiscovery error", e);
        }
    }

    /**
     * 服务发现后
     */
    public void afterServiceDiscovery(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
        try {
            Span span = CURRENT_SPAN.get();
            if (span != null) {
                span.setSpend(cost);
                if (t != null) {
                    span.addTag("status", "failed");
                    span.addTag("error_msg", t.getMessage());
                } else {
                    span.addTag("status", "success");
                    // 这里可以统计返回的实例数量
                }
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("NacosHandler afterServiceDiscovery error", e);
        } finally {
            CURRENT_SPAN.remove();
        }
    }

    /**
     * 服务订阅前
     */
    public void beforeServiceSubscribe(String className, String methodName, Object[] allArguments, Object target) {
        try {
            if (allArguments.length >= 1 && allArguments[0] instanceof String) {
                String serviceName = (String) allArguments[0];
                
                Span span = SpanManager.createEntrySpan("nacos_service_subscribe");
                span.addTag("type", "service");
                span.addTag("action", methodName);
                span.addTag("service_name", serviceName);
                CURRENT_SPAN.set(span);
            }
        } catch (Exception e) {
            log.error("NacosHandler beforeServiceSubscribe error", e);
        }
    }

    /**
     * 服务订阅后
     */
    public void afterServiceSubscribe(String className, String methodName, Object[] allArguments, Object result, Throwable t, Object target, long cost) {
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
                BeeConfig.me().fillEnvInfo(span);
                ReporterFactory.report(span);
            }
        } catch (Exception e) {
            log.error("NacosHandler afterServiceSubscribe error", e);
        } finally {
            CURRENT_SPAN.remove();
        }
    }
}
