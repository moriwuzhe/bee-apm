package base;

import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.reporter.AbstractReporter;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * 测试用Span上报器
 * 收集所有上报的Span，方便测试验证
 * @author LT Monitor Dev
 */
public class TestSpanReporter extends AbstractReporter {
    private final List<Span> spans = new CopyOnWriteArrayList<>();

    @Override
    public int report(Span span) {
        spans.add(span);
        return 0;
    }

    @Override
    public int report(List<Span> list) {
        spans.addAll(list);
        return 0;
    }

    @Override
    public int init() {
        return 0;
    }

    /**
     * 获取所有上报的Span
     * @return Span列表
     */
    public List<Span> getSpans() {
        return new ArrayList<>(spans);
    }

    /**
     * 根据类型获取Span
     * @param type Span类型
     * @return 对应类型的Span列表
     */
    public List<Span> getSpansByType(String type) {
        List<Span> result = new ArrayList<>();
        for (Span span : spans) {
            if (type.equals(span.getType())) {
                result.add(span);
            }
        }
        return result;
    }

    /**
     * 清除所有Span
     */
    public void clear() {
        spans.clear();
    }

    /**
     * 判断是否有指定类型的Span
     * @param type Span类型
     * @return 是否存在
     */
    public boolean hasSpanType(String type) {
        for (Span span : spans) {
            if (type.equals(span.getType())) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取第一个指定类型的Span
     * @param type Span类型
     * @return 第一个匹配的Span，没有返回null
     */
    public Span getFirstSpanByType(String type) {
        for (Span span : spans) {
            if (type.equals(span.getType())) {
                return span;
            }
        }
        return null;
    }
}
