/*
 * Copyright (C) 2019 Qunar, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

package org.xi.lt.server.web.diagnostic.proxy.communicate.agent.handler;

import com.google.common.collect.ImmutableSet;
import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.common.util.concurrent.MoreExecutors;
import io.netty.channel.ChannelHandlerContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.web.diagnostic.common.JacksonSerializer;
import org.xi.lt.server.web.diagnostic.proxy.config.AgentInfoManager;
import org.xi.lt.server.web.diagnostic.proxy.generator.IdGenerator;
import org.xi.lt.server.web.diagnostic.proxy.util.ChannelUtils;
import org.xi.lt.server.web.diagnostic.proxy.util.FutureSuccessCallBack;
import org.xi.lt.server.web.diagnostic.remoting.protocol.CommandCode;
import org.xi.lt.server.web.diagnostic.remoting.protocol.Datagram;
import org.xi.lt.server.web.diagnostic.remoting.protocol.RemotingBuilder;
import org.xi.lt.server.web.diagnostic.remoting.protocol.payloadHolderImpl.RequestPayloadHolder;
import org.xi.lt.server.web.diagnostic.serverside.metrics.Metrics;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * @author zhenyu.nie created on 2019 2019/5/15 13:45
 */
@Service
public class AgentInfoRefreshProcessor implements AgentMessageProcessor {

    @Autowired
    private AgentInfoManager agentInfoManager;

    @Autowired
    private IdGenerator generator;

    @Override
    public Set<Integer> codes() {
        return ImmutableSet.of(CommandCode.REQ_TYPE_REFRESH_AGENT_INFO.getCode());
    }

    @Override
    public void process(final ChannelHandlerContext ctx, Datagram message) {
        Metrics.counter("agent_info_refresh").inc();
        String ip = ChannelUtils.getIp(ctx.channel());
        ListenableFuture<Map<String, String>> agentInfoFuture = agentInfoManager.getAgentInfo(ip);
        Futures.addCallback(agentInfoFuture, (FutureSuccessCallBack<Map<String, String>>) agentInfo ->
                Optional.ofNullable(agentInfo)
                        .map(AgentInfoRefreshProcessor.this::createAgentInfoResponse)
                        .ifPresent((ctx::writeAndFlush)), MoreExecutors.directExecutor());
    }

    private Datagram createAgentInfoResponse(Map<String, String> agentInfo) {
        String data = JacksonSerializer.serialize(agentInfo);
        return RemotingBuilder.buildRequestDatagram(CommandCode.REQ_TYPE_REFRESH_AGENT_INFO.getCode(), generator.generateId(), new RequestPayloadHolder(data));
    }
}
