package org.xi.lt.demo.service;

import org.xi.lt.demo.model.RequestVo;
import org.xi.lt.demo.model.ResultVo;

/**
 * @author yuan
 * @date 2020/01/12
 */
public interface IHelloService {
    /**
     * sayHello
     * @param vo
     * @return
     */
    ResultVo sayHello(RequestVo vo);

    /**
     * sayGoodbye
     * @param vo
     * @return
     */
    ResultVo sayGoodbye(RequestVo vo);

    /**
     * helloChina
     * @param vo
     * @return
     */
    ResultVo welcomeChina(RequestVo vo);

    /**
     * welcomeXiaMen
     * @param vo
     * @return
     */
    ResultVo welcomeXiaMen(RequestVo vo);
}
