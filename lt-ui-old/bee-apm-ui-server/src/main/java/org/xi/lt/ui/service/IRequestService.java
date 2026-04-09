package org.xi.lt.ui.service;

import org.xi.lt.ui.model.vo.ChartVo;
import org.xi.lt.ui.model.vo.ResultVo;
import org.xi.lt.ui.model.vo.TableVo;

import java.util.Map;

public interface IRequestService {
    TableVo list(Map<String,Object> params);
    ChartVo chart(Map<String,Object> params);

    /**
     * 调用链查询
     * @param params
     * @return
     */
    ResultVo callTree(Map<String,Object> params);

    /**
     * 拓扑图数据
     * @param params
     * @return
     */
    ResultVo topology(Map<String,Object> params);
}
