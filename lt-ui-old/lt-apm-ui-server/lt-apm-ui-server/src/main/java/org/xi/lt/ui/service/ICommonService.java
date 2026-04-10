package org.xi.lt.ui.service;

import org.xi.lt.ui.model.vo.ResultVo;

import java.util.Map;

public interface ICommonService {
    ResultVo queryGroupList(Map<String,Object> param);

    ResultVo queryById(Map<String,Object> param);
}
