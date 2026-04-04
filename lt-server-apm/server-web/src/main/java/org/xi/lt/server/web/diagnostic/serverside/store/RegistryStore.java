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

package org.xi.lt.server.web.diagnostic.serverside.store;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

/**
 * @author zhenyu.nie created on 2018 2018/11/9 11:27
 */
@Component
public class RegistryStore {

    private String newBaseRoot = "/bistoury/proxy/new/group/";

    @Value("${zk.url:127.0.0.1:2181}")
    private String zkAddress;

    private String pathForNewUi;


    @PostConstruct
    public void init() {
        pathForNewUi = newBaseRoot + "ui";
    }

    public String getZkAddress() {
        return zkAddress;
    }

    public String getProxyZkPathForNewUi() {
        return pathForNewUi;
    }
}
