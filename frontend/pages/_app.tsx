import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/contexts/theme-context';
import { WebSocketProvider } from '@/contexts/websocket-context';
import { AuthProvider } from '@/contexts/auth-context'
import { ErrorBoundary } from '@/components/error-boundary'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/toast'
import { monitoringService } from '@/lib/monitoring'

// Initialize monitoring in production
if (process.env.NODE_ENV === 'production') {
  // Initialize error tracking (e.g., Sentry)
  // Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });
}

// Report Web Vitals
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'production') {
    monitoringService.recordMetric(`web_vital_${metric.name.toLowerCase()}`, {
      type: 'histogram',
      value: metric.value,
      tags: {
        name: metric.name,
        rating: metric.rating || 'not_measured',
      },
    });
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Simple error message component
function ErrorMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">
          An unexpected error occurred. Please refresh the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Track page views
    const handleRouteChange = (url: string) => {
      if (process.env.NODE_ENV === 'production') {
        monitoringService.recordMetric('page_view', {
          type: 'counter',
          value: 1,
          tags: { path: url },
        });
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <ErrorBoundary 
      fallback={<ErrorMessage />}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <WebSocketProvider>
              <Component {...pageProps} />
              <Toaster />
            </WebSocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
