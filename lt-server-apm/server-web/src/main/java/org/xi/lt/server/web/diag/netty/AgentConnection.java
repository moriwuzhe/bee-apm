package org.xi.lt.server.web.diag.netty;

import io.netty.channel.Channel;

public class AgentConnection {
    private final String agentId;
    private final int version;
    private final Channel channel;

    public AgentConnection(String agentId, int version, Channel channel) {
        this.agentId = agentId;
        this.version = version;
        this.channel = channel;
    }

    public String getAgentId() {
        return agentId;
    }

    public int getVersion() {
        return version;
    }

    public boolean isActive() {
        return channel != null && channel.isActive();
    }

    public boolean isWritable() {
        return channel != null && channel.isWritable();
    }

    Channel getChannel() {
        return channel;
    }
}
