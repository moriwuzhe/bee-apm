package org.xi.lt.flow.theme;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 主题列表响应
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThemesResponse {
    private boolean success;
    @Builder.Default
    private List<ThemeInfo> themes = new ArrayList<>();
    private String defaultTheme;

    public static ThemesResponse success(List<ThemeInfo> themes) {
        return ThemesResponse.builder()
                .success(true)
                .themes(themes)
                .build();
    }
}
