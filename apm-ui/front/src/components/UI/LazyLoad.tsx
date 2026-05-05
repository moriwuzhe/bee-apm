import { useState, useEffect, useRef, useCallback } from "react";

interface UseInViewOptions {
  rootMargin?: string;
  threshold?: number | number[];
}

export function useInView(
  options: UseInViewOptions = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, {
      rootMargin: options.rootMargin || "0px",
      threshold: options.threshold || 0,
    });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      observer.unobserve(currentRef);
    };
  }, [options.rootMargin, options.threshold]);

  return [ref, isInView];
}

export function LazyImage({
  src,
  alt = "",
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%231E293B' width='200' height='200'/%3E%3Ctext fill='%2364748B' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ELoading...%3C/text%3E%3C/svg%3E",
  className = "",
  ...props
}: {
  src: string;
  alt?: string;
  placeholder?: string;
  className?: string;
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [ref, isInView] = useInView({ rootMargin: "100px" });

  useEffect(() => {
    if (isInView && !isLoaded) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [isInView, src, isLoaded]);

  return (
    <img
      ref={ref}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-50"} ${className}`}
      {...props}
    />
  );
}

export function LazyLoad({
  when,
  fallback = null,
  children,
}: {
  when: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (when && !loaded) {
      setLoaded(true);
    }
  }, [when, loaded]);

  if (!loaded) {
    return fallback;
  }

  return <>{children}</>;
}