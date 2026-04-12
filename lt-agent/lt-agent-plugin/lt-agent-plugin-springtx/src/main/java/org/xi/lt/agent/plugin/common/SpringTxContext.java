package org.xi.lt.agent.plugin.common;

import org.xi.lt.agent.model.Span;

public class SpringTxContext {
    private static final ThreadLocal<Span> localTxSpan = new ThreadLocal<Span>();
    public static void remove(){
        localTxSpan.remove();
    }

    public static Span getTxSpan(){
        return localTxSpan.get();
    }

    public static void setTxSpan(Span span){
        localTxSpan.set(span);
    }
}
