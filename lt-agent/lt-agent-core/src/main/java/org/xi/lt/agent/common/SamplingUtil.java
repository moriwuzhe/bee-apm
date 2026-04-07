package org.xi.lt.agent.common;

import org.xi.lt.agent.config.LtConfig;

import java.util.concurrent.atomic.AtomicLong;

/**
 * 采样率处理工具类
 *
 * @author yuan
 * @date 2018/09/26
 */
public class SamplingUtil {
    private static AtomicLong total = new AtomicLong(0);
    private static AtomicLong currNum = new AtomicLong(0);

    public static long incrTotal() {
        return total.incrementAndGet();
    }

    public static long getTotal() {
        return total.get();
    }

    public static long incrCurrNum() {
        return currNum.incrementAndGet();
    }

    public static long getCurrNum() {
        return currNum.get();
    }

    public static boolean YES() {
        return isCollect();
    }

    public static boolean NO() {
        return !isCollect();
    }

    private static boolean isCollect() {
        if (LtConfig.me().getRate() <= 0) {
            LtTraceContext.setCTag(LtConst.VAL_N);
            return false;
        }
        if (LtConfig.me().getRate() >= LtConst.MAX_SAMPLING_RATE) {
            LtTraceContext.setCTag(LtConst.VAL_Y);
            return true;
        }
        String cTag = LtTraceContext.getCTag();
        if (LtConst.VAL_Y.equals(cTag)) {
            return true;
        } else if (LtConst.VAL_N.equals(cTag)) {
            return false;
        } else if (getCurrNum() == 0) {
            //第一条采集
            incrCurrNum();
            incrTotal();
            LtTraceContext.setCTag(LtConst.VAL_Y);
            return true;
        }
        long tmpTotal = incrTotal();
        long tmpCurrNum = getCurrNum() + 1;
        Double rate = tmpCurrNum * 1.0 / tmpTotal * LtConst.MAX_SAMPLING_RATE;
        if (rate.intValue() > LtConfig.me().getRate()) {
            LtTraceContext.setCTag(LtConst.VAL_N);
            return false;
        }
        incrCurrNum();
        LtTraceContext.setCTag(LtConst.VAL_Y);
        return true;
    }
}
