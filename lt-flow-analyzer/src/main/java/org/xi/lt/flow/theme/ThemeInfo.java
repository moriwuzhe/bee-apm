package org.xi.lt.flow.theme;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 主题信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThemeInfo {
    private String name;
    private String displayName;
    private String icon;
    private String methodNodeColor;
    private String classNodeColor;
    private String externalNodeColor;
    private String backgroundColor;

    public static ThemeInfo from(ChartTheme theme) {
        if (theme == null) {
            return null;
        }
        return ThemeInfo.builder()
                .name(theme.getName())
                .displayName(getDisplayName(theme.getName()))
                .icon(getIcon(theme.getName()))
                .methodNodeColor(theme.getMethodNodeColor())
                .classNodeColor(theme.getClassNodeColor())
                .externalNodeColor(theme.getExternalNodeColor())
                .backgroundColor(theme.getBackgroundColor())
                .build();
    }

    private static String getDisplayName(String themeName) {
        if (themeName == null) {
            return "默认";
        }
        switch (themeName.toLowerCase()) {
            case "default":
                return "默认";
            case "dark":
                return "深色";
            case "fresh":
                return "清新";
            case "warm":
                return "暖色调";
            case "ocean":
                return "海洋";
            case "forest":
                return "森林";
            case "sunset":
                return "日落";
            case "sakura":
                return "樱花";
            case "starry":
                return "星空";
            case "mint":
                return "薄荷";
            case "rose":
                return "玫瑰";
            case "aurora":
                return "极光";
            case "morandi":
                return "莫兰迪";
            default:
                return themeName;
        }
    }

    private static String getIcon(String themeName) {
        if (themeName == null) {
            return "🎨";
        }
        switch (themeName.toLowerCase()) {
            case "default":
                return "🎨";
            case "dark":
                return "🌙";
            case "fresh":
                return "🌿";
            case "warm":
                return "☀️";
            case "ocean":
                return "🌊";
            case "forest":
                return "🌲";
            case "sunset":
                return "🌅";
            case "sakura":
                return "🌸";
            case "starry":
                return "⭐";
            case "mint":
                return "🍃";
            case "rose":
                return "🌹";
            case "aurora":
                return "🌈";
            case "morandi":
                return "🏛️";
            default:
                return "🎨";
        }
    }
}
