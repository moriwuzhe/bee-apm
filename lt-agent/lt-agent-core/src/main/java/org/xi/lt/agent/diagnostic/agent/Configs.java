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

package org.xi.lt.agent.diagnostic.agent;

import com.google.common.base.Strings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xi.lt.agent.config.ConfigUtils;

/**
 * @author zhenyu.nie created on 2018 2018/10/25 17:08
 */
class Configs {

    private static final Logger logger = LoggerFactory.getLogger(Configs.class);

    public static ProxyConfig getProxyConfig() {
        ProxyConfig config = new ProxyConfig();
        
        // Read from VM options first, fallback to config.yml
        String host = System.getProperty("bistoury.proxy.host", ConfigUtils.me().getStr("bistoury.proxy.host"));
        if (Strings.isNullOrEmpty(host)) {
            logger.warn("bistoury.proxy.host is not configured, diagnostic agent connection is disabled.");
            return null;
        }
        
        config.setIp(host);
        
        // Read port (default 3333 for bistoury netty server)
        int port = ConfigUtils.me().getInt("bistoury.proxy.port", 3333);
        String portStr = System.getProperty("bistoury.proxy.port");
        if (!Strings.isNullOrEmpty(portStr)) {
            port = Integer.parseInt(portStr);
        }
        config.setPort(port);
        
        // Read heartbeat
        int heartbeat = ConfigUtils.me().getInt("bistoury.proxy.heartbeat", 30);
        config.setHeartbeatSec(heartbeat);
        
        return config;
    }

}
