package org.xi.lt.code.parser;

import java.util.HashMap;
import java.util.Map;

/**
 * 代码索引器工厂 - 根据文件类型选择合适的索引器
 */
public class CodeIndexerFactory {

    private static final Map<String, CodeIndexer> indexers = new HashMap<>();

    static {
        // 注册各种语言的索引器
        registerIndexer(new JavaCodeIndexer());
        registerIndexer(new PythonCodeIndexer());
        registerIndexer(new TypeScriptCodeIndexer());
        registerIndexer(new GoCodeIndexer());
    }

    // 注册索引器
    private static void registerIndexer(CodeIndexer indexer) {
        for (String language : indexer.getSupportedLanguages()) {
            indexers.put(language.toLowerCase(), indexer);
        }
    }

    /**
     * 根据文件扩展名获取合适的索引器
     * @param fileExtension 文件扩展名
     * @return 代码索引器
     */
    public static CodeIndexer getIndexerByExtension(String fileExtension) {
        if (fileExtension == null) {
            return null;
        }
        String ext = fileExtension.toLowerCase();
        // 处理一些特殊情况
        if (ext.equals("tsx")) {
            return indexers.get("tsx");
        } else if (ext.equals("ts")) {
            return indexers.get("ts");
        }
        return indexers.get(ext);
    }

    /**
     * 根据语言名称获取合适的索引器
     * @param language 语言名称
     * @return 代码索引器
     */
    public static CodeIndexer getIndexerByLanguage(String language) {
        if (language == null) {
            return null;
        }
        return indexers.get(language.toLowerCase());
    }

    /**
     * 获取所有支持的语言
     * @return 支持的语言列表
     */
    public static String[] getSupportedLanguages() {
        return indexers.keySet().toArray(new String[0]);
    }
}