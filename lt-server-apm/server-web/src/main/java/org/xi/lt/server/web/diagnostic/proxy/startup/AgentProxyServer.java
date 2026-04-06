package org.xi.lt.server.web.diagnostic.proxy.startup;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.xi.lt.server.web.diagnostic.proxy.communicate.agent.NettyServerForAgent;
import org.xi.lt.server.web.diagnostic.proxy.communicate.agent.handler.AgentMessageHandler;
import org.xi.lt.server.web.diagnostic.proxy.communicate.agent.handler.AgentMessageProcessor;
import org.xi.lt.server.web.diagnostic.serverside.agile.Conf;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class AgentProxyServer {
    @Value("${server.port:8081}")
    int tomcatPort;

    @Value("${agent.port:3333}")
    int agentPort;

    @Autowired
    private List<AgentMessageProcessor> agentMessageProcessors;

    private NettyServerForAgent server;

    @PostConstruct
    public void start() {
        Map<String, String> map = new HashMap<>();
        map.put("server.port", String.valueOf(agentPort));
        map.put("tomcat.port", String.valueOf(tomcatPort));
        Conf conf = Conf.fromMap(map);

        AgentMessageHandler handler = new AgentMessageHandler(agentMessageProcessors);
        server = new NettyServerForAgent(conf, handler);
        server.start();
    }

    @PreDestroy
    public void stop() {
        if (server != null) {
            server.stop();
        }
    }
}
