package org.xi.lt.flow.theme;

import lombok.Builder;
import lombok.Data;

/**
 * 图表主题配置 - 用于自定义流程图的颜色、字体等样式
 */
@Data
@Builder
public class ChartTheme {

    /**
     * 主题名称
     */
    private String name;

    // ========== 节点颜色 ==========

    /**
     * 方法节点颜色
     */
    @Builder.Default
    private String methodNodeColor = "#764ba2";

    /**
     * 类节点颜色
     */
    @Builder.Default
    private String classNodeColor = "#667eea";

    /**
     * 外部节点颜色
     */
    @Builder.Default
    private String externalNodeColor = "#ff9800";

    /**
     * 参与者节点颜色（时序图）
     */
    @Builder.Default
    private String participantNodeColor = "#2196F3";

    // ========== 连线颜色 ==========

    /**
     * 方法调用连线颜色
     */
    @Builder.Default
    private String callEdgeColor = "#764ba2";

    /**
     * 返回连线颜色
     */
    @Builder.Default
    private String returnEdgeColor = "#9e9e9e";

    /**
     * 继承关系颜色
     */
    @Builder.Default
    private String inheritanceColor = "#4caf50";

    /**
     * 关联关系颜色
     */
    @Builder.Default
    private String associationColor = "#2196f3";

    // ========== 字体配置 ==========

    /**
     * 字体名称
     */
    @Builder.Default
    private String fontName = "Arial";

    /**
     * 字体大小
     */
    @Builder.Default
    private int fontSize = 14;

    /**
     * 标题字体大小
     */
    @Builder.Default
    private int titleFontSize = 18;

    // ========== 布局配置 ==========

    /**
     * DPI (图像分辨率)
     */
    @Builder.Default
    private int dpi = 150;

    /**
     * 背景颜色
     */
    @Builder.Default
    private String backgroundColor = "#ffffff";

    /**
     * 活动图背景色
     */
    @Builder.Default
    private String activityBackgroundColor = "#e8f4fd";

    /**
     * 是否显示阴影
     */
    @Builder.Default
    private boolean showShadow = true;

    /**
     * 圆角大小
     */
    @Builder.Default
    private int roundCorner = 10;

    // ========== 预设主题 ==========

    /**
     * 默认主题
     */
    public static ChartTheme defaultTheme() {
        return ChartTheme.builder().name("default").build();
    }

    /**
     * 深色主题
     */
    public static ChartTheme darkTheme() {
        return ChartTheme.builder()
                .name("dark")
                .methodNodeColor("#bb86fc")
                .classNodeColor("#6200ee")
                .externalNodeColor("#ff9800")
                .participantNodeColor("#03dac6")
                .callEdgeColor("#bb86fc")
                .returnEdgeColor("#666666")
                .inheritanceColor("#03dac6")
                .associationColor("#2196f3")
                .backgroundColor("#121212")
                .activityBackgroundColor("#1e1e1e")
                .build();
    }

    /**
     * 清新主题
     */
    public static ChartTheme freshTheme() {
        return ChartTheme.builder()
                .name("fresh")
                .methodNodeColor("#00b894")
                .classNodeColor("#0984e3")
                .externalNodeColor("#fdcb6e")
                .participantNodeColor("#e17055")
                .callEdgeColor("#00b894")
                .returnEdgeColor("#b2bec3")
                .inheritanceColor("#00b894")
                .associationColor("#0984e3")
                .backgroundColor("#ffffff")
                .activityBackgroundColor("#dfe6e9")
                .build();
    }

    /**
     * 暖色调主题
     */
    public static ChartTheme warmTheme() {
        return ChartTheme.builder()
                .name("warm")
                .methodNodeColor("#e17055")
                .classNodeColor("#d63031")
                .externalNodeColor("#fdcb6e")
                .participantNodeColor("#00b894")
                .callEdgeColor("#e17055")
                .returnEdgeColor("#b2bec3")
                .inheritanceColor("#00b894")
                .associationColor("#d63031")
                .backgroundColor("#fffaf0")
                .activityBackgroundColor("#ffeaa7")
                .build();
    }

    /**
     * 海洋主题
     */
    public static ChartTheme oceanTheme() {
        return ChartTheme.builder()
                .name("ocean")
                .methodNodeColor("#0077b6")
                .classNodeColor("#00b4d8")
                .externalNodeColor("#90e0ef")
                .participantNodeColor("#caf0f8")
                .callEdgeColor("#0077b6")
                .returnEdgeColor("#adb5bd")
                .inheritanceColor("#00b4d8")
                .associationColor("#0077b6")
                .backgroundColor("#ffffff")
                .activityBackgroundColor("#e0f7fa")
                .build();
    }

    /**
     * 森林主题
     */
    public static ChartTheme forestTheme() {
        return ChartTheme.builder()
                .name("forest")
                .methodNodeColor("#2d6a4f")
                .classNodeColor("#40916c")
                .externalNodeColor("#95d5b2")
                .participantNodeColor("#d8f3dc")
                .callEdgeColor("#2d6a4f")
                .returnEdgeColor("#adb5bd")
                .inheritanceColor("#40916c")
                .associationColor("#2d6a4f")
                .backgroundColor("#ffffff")
                .activityBackgroundColor("#e8f5e9")
                .build();
    }

