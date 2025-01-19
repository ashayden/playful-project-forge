import { useEffect, useRef } from 'react';
import { logger } from '@/services/loggingService';

interface PerformanceMetrics {
  responseTime: number;
  tokenProcessingTime: number;
  totalTokens: number;
  streamingLatency: number[];
}

interface PerformanceMonitorOptions {
  enabled?: boolean;
  sampleRate?: number;
  logThreshold?: number;
}

export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const {
    enabled = true,
    sampleRate = 0.1, // Sample 10% of interactions
    logThreshold = 1000, // Log if response time > 1s
  } = options;

  const metricsRef = useRef<PerformanceMetrics>({
    responseTime: 0,
    tokenProcessingTime: 0,
    totalTokens: 0,
    streamingLatency: [],
  });

  const startTimeRef = useRef<number>(0);

  const shouldSample = () => {
    return enabled && Math.random() < sampleRate;
  };

  const startMeasurement = () => {
    if (!shouldSample()) return;
    startTimeRef.current = performance.now();
  };

  const recordMetric = (metricName: keyof PerformanceMetrics, value: number) => {
    if (!shouldSample()) return;
    
    if (metricName === 'streamingLatency') {
      metricsRef.current.streamingLatency.push(value);
    } else {
      metricsRef.current[metricName] = value;
    }

    // Log if response time exceeds threshold
    if (metricName === 'responseTime' && value > logThreshold) {
      logger.warn('High response time detected:', {
        responseTime: value,
        threshold: logThreshold,
      });
    }
  };

  const getMetrics = () => {
    return {
      ...metricsRef.current,
      averageLatency: metricsRef.current.streamingLatency.length
        ? metricsRef.current.streamingLatency.reduce((a, b) => a + b, 0) / metricsRef.current.streamingLatency.length
        : 0,
    };
  };

  useEffect(() => {
    return () => {
      // Log final metrics when component unmounts
      if (shouldSample()) {
        const metrics = getMetrics();
        logger.debug('Performance metrics:', metrics);
      }
    };
  }, []);

  return {
    startMeasurement,
    recordMetric,
    getMetrics,
  };
} 