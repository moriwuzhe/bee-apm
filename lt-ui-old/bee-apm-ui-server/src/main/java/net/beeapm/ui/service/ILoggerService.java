package org.xi.lt.ui.service;

import org.xi.lt.ui.model.vo.ChartVo;
import org.xi.lt.ui.model.vo.TableVo;

import java.util.Map;

public interface ILoggerService {
    TableVo list(Map<String, Object> params);
    ChartVo chart(Map<String, Object> params);
}