    /**
     * 日落主题
     */
    public static ChartTheme sunsetTheme() {
        return ChartTheme.builder()
                .name("sunset")
                .methodNodeColor("#e07a5f")
                .classNodeColor("#f4a261")
                .externalNodeColor("#f8edeb")
                .participantNodeColor("#3d405b")
                .callEdgeColor("#e07a5f")
                .returnEdgeColor("#adb5bd")
                .inheritanceColor("#f4a261")
                .associationColor("#e07a5f")
                .backgroundColor("#ffffff")
                .activityBackgroundColor("#fff1e6")
                .build();
    }

    /**
     * 樱花主题
     */
    public static ChartTheme sakuraTheme() {
        return ChartTheme.builder()
                .name("sakura")
                .methodNodeColor("#ff6b6b")
                .classNodeColor("#f8a5c2")
                .externalNodeColor("#ffe0e6")
                .participantNodeColor("#ffe66d")
                .callEdgeColor("#ff6b6b")
                .returnEdgeColor("#adb5bd")
                .inheritanceColor("#f8a5c2")
                .associationColor("#ff6b6b")
                .backgroundColor("#fff5f5")
                .activityBackgroundColor("#ffebee")
                .build();
    }

    /**
     * 星空主题
     */
    public static ChartTheme starryTheme() {
        return ChartTheme.builder()
                .name("starry")
                .methodNodeColor("#3a0ca3")
                .classNodeColor("#4361ee")
                .externalNodeColor("#4cc9f0")
                .participantNodeColor("#f72585")
                .callEdgeColor("#3a0ca3")
                .returnEdgeColor("#6c757d")
                .inheritanceColor("#4361ee")
                .associationColor("#3a0ca3")
                .backgroundColor("#0f0f23")
                .activityBackgroundColor("#1a1a2e")
                .build();
    }

    /**
     * 薄荷主题
     */
    public static ChartTheme mintTheme() {
        return ChartTheme.builder()
                .name("mint")
                .methodNodeColor("#11998e")
                .classNodeColor("#38ef7d")
                .externalNodeColor("#d4fc79")
                .participantNodeColor("#96e6a1")
                .callEdgeColor("#11998e")
                .returnEdgeColor("#adb5bd")
                .inheritanceColor("#38ef7d")
                .associationColor("#11998e")
                .backgroundColor("#ffffff")
                .activityBackgroundColor("#e6fff0")
                .build();
    }

    /**
     * 玫瑰主题
     */
    public static ChartTheme roseTheme() {
        return ChartTheme.builder()
                .name("rose")
                .methodNodeColor("#c9184a")
                .classNodeColor("#ff4d6d")
                .externalNodeColor("#ffb3c1")
                .participantNodeColor("#fbb1bd")
                .callEdgeColor("#c9184a")
                .returnEdgeColor("#adb5bd")
                .inheritanceColor("#ff4d6d")
                .associationColor("#c9184a")
                .backgroundColor("#fff0f3")
                .activityBackgroundColor("#ffe0e6")
                .build();
    }

    /**
     * 极光主题
     */
    public static ChartTheme auroraTheme() {
        return ChartTheme.builder()
                .name("aurora")
                .methodNodeColor("#00f5d4")
                .classNodeColor("#7209b7")
                .externalNodeColor("#f15bb5")
                .participantNodeColor("#fee440")
                .callEdgeColor("#00f5d4")
                .returnEdgeColor("#6c757d")
                .inheritanceColor("#7209b7")
                .associationColor("#00f5d4")
                .backgroundColor("#1a1a2e")
                .activityBackgroundColor("#16213e")
                .build();
    }

    /**
     * 莫兰迪主题
     */
    public static ChartTheme morandiTheme() {
        return ChartTheme.builder()
                .name("morandi")
                .methodNodeColor("#9c6e7f")
                .classNodeColor("#6e8ca5")
                .externalNodeColor("#d4c5b9")
                .participantNodeColor("#a8c4a5")
                .callEdgeColor("#9c6e7f")
                .returnEdgeColor("#9a9a9a")
                .inheritanceColor("#6e8ca5")
                .associationColor("#9c6e7f")
                .backgroundColor("#f5f1eb")
                .activityBackgroundColor("#ebe5dc")
                .build();
    }

    /**
     * 根据主题名称获取主题
     */
    public static ChartTheme getTheme(String themeName) {
        if (themeName == null) {
            return defaultTheme();
        }
        switch (themeName.toLowerCase()) {
            case "dark":
                return darkTheme();
            case "fresh":
                return freshTheme();
            case "warm":
                return warmTheme();
            case "ocean":
                return oceanTheme();
            case "forest":
                return forestTheme();
            case "sunset":
                return sunsetTheme();
            case "sakura":
                return sakuraTheme();
            case "starry":
                return starryTheme();
            case "mint":
                return mintTheme();
            case "rose":
                return roseTheme();
            case "aurora":
                return auroraTheme();
            case "morandi":
                return morandiTheme();
            default:
                return defaultTheme();
        }
    }

    /**
     * 获取所有预设主题
     */
    public static java.util.List<ChartTheme> getAllThemes() {
        return java.util.Arrays.asList(
            defaultTheme(),
            darkTheme(),
            freshTheme(),
            warmTheme(),
            oceanTheme(),
            forestTheme(),
            sunsetTheme(),
            sakuraTheme(),
            starryTheme(),
            mintTheme(),
            roseTheme(),
            auroraTheme(),
            morandiTheme()
        );
    }
}
