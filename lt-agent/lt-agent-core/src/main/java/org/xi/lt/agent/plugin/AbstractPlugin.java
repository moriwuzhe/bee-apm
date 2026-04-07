package org.xi.lt.agent.plugin;

import org.xi.lt.agent.model.FieldDefine;

/**
 * @author yuan
 * @date 2018-10-09
 */
public abstract class AbstractPlugin implements IPlugin {
    public FieldDefine[] buildFieldDefine(){
        return null;
    }
    public int order(){
        return Integer.MAX_VALUE;
    };
}
