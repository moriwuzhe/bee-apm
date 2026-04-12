package org.xi.lt.agent.plugin;

import org.xi.lt.agent.loader.AbstractLoader;
import org.xi.lt.agent.log.LogUtil;

import java.util.*;

/**
 * 插件加载
 *
 * @author yuan
 */
public class PluginLoader extends AbstractLoader {
    public static List<AbstractPlugin> loadPlugins() {
        Map<String, AbstractPlugin> pluginMap = load(new String[]{"plugins", "ext-lib"}, "lt-plugin.def");
        List<AbstractPlugin> pluginList = new ArrayList<AbstractPlugin>(16);
        for (Map.Entry<String, AbstractPlugin> entry : pluginMap.entrySet()) {
            AbstractPlugin plugin = entry.getValue();
            pluginList.add(plugin);
            LogUtil.log("plugin-name:" + plugin.getName());
        }
        Collections.sort(pluginList, new Comparator<AbstractPlugin>() {
            @Override
            public int compare(AbstractPlugin o1, AbstractPlugin o2) {
                return o2.order() - o1.order();
            }
        });
        return pluginList;
    }
}
