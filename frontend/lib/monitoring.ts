import { webSocketService } from './websocket';

interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

class MonitoringService {
  private metrics: Record<string, Metric> = {};
  private reportInterval: NodeJS.Timeout | null = null;
  private wsMessageCount = 0;
  private wsReconnectCount = 0;
  private uploadMetrics: {
    count: number;
    totalSize: number;
    errors: number;
    durations: number[];
  } = { count: 0, totalSize: 0, errors: 0, durations: [] };

  constructor() {
    this.setupWebSocketMonitoring();
  }

  private setupWebSocketMonitoring() {
    // Track connection events
    webSocketService.on('connect', () => {
      this.recordMetric('websocket_connection', { type: 'counter', value: 1 });
    });

    webSocketService.on('disconnect', () => {
      this.recordMetric('websocket_disconnection', { type: 'counter', value: 1 });
    });

    webSocketService.on('reconnect', () => {
      this.wsReconnectCount++;
      this.recordMetric('websocket_reconnect', { type: 'counter', value: 1 });
    });

    webSocketService.on('message', () => {
      this.wsMessageCount++;
    });

    webSocketService.on('error', (error) => {
      this.recordMetric('websocket_error', { type: 'counter', value: 1 });
      console.error('Monitoring captured WebSocket error:', error);
    });

    // Report metrics every minute
    this.reportInterval = setInterval(() => {
      this.recordMetric('websocket_message_rate', {
        type: 'gauge',
        value: this.wsMessageCount,
      });
      this.wsMessageCount = 0;

      this.recordMetric('websocket_reconnect_count', {
        type: 'gauge',
        value: this.wsReconnectCount,
      });
      this.wsReconnectCount = 0;
    }, 60000);
  }

  recordUploadMetrics(
    fileSize: number,
    duration: number,
    success: boolean
  ) {
    this.uploadMetrics.count++;
    this.uploadMetrics.totalSize += fileSize;
    this.uploadMetrics.durations.push(duration);
    if (!success) this.uploadMetrics.errors++;

    // Record metrics
    this.recordMetric('upload_count', { type: 'counter', value: 1 });
    this.recordMetric('upload_size_bytes', {
      type: 'histogram',
      value: fileSize,
    });
    this.recordMetric('upload_duration_ms', {
      type: 'histogram',
      value: duration,
    });

    if (!success) {
      this.recordMetric('upload_errors', { type: 'counter', value: 1 });
    }
  }

  recordMetric(
    name: string,
    metric: Omit<Metric, 'name' | 'timestamp'>
  ) {
    const timestamp = Date.now();
    const metricKey = `${name}_${timestamp}`;

    this.metrics[metricKey] = {
      name,
      ...metric,
      timestamp,
    };

    // In production, you'd send this to your monitoring system
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringSystem(this.metrics[metricKey]);
    }
  }

  private sendToMonitoringSystem(metric: Metric) {
    // Implement your monitoring system integration here
    // Example: send to Prometheus, Datadog, etc.
    console.debug('[Monitoring]', metric);
  }

  getMetrics() {
    return Object.values(this.metrics);
  }

  getUploadMetrics() {
    const avgDuration =
      this.uploadMetrics.durations.reduce((a, b) => a + b, 0) /
      (this.uploadMetrics.durations.length || 1);

    return {
      totalUploads: this.uploadMetrics.count,
      totalSize: this.uploadMetrics.totalSize,
      errorCount: this.uploadMetrics.errors,
      averageDuration: Math.round(avgDuration),
      successRate:
        (1 - this.uploadMetrics.errors / (this.uploadMetrics.count || 1)) * 100,
    };
  }

  cleanup() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
  }
}

export const monitoringService = new MonitoringService();

// Error tracking
export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    // In production, send to error tracking service (e.g., Sentry)
    console.error('Captured error:', error, context);
    // Example: Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error:', error, context);
  }
}

// Web Vitals
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics or monitoring service
    console.debug('Web Vitals:', metric);
  }
}
