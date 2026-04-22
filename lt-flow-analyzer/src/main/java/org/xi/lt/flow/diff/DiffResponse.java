package org.xi.lt.flow.diff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 差异分析响应对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiffResponse {
    private boolean success;
    private String message;
    private DiffResultResponse diffResult;
    private String highlightedGraphBase64;

    public static DiffResponse success(DiffResultResponse diffResult) {
        return DiffResponse.builder()
                .success(true)
                .message("对比成功")
                .diffResult(diffResult)
                .build();
    }

    public static DiffResponse success(DiffResultResponse diffResult, String highlightedGraphBase64) {
        return DiffResponse.builder()
                .success(true)
                .message("对比成功")
                .diffResult(diffResult)
                .highlightedGraphBase64(highlightedGraphBase64)
                .build();
    }

    public static DiffResponse error(String message) {
        return DiffResponse.builder()
                .success(false)
                .message(message)
                .diffResult(DiffResultResponse.empty())
                .build();
    }
}
