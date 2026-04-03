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

package org.xi.lt.agent.diagnostic.commands.monitor;

import com.google.common.collect.ImmutableSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xi.lt.agent.diagnostic.agent.common.ResponseHandler;
import org.xi.lt.agent.diagnostic.remoting.command.MonitorCommand;
import org.xi.lt.agent.diagnostic.remoting.netty.Task;
import org.xi.lt.agent.diagnostic.remoting.netty.TaskFactory;
import org.xi.lt.agent.diagnostic.remoting.protocol.CommandCode;
import org.xi.lt.agent.diagnostic.remoting.protocol.RemotingHeader;

import java.util.Set;

/**
 * @author: leix.xie
 * @date: 2019/1/9 15:10
 * @describe：
 */
public class QMonitorQueryTaskFactory implements TaskFactory<MonitorCommand> {
    private static final Logger logger = LoggerFactory.getLogger(QMonitorQueryTaskFactory.class);

    private static final String NAME = "qmonitorQuery";

    @Override
    public Set<Integer> codes() {
        return ImmutableSet.of(CommandCode.REQ_TYPE_QMONITOR_QUERY.getCode());
    }

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public Task create(RemotingHeader header, MonitorCommand command, ResponseHandler handler) {
        return new QMonitorQueryTask(header.getId(), command, handler, header.getMaxRunningMs());
    }
}
