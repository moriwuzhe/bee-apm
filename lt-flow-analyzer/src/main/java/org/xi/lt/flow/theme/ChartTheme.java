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
            default:
                return defaultTheme();
        }
    }
}
