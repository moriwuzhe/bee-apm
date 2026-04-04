
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

package org.xi.lt.server.web.diagnostic.serverside.configuration;

import org.xi.lt.server.core.common.ConfigHolder;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

/**
 * Adapted for bee-apm configuration mechanism
 */
public final class DynamicConfigLoader {

    private DynamicConfigLoader() {
    }

    public static <T> DynamicConfig<T> load(final String name) {
        return load(name, true);
    }

    @SuppressWarnings("unchecked")
    public static <T> DynamicConfig<T> load(final String name, final boolean failOnNotExist) {
        // Create a mock DynamicConfig using ConfigHolder properties
        return (DynamicConfig<T>) new DynamicConfig<T>() {
            @Override
            public void addListener(DynamicConfigListener<T> listener) {
                // Static config, no listener support needed
            }

            @Override
            public void removeListener(DynamicConfigListener<T> listener) {
            }

            @Override
            public T get() {
                return null;
            }

            @Override
            public String getString(String key) {
                return ConfigHolder.getProperty(key, "");
            }

            @Override
            public String getString(String key, String def) {
                return ConfigHolder.getProperty(key, def);
            }

            @Override
            public int getInt(String key) {
                return ConfigHolder.getPropInt(key, 0);
            }

            @Override
            public int getInt(String key, int def) {
                return ConfigHolder.getPropInt(key, def);
            }

            @Override
            public long getLong(String key) {
                return Long.parseLong(ConfigHolder.getProperty(key, "0"));
            }

            @Override
            public long getLong(String key, long def) {
                return Long.parseLong(ConfigHolder.getProperty(key, String.valueOf(def)));
            }

            @Override
            public double getDouble(String key) {
                return Double.parseDouble(ConfigHolder.getProperty(key, "0.0"));
            }

            @Override
            public double getDouble(String key, double def) {
                return Double.parseDouble(ConfigHolder.getProperty(key, String.valueOf(def)));
            }

            @Override
            public boolean getBoolean(String key) {
                return Boolean.parseBoolean(ConfigHolder.getProperty(key, "false"));
            }

            @Override
            public boolean getBoolean(String key, boolean def) {
                return Boolean.parseBoolean(ConfigHolder.getProperty(key, String.valueOf(def)));
            }

            @Override
            public Map<String, String> asMap() {
                Map<String, String> map = new HashMap<>();
                Properties props = ConfigHolder.getAllProperties();
                for (String key : props.stringPropertyNames()) {
                    map.put(key, props.getProperty(key));
                }
                return map;
            }
        };
    }
}
