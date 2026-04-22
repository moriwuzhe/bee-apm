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
                .methodNodeColor(theme.getMethodNodeColor())
                .classNodeColor(theme.getClassNodeColor())
                .externalNodeColor(theme.getExternalNodeColor())
                .backgroundColor(theme.getBackgroundColor())
                .build();
    }
}
