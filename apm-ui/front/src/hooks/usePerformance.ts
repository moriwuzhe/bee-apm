import { useState, useEffect, useRef, useCallback } from "react";

/**
 * 防抖 Hook
 * @param value - 要防抖的值
 * @param delay - 延迟时间（毫秒）
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * 节流 Hook
 * @param value - 要节流的值
 * @param limit - 节流时间（毫秒）
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());
  
  useEffect(() => {
    const now = Date.now();
    if (now - lastRan.current >= limit) {
      lastRan.current = now;
      setThrottledValue(value);
    }
  }, [value, limit]);
  
  return throttledValue;
}

/**
 * 获取上一个值的 Hook
 * @param value - 当前值
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * 事件监听 Hook
 * @param eventName - 事件名称
 * @param handler - 事件处理函数
 * @param element - 监听的元素（默认 window）
 */
export function useEventListener<T extends HTMLElement | Window = Window>(
  eventName: string,
  handler: (event: Event) => void,
  element: T = window as T
): void {
  const savedHandler = useRef<(event: Event) => void>();
  
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  
  useEffect(() => {
    const eventListener = (event: Event) => {
      savedHandler.current?.(event);
    };
    
    element.addEventListener(eventName, eventListener);
    
    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}

/**
 * 监听窗口大小变化的 Hook
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  
  useEventListener("resize", () => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  });
  
  return windowSize;
}

/**
 * 监听滚动位置的 Hook
 */
export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState({
    x: typeof window !== "undefined" ? window.scrollX : 0,
    y: typeof window !== "undefined" ? window.scrollY : 0,
  });
  
  useEventListener("scroll", () => {
    setScrollPosition({
      x: window.scrollX,
      y: window.scrollY,
    });
  });
  
  return scrollPosition;
}

/**
 * 条件式 useEffect
 * @param effect - 副作用函数
 * @param deps - 依赖数组
 * @param condition - 是否执行的条件
 */
export function useConditionalEffect(
  effect: () => void | (() => void),
  deps: unknown[],
  condition: boolean
): void {
  useEffect(() => {
    if (condition) {
      return effect();
    }
  }, [condition, ...deps]);
}

/**
 * 一次性执行的 useEffect
 * @param effect - 副作用函数
 */
export function useMountEffect(effect: () => void | (() => void)): void {
  useEffect(effect, []);
}

/**
 * 更新时执行的 useEffect（不包括首次渲染）
 * @param effect - 副作用函数
 * @param deps - 依赖数组
 */
export function useUpdateEffect(
  effect: () => void | (() => void),
  deps: unknown[]
): void {
  const isFirstMount = useRef(true);
  
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    return effect();
  }, deps);
}
