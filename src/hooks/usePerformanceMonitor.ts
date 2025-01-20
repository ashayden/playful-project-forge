import { useEffect } from 'react';

export function usePerformanceMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.log(`Performance: ${entry.name} = ${entry.duration}ms`);
        });
      });

      observer.observe({ entryTypes: ['measure'] });

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  return {
    measure: (name: string, startMark: string, endMark: string) => {
      if (process.env.NODE_ENV === 'development') {
        performance.measure(name, startMark, endMark);
      }
    },
    mark: (name: string) => {
      if (process.env.NODE_ENV === 'development') {
        performance.mark(name);
      }
    },
  };
} 