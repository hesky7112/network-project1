import React, { useState, useEffect, useMemo, memo, ComponentType } from 'react'
import Layout from '@/components/layout'
import {
  Server,
  Activity,
  AlertTriangle,
  Wifi,
  TrendingUp,
  TrendingDown,
  Clock,
  Globe,
  MoreHorizontal,
  ChevronRight,
  Settings,
  RefreshCw,
  AlertCircle,
  Shield,
  Search,
  Zap,
  Cpu,
  BarChart3,
  AreaChart,
  LineChart,
  Download,
  AlertOctagon,
  Info,
  CheckCircle2,
  Sun,
  Moon,
  Network,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/theme-context'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { Device, NetworkStats, NetworkAlert } from '@/types'
import { GeoMap } from '@/components/visualizations/GeoMap'
import { PortHeatmap } from '@/components/visualizations/PortHeatmap';
import { BlurReveal, SoftLift, StaggerList, StaggerItem, CountUp, GlassWrapper } from '@/components/ui/motion-container';
import { useMounted } from '@/hooks/use-mounted';
import TokenMeter from '@/components/billing/TokenMeter';
import BillingCalculator from '@/components/billing/BillingCalculator';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { SetupWizard } from '@/components/onboarding/SetupWizard';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  Legend,
  Area,
  AreaChart as RechartsAreaChart,
  PieChart as RechartsPieChart,
  Pie,
  RadialBarChart,
  RadialBar
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

// Simple Skeleton component
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-white/5 border border-white/5", className)} style={{ borderRadius: '2px' }} />
);

const NoDevicesIllustration = () => (
  <svg className="w-24 h-24 opacity-50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 16V4H20V16H4Z" stroke="currentColor" strokeWidth="2" />
    <path d="M8 20H16" stroke="currentColor" strokeWidth="2" />
    <path d="M12 16V20" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const NoAlertsIllustration = () => (
  <svg className="w-24 h-24 opacity-50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" strokeWidth="2" />
    <path d="M12 15V9" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="18" r="1" fill="currentColor" />
  </svg>
);

// StatCardSkeleton Removed

// Empty State Components
// Empty State Components Removed


export default function Dashboard() {
  const mounted = useMounted();



  const [stats, setStats] = useState<NetworkStats>({
    total_devices: 0,
    active_devices: 0,
    total_alerts: 0,
    critical_alerts: 0,
    uptime_percentage: 0,
    bandwidth_usage: 0
  })
  const [lastUpdated, setLastUpdated] = useState('—')
  const { theme, toggleTheme } = useTheme()
  const isDarkMode = theme === 'dark'

  // Onboarding State
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState(20);
  const [onboardingTasks, setOnboardingTasks] = useState([
    { id: '1', label: 'Initialize System', completed: true },
    { id: '2', label: 'Configure Topology', completed: false, action: () => setShowWizard(true) },
    { id: '3', label: 'Connect First Node', completed: false },
    { id: '4', label: 'Set Alert Thresholds', completed: false },
  ]);

  useEffect(() => {
    // Simulate checking first time visitor
    const timer = setTimeout(() => {
      const hasVisited = localStorage.getItem('alien_network_visited');
      if (!hasVisited) {
        setShowWelcome(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleWelcomeStart = () => {
    setShowWelcome(false);
    setShowWizard(true);
    localStorage.setItem('alien_network_visited', 'true');
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    addToast('System Configuration Applied', 'success');
    setOnboardingTasks(prev => prev.map(t => t.id === '2' ? { ...t, completed: true } : t));
    setOnboardingProgress(45);
  };


  // Fetch devices with error boundary and retry logic
  const {
    data: devices,
    error: devicesError,
    refetch: refetchDevices,
    isLoading: devicesLoading
  } = useQuery<Device[], Error>({
    queryKey: ['devices'],
    queryFn: async () => {
      return apiClient.getDevices();
    },
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  });

  // Handle errors
  useEffect(() => {
    if (devicesError) {
      console.error('Error fetching devices:', devicesError);
      addToast('Failed to load devices', 'error');
    }
  }, [devicesError]);

  // Fetch alerts with error boundary and retry logic
  const {
    data: alerts,
    error: alertsError,
    refetch: refetchAlerts,
    isLoading: alertsLoading
  } = useQuery<NetworkAlert[], Error>({
    queryKey: ['alerts'],
    queryFn: async () => {
      const alerts = await apiClient.getAlerts();
      return (alerts || []) as NetworkAlert[];
    },
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  });

  // Handle errors
  useEffect(() => {
    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
      addToast('Failed to load alerts', 'error');
    }
  }, [alertsError]);

  // Fetch live metrics with error boundary and retry logic
  const {
    data: metrics,
    refetch: refetchMetrics
  } = useQuery<{
    total_devices?: number;
    active_devices?: number;
    critical_alerts?: number;
    avg_response_time?: number;
    uptime_percentage?: number;
    bandwidth_usage?: number;
    cpu?: number;
    memory?: number;
    disk?: number;
    network?: number;
  }, Error>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const metrics = await apiClient.getLiveMetrics();
      return metrics || {};
    },
    refetchInterval: 10000,
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  });

  // Update last successful fetch time
  useEffect(() => {
    if (metrics) {
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [metrics]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          handleRefreshAll()
          addToast('Refreshing dashboard...', 'info')
          break
        case 'd':
          e.preventDefault()
          toggleTheme()
          break
        case 's':
        case '/':
          e.preventDefault()
          // Focus first search input
          const searchInputs = document.querySelectorAll('input[type="text"]')
          if (searchInputs.length > 0) {
            (searchInputs[0] as HTMLInputElement).focus()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (devices && alerts) {
      const totalDevices = devices.length
      const activeDevices = devices.filter((d: Device) => d.status === 'active').length
      const totalAlerts = alerts.length
      const criticalAlerts = alerts.filter((a: NetworkAlert) => a.severity === 'critical').length

      setStats({
        total_devices: totalDevices,
        active_devices: activeDevices,
        total_alerts: totalAlerts,
        critical_alerts: criticalAlerts,
        uptime_percentage: metrics?.uptime_percentage ?? 0,
        bandwidth_usage: metrics?.bandwidth_usage ?? 0,
      })
    }
  }, [devices, alerts, metrics])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLastUpdated(new Date().toLocaleTimeString())
    }
  }, [devices, alerts, metrics])

  const [isRefreshing, setIsRefreshing] = useState(false)

  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      const touch = e.touches?.[0]
      if (touch) {
        setStartY(touch.clientY)
        setIsPulling(true)
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPulling && startY > 0) {
      const touch = e.touches?.[0]
      if (!touch) return
      const currentY = touch.clientY
      const distance = Math.max(0, currentY - startY)
      setPullDistance(distance)
    }
  }

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      handleRefreshAll()
    }
    setPullDistance(0)
    setIsPulling(false)
    setStartY(0)
  }

  // Enhanced toast system with more options
  type ToastType = 'success' | 'error' | 'info' | 'warning';

  interface ToastOptions {
    id?: string;
    autoClose?: number | boolean;
    persist?: boolean;
    action?: {
      label: string;
      onClick: () => void;
    };
  }

  interface Toast extends ToastOptions {
    id: string;
    message: string;
    type: ToastType;
    timestamp: number;
  }

  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: number;
    persist?: boolean;
    action?: {
      label: string;
      onClick: () => void;
    };
    autoClose?: number | boolean;
  }>>([]);

  const addToast = (
    message: string,
    type: ToastType = 'info',
    options: ToastOptions = {}
  ) => {
    const id = options.id || "toast-" + Date.now();
    const autoClose = options.autoClose ?? (type === 'error' ? 10000 : 5000);

    // Remove any existing toast with the same ID
    setToasts(prev => prev.filter(t => t.id !== id));

    // Add the new toast
    const newToast: Toast = {
      id,
      message,
      type,
      timestamp: Date.now(),
      ...options
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove the toast if autoClose is enabled
    if (autoClose) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, typeof autoClose === 'number' ? autoClose : 5000);
    }

    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Clean up old toasts
  useEffect(() => {
    const now = Date.now();
    const timeout = setTimeout(() => {
      setToasts(prev =>
        prev.filter(t => t.persist || now - t.timestamp < 30000) // Keep for max 30s unless persisted
      );
    }, 5000);

    return () => clearTimeout(timeout);
  }, [toasts]);

  const [deviceSearch, setDeviceSearch] = useState('')
  const [alertSearch, setAlertSearch] = useState('')

  const filteredDevices = useMemo(() => (devices || []).filter((device: Device) =>
    device.hostname?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
    device.ip_address?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
    device.device_type?.toLowerCase().includes(deviceSearch.toLowerCase())
  ) || [], [devices, deviceSearch])

  const filteredAlerts = useMemo(() => (alerts || []).filter((alert: NetworkAlert) =>
    alert.message?.toLowerCase().includes(alertSearch.toLowerCase()) ||
    alert.type?.toLowerCase().includes(alertSearch.toLowerCase()) ||
    alert.device?.hostname?.toLowerCase().includes(alertSearch.toLowerCase()) ||
    alert.device?.ip_address?.toLowerCase().includes(alertSearch.toLowerCase())
  ) || [], [alerts, alertSearch])

  const recentFilteredAlerts = filteredAlerts.slice(0, 6)

  const [timeRange, setTimeRange] = useState('24h')

  const chartData = useMemo(() => {
    const points = {
      '1h': 6,
      '6h': 12,
      '24h': 24,
      '7d': 14
    }[timeRange] || 24

    return Array.from({ length: points }, (_, index) => {
      const remaining = points - index - 1
      const baseline =
        timeRange === '1h' ? 58 :
          timeRange === '6h' ? 60 :
            timeRange === '7d' ? 52 :
              55
      return {
        time: points > 24
          ? "Day " + (index + 1)
          : remaining === 0
            ? 'Now'
            : "- " + remaining + "h",
        usage: Math.max(20, Math.min(100, Math.round(baseline + 18 * Math.sin(index / Math.max(1, points / 6)))))
      }
    })
  }, [timeRange])

  const [visibleSections, setVisibleSections] = useState({
    devices: true,
    alerts: true,
    systemPerformance: true,
    quickActions: true,
    analytics: true,
  })

  const [showSettings, setShowSettings] = useState(false)

  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleRefreshAll = async () => {
    try {
      setIsRefreshing(true);
      const toastId = "refresh-" + Date.now();
      addToast('Refreshing data...', 'info', { id: toastId, persist: true });

      const results = await Promise.allSettled([
        refetchDevices(),
        refetchAlerts(),
        refetchMetrics()
      ]);

      const hasErrors = results.some(result => result.status === 'rejected');

      if (hasErrors) {
        addToast('Some data failed to update', 'warning', { id: toastId });
      } else {
        addToast('Dashboard refreshed successfully', 'success', { id: toastId });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      addToast(
        'Failed to refresh data. Please check your connection and try again.',
        'error',
        { id: "refresh-error-" + Date.now() }
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  // Define the StatCard component
  interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
    children?: React.ReactNode;
  }

  const StatCard = memo(({ title, value, subtitle, icon: Icon, color, trend, children }: StatCardProps) => {
    const trendIcon = {
      up: <TrendingUp className="w-3 h-3 text-earth-green" />,
      down: <TrendingDown className="w-3 h-3 text-red-500" />,
      neutral: <Activity className="w-3 h-3 text-slate-500" />
    }[trend || 'neutral'];

    return (
      <SoftLift className="bg-oled-black border border-white/5 overflow-hidden group p-4 relative" style={{ borderRadius: '4px' }}>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-3">{title}</p>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                {typeof value === 'number' ? <CountUp value={value} suffix={subtitle === '%' ? '%' : ''} /> : value}
              </div>
              {subtitle && subtitle !== '%' && (
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className={cn(
            "w-10 h-10 flex items-center justify-center border",
            color === 'green' ? 'border-earth-green/20 bg-earth-green/5 text-earth-green' :
              color === 'blue' ? 'border-blue-500/20 bg-blue-500/5 text-blue-400' :
                color === 'purple' ? 'border-purple-500/20 bg-purple-500/5 text-purple-400' :
                  'border-white/10 bg-white/5 text-slate-400'
          )} style={{ borderRadius: '1.5px' }}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend && (
          <div className="mt-6 flex items-center gap-2">
            <div className="p-1 border border-white/5 bg-white/[0.02]" style={{ borderRadius: '1px' }}>
              {trendIcon}
            </div>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
              Deviance: {trend === 'up' ? '+12.4%' : trend === 'down' ? '-8.2%' : '±0.0'}
            </span>
          </div>
        )}
        {children}
      </SoftLift>
    );
  });

  // Add display name for better debugging
  StatCard.displayName = 'StatCard';

  interface DeviceCardProps {
    device: Device & {
      tags?: string[];
      last_seen?: string;
    };
  }



  const DeviceCard = memo(({ device }: DeviceCardProps) => {
    const statusColors = {
      active: {
        bg: 'bg-earth-green/5 border-earth-green/20 shadow-[0_0_10px_rgba(0,255,65,0.05)]',
        text: 'text-earth-green',
        dot: 'bg-earth-green shadow-[0_0_8px_rgba(0,255,65,0.5)]',
        icon: 'text-earth-green'
      },
      inactive: {
        bg: 'bg-red-500/5 border-red-500/20',
        text: 'text-red-400',
        dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
        icon: 'text-red-400'
      },
      warning: {
        bg: 'bg-yellow-500/5 border-yellow-500/20',
        text: 'text-yellow-400',
        dot: 'bg-yellow-500',
        icon: 'text-yellow-400'
      },
      default: {
        bg: 'bg-white/5 border-white/10',
        text: 'text-slate-400',
        dot: 'bg-slate-500',
        icon: 'text-slate-400'
      }
    };

    const status = device.status?.toLowerCase() || 'default';
    const colors = statusColors[status as keyof typeof statusColors] || statusColors.default;

    return (
      <div className="group relative flex items-center justify-between p-3 bg-oled-black border border-white/5 hover:border-earth-green/20 transition-all duration-200" style={{ borderRadius: '2px' }}>
        <div className="flex items-center space-x-5 overflow-hidden">
          <div className={cn("w-10 h-10 flex items-center justify-center border", colors.bg, colors.icon)} style={{ borderRadius: '1.5px' }}>
            {device.device_type?.toLowerCase().includes('router') || device.device_type?.toLowerCase().includes('switch') ? (
              <Network className="h-5 w-5" />
            ) : device.device_type?.toLowerCase().includes('firewall') ? (
              <Shield className="h-5 w-5" />
            ) : (
              <Server className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <p className="text-[11px] font-black text-white uppercase tracking-tighter truncate">
                {device.hostname || device.ip_address}
              </p>
              {device.tags?.map((tag, i) => (
                <span key={i} className="text-[8px] px-1.5 py-0.5 border border-white/10 bg-white/5 text-slate-500 uppercase font-black">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">
              {device.ip_address} • {device.device_type || 'Unknown Node'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className={cn("inline-flex items-center px-3 py-1 text-[8px] font-black uppercase tracking-widest border", colors.bg, colors.text)} style={{ borderRadius: '1px' }}>
            <div className={`w-1 h-1 rounded-full mr-2 ${colors.dot} animate-pulse`}></div>
            {device.status || 'OFFLINE'}
          </div>

          <button
            className="p-1.5 border border-transparent hover:border-white/10 hover:bg-white/5 text-slate-700 hover:text-white transition-all"
            style={{ borderRadius: '1.5px' }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  });

  interface AlertCardProps {
    alert: NetworkAlert & {
      severity?: 'critical' | 'warning' | 'info' | 'success';
      device?: {
        hostname?: string;
        ip_address?: string;
      };
    };
    devicesLoading?: boolean;
  }

  const AlertCard = memo(({ alert }: AlertCardProps) => {
    const severityStyles = {
      critical: {
        border: 'border-red-500/30',
        bg: 'bg-red-500/5',
        text: 'text-red-400',
        icon: AlertOctagon
      },
      warning: {
        border: 'border-yellow-500/30',
        bg: 'bg-yellow-500/5',
        text: 'text-yellow-400',
        icon: AlertTriangle
      },
      info: {
        border: 'border-earth-green/30',
        bg: 'bg-earth-green/5',
        text: 'text-earth-green',
        icon: Info
      },
      success: {
        border: 'border-earth-green/30',
        bg: 'bg-earth-green/5',
        text: 'text-earth-green',
        icon: CheckCircle2
      }
    };

    const severity = alert.severity?.toLowerCase() || 'info';
    const styles = severityStyles[severity as keyof typeof severityStyles] || severityStyles.info;
    const Icon = styles.icon;

    return (
      <div
        className={cn("p-4 border-l-2 bg-oled-black border-white/5 relative group transition-all", styles.border)}
        style={{ borderRadius: '2px' }}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/[0.02] to-transparent pointer-events-none" />
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className={cn("w-8 h-8 flex items-center justify-center border", styles.bg, styles.text)} style={{ borderRadius: '1.5px' }}>
              <Icon className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <p className="text-[11px] font-black text-white uppercase tracking-tighter">
                  {alert.type.replace(/_/g, ' ')}
                </p>
                <div className={cn("text-[8px] px-2 py-0.5 font-black uppercase tracking-widest border", styles.bg, styles.text)} style={{ borderRadius: '1px' }}>
                  {severity}
                </div>
              </div>

              <p className="text-[10px] font-medium text-slate-500 mt-2 leading-relaxed">{alert.message}</p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[8px] font-bold uppercase tracking-widest text-slate-700">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-2" />
                  {new Date(alert.created_at).toLocaleString()}
                </span>
                <span className="flex items-center">
                  <Globe className="h-3 w-3 mr-2" />
                  {alert.device?.hostname || 'Kernel_Host'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

  const systemHealthData = useMemo(() => {
    // Return default values if metrics is undefined
    if (!metrics) {
      return {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0,
        healthScore: 0
      };
    }

    // Calculate health score as an average of available metrics
    const validMetrics = [
      metrics.cpu,
      metrics.memory,
      metrics.disk,
      metrics.network
    ].filter(Number.isFinite);

    const sum = (validMetrics as number[]).reduce((acc: number, val: number) => acc + (val || 0), 0);
    const healthScore = validMetrics.length > 0
      ? sum / validMetrics.length
      : 0;

    return {
      cpu: metrics.cpu || 0,
      memory: metrics.memory || 0,
      disk: metrics.disk || 0,
      network: metrics.network || 0,
      healthScore: Math.round(healthScore * 10) / 10 // Round to 1 decimal place
    };
  }, [metrics])

  const deviceStatusData = useMemo(() => [
    { name: 'Active', value: stats.active_devices, fill: '#10B981' },
    { name: 'Inactive', value: Math.max(0, stats.total_devices - stats.active_devices), fill: '#EF4444' },
  ], [stats.active_devices, stats.total_devices])

  const performanceMetrics = useMemo(() => [
    { name: 'CPU', value: systemHealthData.cpu, color: '#10B981' },
    { name: 'Memory', value: systemHealthData.memory, color: '#F59E0B' },
    { name: 'Disk', value: systemHealthData.disk, color: '#8B5CF6' },
    { name: 'Network', value: systemHealthData.network, color: '#3B82F6' },
  ], [systemHealthData])

  interface NetworkTrafficData {
    timestamp: string;
    in: number;
    out: number;
  }

  const networkTrafficData = useMemo<NetworkTrafficData[]>(() => {
    // Generate mock traffic data if not available or if not mounted (to avoid mismatch)
    if (!metrics || !mounted) return [];

    // If metrics has traffic data, use it
    if ('traffic' in metrics) {
      return (metrics as any).traffic;
    }

    // Generate sample traffic data if none exists
    const now = new Date();
    return Array.from({ length: 24 }).map((_, i) => ({
      timestamp: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString(),
      in: Math.floor(Math.random() * 1000) + 500,
      out: Math.floor(Math.random() * 800) + 300,
    }));
  }, [metrics, mounted]);

  type PerformanceIndicator = {
    label: string
    value: number
    suffix: string
    target: string
    gradient: string
    icon: ComponentType<{ className?: string }>
  }

  const performanceIndicators: PerformanceIndicator[] = useMemo(() => [
    {
      label: 'Bandwidth',
      value: Math.min(100, Number.isFinite(stats.bandwidth_usage) ? stats.bandwidth_usage : 0),
      suffix: '%',
      target: '85%',
      gradient: 'from-blue-500 to-blue-600',
      icon: Wifi,
    },
    {
      label: 'CPU',
      value: Math.min(100, systemHealthData.cpu),
      suffix: '%',
      target: '65%',
      gradient: 'from-emerald-500 to-emerald-600',
      icon: Cpu,
    },
    {
      label: 'Memory',
      value: Math.min(100, systemHealthData.memory),
      suffix: '%',
      target: '70%',
      gradient: 'from-amber-400 to-amber-500',
      icon: Activity,
    },
  ], [stats.bandwidth_usage, systemHealthData.cpu, systemHealthData.memory])

  // Fetch FUP Status
  const { data: fupStatus } = useQuery({
    queryKey: ['fupStatus'],
    queryFn: async () => {
      const data = await apiClient.get('/fup/status');
      return data as { throttled: boolean; usage: number; limit: number };
    },
    // Refresh every minute
    refetchInterval: 60000,
  });

  // Calculate FUP percentage and display strings
  const fupPercentage = useMemo(() => {
    if (!fupStatus || fupStatus.limit === 0) return 0;
    return Math.min(100, (fupStatus.usage / fupStatus.limit) * 100);
  }, [fupStatus]);

  const fupLabel = useMemo(() => {
    if (!fupStatus) return "Loading...";
    if (fupStatus.limit === 0) return "Unlimited";
    const remainingGB = Math.max(0, (fupStatus.limit - fupStatus.usage) / (1024 * 1024 * 1024));
    return `${remainingGB.toFixed(1)} GB_Rem`;
  }, [fupStatus]);

  if (!mounted) {
    return (
      <Layout title="Loading...">
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64 mb-2" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="relative">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
        >
          Skip to main content
        </a>
        {/* Main Container with optimized responsive spacing */}
        <div
          id="main-content"
          className="min-h-screen bg-[#000000]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ transform: `translateY(${Math.min(pullDistance * 0.5, 60)}px)` }}
        >
          {/* Pull to Refresh Indicator */}
          {pullDistance > 20 && (
            <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 z-40 transition-opacity duration-200">
              <RefreshCw className={`h - 4 w - 4 inline mr - 2 ${pullDistance > 80 ? 'animate-spin' : ''} `} />
              {pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
            </div>
          )}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 py-4 sm:py-6 lg:py-8">
            {/* Header Section */}
            <BlurReveal className="mb-12">
              <div className="flex flex-col space-y-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 border-b border-white/5 pb-8 relative">
                <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-earth-green shadow-[0_0_10px_rgba(0,255,65,1)]" />
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                    Command <span className="text-earth-green">Center</span>
                  </h1>
                  <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-[0.4em]">
                    Enterprise Infrastructure Management Unit
                  </p>
                </div>

                {/* Status and Actions */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center bg-earth-green/5 px-4 py-2 border border-earth-green/20" style={{ borderRadius: '2px' }}>
                    <div className="w-1.5 h-1.5 bg-earth-green rounded-full mr-3 animate-pulse shadow-[0_0_8px_rgba(0,255,65,0.8)]"></div>
                    <span className="text-[9px] font-black text-earth-green tracking-widest uppercase">System_Optimal</span>
                  </div>
                  <Button
                    onClick={handleRefreshAll}
                    disabled={isRefreshing}
                    variant="ghost"
                    size="sm"
                    className="flex items-center bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[9px] h-10 px-6 transition-all"
                    style={{ borderRadius: '2px' }}
                    aria-label="Refresh all dashboard data"
                  >
                    <RefreshCw className={`h - 3 w - 3 mr - 3 ${isRefreshing ? 'animate-spin' : ''} `} />
                    {isRefreshing ? 'Syncing...' : 'Sync_Pulse'}
                  </Button>
                  <Button
                    onClick={toggleTheme}
                    variant="outline"
                    size="sm"
                    className="flex items-center hover:bg-gray-50 hover:border-gray-300 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 active:scale-95 transition-transform duration-150 h-11 sm:h-10 px-5"
                    aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                  >
                    {isDarkMode ? <Sun className="h-3 w-3 sm:h-4 sm:w-4 mr-2" /> : <Moon className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />}
                    {isDarkMode ? 'Light' : 'Dark'}
                  </Button>
                  <div className="relative">
                    <Button
                      onClick={() => setShowSettings(!showSettings)}
                      variant="outline"
                      size="sm"
                      className="flex items-center hover:bg-gray-50 hover:border-gray-300 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 active:scale-95 transition-transform duration-150 h-11 sm:h-9 px-4 sm:px-3"
                      aria-label="Dashboard settings"
                    >
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Settings
                    </Button>
                    {showSettings && (
                      <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                        <div className="p-5 space-y-3">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wide">Dashboard Sections</h3>
                          <div className="space-y-3">
                            {Object.entries(visibleSections).map(([section, visible]) => (
                              <label key={section} className="flex items-center text-sm">
                                <input
                                  type="checkbox"
                                  checked={visible}
                                  onChange={() => toggleSection(section as keyof typeof visibleSections)}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                  {section === 'quickActions' ? 'Quick Actions' : section}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </BlurReveal>

            {/* Key Metrics - Multi-platform responsive grid */}
            <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 xl:gap-6 mb-6 sm:mb-8">
              <StaggerItem>
                <StatCard
                  title="Total Devices"
                  value={stats.total_devices}
                  subtitle={`${stats.active_devices} active • ${stats.total_devices > 0 ? ((stats.active_devices / stats.total_devices) * 100).toFixed(1) : '0.0'}% uptime`}
                  icon={Server}
                  color="from-blue-500 to-blue-600"
                  trend="up"
                />
              </StaggerItem>

              <StaggerItem>
                <StatCard
                  title="Network Health"
                  value={stats.uptime_percentage}
                  subtitle="%"
                  icon={Activity}
                  color="from-green-500 to-green-600"
                  trend="up"
                />
              </StaggerItem>

              <StaggerItem>
                <StatCard
                  title="Active Alerts"
                  value={stats.critical_alerts}
                  subtitle={`${stats.total_alerts} total alerts`}
                  icon={AlertTriangle}
                  color={stats.critical_alerts > 0 ? "from-red-500 to-red-600" : "from-gray-500 to-gray-600"}
                  trend={stats.critical_alerts > 0 ? 'down' : 'neutral'}
                />
              </StaggerItem>

              <StaggerItem>
                <StatCard
                  title="Bandwidth Usage"
                  value={stats.bandwidth_usage}
                  subtitle="%"
                  icon={Wifi}
                  color="from-purple-500 to-purple-600"
                  trend="neutral"
                />
              </StaggerItem>
            </StaggerList>

            {/* Main Dashboard Grid - Enhanced responsive layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:col-span-4 gap-4 sm:gap-5 lg:gap-6">
              {/* Left Column - Main Content */}
              <StaggerList className="lg:col-span-2 xl:col-span-3 space-y-4 sm:space-y-6">
                <StaggerItem>
                  {/* Recent Devices - Enhanced for all screen sizes */}
                  {/* Recent Devices */}
                  <div className="bg-oled-black border border-white/5 relative overflow-hidden group" style={{ borderRadius: '4px' }}>
                    <div className="absolute top-0 left-0 w-24 h-[1px] bg-earth-green shadow-[0_0_10px_rgba(0,255,65,0.5)]" />
                    <div className="px-6 py-6 border-b border-white/5 bg-[#080808]">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 flex items-center justify-center border border-earth-green/20 bg-earth-green/5 text-earth-green" style={{ borderRadius: '1.5px' }}>
                            <Server className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Network_Nodes</h3>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Status: {stats.active_devices}/{stats.total_devices} Synchronized</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
                            <input
                              type="text"
                              placeholder="NODE_SEARCH..."
                              value={deviceSearch}
                              onChange={(e) => setDeviceSearch(e.target.value)}
                              className="w-full sm:w-48 bg-white/5 border border-white/10 px-9 py-2 text-[10px] font-black text-white placeholder:text-slate-600 focus:border-earth-green/30 focus:outline-none transition-all"
                              style={{ borderRadius: '1.5px' }}
                            />
                          </div>
                          <Button variant="ghost" className="h-9 px-4 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5" style={{ borderRadius: '1.5px' }}>
                            EXPAND_ALL
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="relative p-4 sm:p-6">
                      {devicesLoading ? (
                        <div className="space-y-3 sm:space-y-4">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:px-5 sm:py-4 backdrop-blur animate-pulse">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-white/10" />
                                <div className="space-y-1">
                                  <div className="h-3.5 w-28 rounded-full bg-white/10" />
                                  <div className="h-2.5 w-20 rounded-full bg-white/10" />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2.5 w-12 rounded-full bg-white/10" />
                                <ChevronRight className="h-4 w-4 text-white/30" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : devicesError ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10 text-center" role="status" aria-live="polite">
                          <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-red-400/90 mb-5" />
                          <p className="text-sm sm:text-base font-medium">Failed to load devices</p>
                          <p className="mt-1 text-xs sm:text-sm text-white/60">Please check your connection and try again</p>
                          <Button onClick={() => refetchDevices()} className="mt-5 rounded-full bg-white/15 px-5 text-white hover:bg-white/25">
                            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Retry
                          </Button>
                        </div>
                      ) : filteredDevices.length > 0 ? (
                        <div className="space-y-4">
                          {filteredDevices.map((device: Device, index: number) => (
                            <DeviceCard key={device.id || index} device={device} />
                          ))}
                        </div>
                      ) : deviceSearch ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                          <NoDevicesIllustration />
                          <p className="text-sm sm:text-base font-medium">No devices match your search</p>
                          <p className="text-xs sm:text-sm text-white/60">Try adjusting your search terms</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                          <NoDevicesIllustration />
                          <p className="text-sm sm:text-base font-medium">No devices discovered yet</p>
                          <p className="text-xs sm:text-sm text-white/60">Devices will appear here once discovered</p>
                          <Button className="mt-5 rounded-full bg-white/15 px-5 text-white hover:bg-white/25" onClick={() => addToast('Network discovery started. This may take a few minutes.', 'info')}>
                            <Network className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Run Network Discovery
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  {/* Recent Alerts - Responsive full width */}
                  {/* Recent Alerts */}
                  <div className="bg-oled-black border border-white/5 relative overflow-hidden group mt-6" style={{ borderRadius: '4px' }}>
                    <div className="absolute top-0 right-0 w-24 h-[1px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    <div className="px-6 py-6 border-b border-white/5 bg-[#080808]">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 flex items-center justify-center border border-red-500/20 bg-red-500/5 text-red-400" style={{ borderRadius: '1.5px' }}>
                            <AlertCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Anomaly_Logs</h3>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Buffer: {stats.total_alerts} Captured Events</p>
                          </div>
                          {stats.critical_alerts > 0 && (
                            <span className="text-[8px] px-2 py-0.5 border border-red-500/30 bg-red-500/10 text-red-500 font-black uppercase ml-4">{stats.critical_alerts} CRITICAL</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
                            <input
                              type="text"
                              placeholder="EVENT_SEARCH..."
                              value={alertSearch}
                              onChange={(e) => setAlertSearch(e.target.value)}
                              className="w-full sm:w-48 bg-white/5 border border-white/10 px-9 py-2 text-[10px] font-black text-white placeholder:text-slate-600 focus:border-red-500/30 focus:outline-none transition-all"
                              style={{ borderRadius: '1.5px' }}
                            />
                          </div>
                          <Button variant="ghost" className="h-9 px-4 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5" style={{ borderRadius: '1.5px' }}>
                            CLEAR_BUFFER
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="relative p-4 sm:p-6">
                      {alertsLoading ? (
                        <div className="space-y-3 sm:space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 sm:px-5 sm:py-5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2 w-full">
                                  <div className="h-3.5 w-32 rounded-full bg-white/10" />
                                  <div className="h-2.5 w-full rounded-full bg-white/10" />
                                  <div className="flex gap-3 text-[11px]">
                                    <div className="h-2 w-16 rounded-full bg-white/10" />
                                    <div className="h-2 w-20 rounded-full bg-white/10" />
                                  </div>
                                </div>
                                <div className="h-5 w-16 rounded-full bg-white/10" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : alertsError ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10 text-center" role="status" aria-live="polite">
                          <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-red-300 mb-5" />
                          <p className="text-sm sm:text-base font-medium">Failed to load alerts</p>
                          <p className="mt-1 text-xs sm:text-sm text-white/70">Please check your connection and try again</p>
                          <Button onClick={() => refetchAlerts()} className="mt-5 rounded-full bg-white/15 px-5 text-white hover:bg-white/25">
                            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Retry
                          </Button>
                        </div>
                      ) : recentFilteredAlerts.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                          {recentFilteredAlerts.map((alert: NetworkAlert) => (
                            <div key={alert.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 sm:px-5 sm:py-5 transition-all duration-300 hover:border-white/20 hover:bg-white/10">
                              <AlertCard alert={alert} devicesLoading={devicesLoading} />
                            </div>
                          ))}
                        </div>
                      ) : alertSearch ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                          <NoAlertsIllustration />
                          <p className="text-sm sm:text-base font-medium">No alerts match your search</p>
                          <p className="text-xs sm:text-sm text-white/70">Try adjusting your search terms</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                          <NoAlertsIllustration />
                          <p className="text-sm sm:text-base font-medium">No active alerts</p>
                          <p className="text-xs sm:text-sm text-white/70">Your network is running smoothly</p>
                        </div>
                      )}
                    </div>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  {visibleSections.quickActions && (
                    <div className="bg-oled-black border border-white/5 overflow-hidden" style={{ borderRadius: '4px' }}>
                      <div className="px-6 py-4 border-b border-white/5 bg-[#080808]">
                        <div className="flex items-center gap-3">
                          <Zap className="h-4 w-4 text-earth-green" />
                          <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Rapid_Commands</h3>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          <Button className="w-full justify-start bg-earth-green/5 border border-earth-green/20 text-earth-green hover:bg-earth-green/10 text-[10px] font-black uppercase tracking-widest h-11" style={{ borderRadius: '2px' }} onClick={() => addToast('Discovery initiated', 'info')}>
                            <Network className="h-4 w-4 mr-4" />
                            Run_Discovery
                          </Button>
                          <Button className="w-full justify-start bg-white/5 border border-white/10 text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest h-11" style={{ borderRadius: '2px' }} variant="ghost" onClick={() => addToast('Generating report', 'info')}>
                            <Activity className="h-4 w-4 mr-4" />
                            Export_Telemetry
                          </Button>
                          <Button className="w-full justify-start border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest h-11" style={{ borderRadius: '2px' }} variant="ghost" onClick={() => handleRefreshAll()}>
                            <RefreshCw className="h-4 w-4 mr-4" />
                            Flush_Buffers
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </StaggerItem>

                <StaggerItem>
                  {/* --- New Billing Section --- */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TokenMeter
                      label="Data_Consumption_FUP"
                      value={Number(fupPercentage.toFixed(1))}
                      unit={fupLabel}
                      subLabel={fupStatus?.throttled ? "Throttled_Lane" : "High_Priority_Lane"}
                      color={fupPercentage > 90 ? "#ef4444" : "#00FF41"}
                    />
                    <div className="bg-oled-black border border-blue-500/20 p-6 relative overflow-hidden" style={{ borderRadius: '4px' }}>
                      <div className="absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 pointer-events-none bg-blue-500" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Refill_Estimator</h4>
                      <BillingCalculator className="p-0 border-0 bg-transparent" />
                    </div>
                  </div>

                  {/* Live Metrics Summary - High Fidelity HUD */}
                  <GlassWrapper className="bg-[#0a0a0c] border-white/5 overflow-hidden group h-full relative">
                    <div className="absolute top-0 left-0 w-24 h-[1px] bg-stardust-violet shadow-[0_0_10px_#6366f1]" />
                    <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                          <TrendingUp className="h-4 w-4 text-stardust-violet" />
                        </div>
                        <div>
                          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Throughput_Matrix_Live</h3>
                          <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">RealTime_Flow_Analysis</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <div className="text-3xl font-black text-white italic tracking-tighter leading-none">
                            <CountUp value={metrics ? Object.keys(metrics).length : 0} />
                          </div>
                          <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Active_Metrics</div>
                          <div className="w-6 h-1 bg-stardust-violet/20 rounded-full" />
                        </div>
                        <div className="space-y-3">
                          <div className="text-3xl font-black text-earth-green italic tracking-tighter leading-none">
                            2.4<span className="text-sm ml-1 uppercase">TB</span>
                          </div>
                          <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Data_Processed</div>
                          <div className="w-6 h-1 bg-earth-green/20 rounded-full" />
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-3 w-3 text-slate-700" />
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Matrix_Sync:</span>
                        </div>
                        <span className="text-[10px] font-black text-white italic tracking-widest">{lastUpdated}</span>
                      </div>
                    </div>
                  </GlassWrapper>

                  {visibleSections.analytics && (
                    <section className="space-y-6 sm:space-y-8 mb-3 sm:mb-4 lg:mb-6">
                      {/* Global Network Status Map - Asset Spatial Intelligence */}
                      <GlassWrapper className="bg-[#050505] border-white/5 overflow-hidden group relative">
                        <div className="absolute top-0 right-0 w-32 h-[1px] bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                              <Globe className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Asset_Spatial_Intelligence</h3>
                              <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Global_Deployment_Topology</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-6">
                            {[
                              { label: 'Sites_Online', val: 3, color: 'text-earth-green', dot: 'bg-earth-green' },
                              { label: 'Nominal_Warnings', val: 1, color: 'text-amber-500', dot: 'bg-amber-500' },
                              { label: 'Critical_Failures', val: 1, color: 'text-cosmic-red', dot: 'bg-cosmic-red' },
                            ].map((s) => (
                              <div key={s.label} className="flex items-center gap-3">
                                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]", s.color, s.dot)} />
                                <span className={cn("text-[9px] font-black uppercase tracking-widest italic", s.color)}>
                                  {s.val} {s.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-1 relative">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] pointer-events-none z-10 opacity-60" />
                          <GeoMap height={320} />
                          <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
                            <div className="px-4 py-2 bg-black/80 border border-white/10 rounded-sm backdrop-blur-md">
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em]">Map_Precision:_99.9%</span>
                            </div>
                          </div>
                        </div>
                      </GlassWrapper>
                      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 sm:gap-8">
                        <GlassWrapper className="bg-[#0a0a0c] border-white/5 overflow-hidden rounded-sm relative group">
                          <div className="absolute top-0 left-0 w-24 h-[1px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                          <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                                  <Activity className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                  <h3 id="system-performance-heading" className="text-[11px] font-black text-white uppercase tracking-[0.2em]">System_Performance</h3>
                                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Live_Utilization_Across_Critical_Resources</p>
                                </div>
                              </div>
                              <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] bg-black/40 border border-white/5 px-3 py-1 rounded-sm">
                                SYNCHRONIZED_{lastUpdated}
                              </div>
                            </div>
                          </div>
                          <div className="px-6 py-8 space-y-6">
                            <div className="grid gap-4">
                              {performanceIndicators.map(({ label, value, suffix, target, icon: Icon }) => (
                                <div key={label} className="bg-white/[0.01] border border-white/5 hover:border-white/10 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 rounded-sm transition-all group/item">
                                  <div className="flex items-center gap-4">
                                    <div className={cn("flex h-10 w-10 items-center justify-center border transition-all duration-300",
                                      label === 'Bandwidth' ? "bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover/item:bg-blue-500/20" :
                                        label === 'CPU' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover/item:bg-emerald-500/20" :
                                          "bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover/item:bg-amber-500/20"
                                    )} style={{ borderRadius: '1px' }}>
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">{label}</p>
                                      <div className="text-2xl font-black text-white italic tracking-tighter transition-colors group-hover/item:text-white leading-none">
                                        <CountUp value={value} suffix={suffix} />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-full sm:max-w-xs">
                                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 mb-2">
                                      <span>Utilization</span>
                                      <span>Target_{target}</span>
                                    </div>
                                    <div className="h-[2px] bg-white/5 relative overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(4, value)}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={cn("h-full bg-gradient-to-r",
                                          label === 'Bandwidth' ? "from-blue-500 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]" :
                                            label === 'CPU' ? "from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                              "from-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                        )}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5">
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Health_Score</p>
                                <p className="text-xl font-black text-white italic tracking-tighter leading-none">{systemHealthData.healthScore}%</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Incidents_24H</p>
                                <p className="text-xl font-black text-cosmic-red italic tracking-tighter leading-none">{stats.critical_alerts}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Uptime_30D</p>
                                <p className="text-xl font-black text-emerald-500 italic tracking-tighter leading-none">{stats.uptime_percentage}%</p>
                              </div>
                            </div>
                          </div>
                        </GlassWrapper>

                        <div className="grid grid-cols-1 gap-6 sm:gap-8">
                          {/* Device Port Heatmap */}
                          <div className="relative group">
                            <PortHeatmap />
                          </div>
                          {/* Performance Metrics */}
                          <GlassWrapper className="bg-[#0a0a0c] border-white/5 overflow-hidden rounded-sm">
                            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                                  <BarChart3 className="h-4 w-4 text-stardust-violet" aria-hidden="true" />
                                </div>
                                <div>
                                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Performance_Metrics</h3>
                                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Resource_Flux_Analysis</p>
                                </div>
                              </div>
                            </div>
                            <div className="p-6" aria-label="Bar chart showing CPU, memory, disk, and network performance metrics">
                              <ResponsiveContainer width="100%" height={250}>
                                <RechartsBarChart data={performanceMetrics}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                  <XAxis dataKey="name" stroke="#6B7280" fontSize={10} fontWeight="bold" />
                                  <YAxis stroke="#6B7280" fontSize={10} fontWeight="bold" />
                                  <RechartsTooltip
                                    contentStyle={{
                                      backgroundColor: '#050505',
                                      border: '1px solid rgba(255,255,255,0.1)',
                                      borderRadius: '2px',
                                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                  />
                                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                    {performanceMetrics.map((entry) => (
                                      <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                  </Bar>
                                </RechartsBarChart>
                              </ResponsiveContainer>
                            </div>
                          </GlassWrapper>

                          {/* Network Traffic Flow */}
                          <GlassWrapper className="bg-[#0a0a0c] border-white/5 overflow-hidden rounded-sm">
                            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-sm">
                                  <AreaChart className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                                </div>
                                <div>
                                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Traffic_Flow</h3>
                                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Asset_Spatial_Intelligence</p>
                                </div>
                              </div>
                            </div>
                            <div className="p-6">
                              <ResponsiveContainer width="100%" height={300}>
                                <RechartsLineChart data={networkTrafficData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                                  <XAxis dataKey="time" stroke="#6B7280" fontSize={10} fontWeight="bold" />
                                  <YAxis stroke="#6B7280" fontSize={10} fontWeight="bold" />
                                  <RechartsTooltip
                                    contentStyle={{
                                      backgroundColor: '#050505',
                                      border: '1px solid rgba(255,255,255,0.1)',
                                      borderRadius: '2px',
                                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                  />
                                  <Legend verticalAlign="top" height={36} />
                                  <Line
                                    type="monotone"
                                    dataKey="inbound"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    name="Inbound"
                                    dot={{ fill: '#3B82F6', strokeWidth: 0, r: 3 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="outbound"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    name="Outbound"
                                    dot={{ fill: '#10B981', strokeWidth: 0, r: 3 }}
                                  />
                                </RechartsLineChart>
                              </ResponsiveContainer>
                            </div>
                          </GlassWrapper>

                          {/* Bandwidth Usage */}
                          <GlassWrapper className="bg-[#0a0a0c] border-white/5 overflow-hidden rounded-sm">
                            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                                  <LineChart className="h-4 w-4 text-blue-400" aria-hidden="true" />
                                </div>
                                <div>
                                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Bandwidth_Usage</h3>
                                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">RealTime_Throughput_Pulse</p>
                                </div>
                              </div>
                              <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="px-3 py-1 bg-black border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-sm focus:outline-none focus:ring-1 focus:ring-stardust-violet"
                              >
                                <option value="1h">1H</option>
                                <option value="6h">6H</option>
                                <option value="24h">24H</option>
                                <option value="7d">7D</option>
                              </select>
                            </div>
                            <div className="p-6" aria-label="Interactive area chart showing bandwidth usage over time">
                              <ResponsiveContainer width="100%" height={250}>
                                <RechartsAreaChart data={chartData}>
                                  <defs>
                                    <linearGradient id="bandwidthGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                                  <XAxis dataKey="time" stroke="#6B7280" fontSize={10} fontWeight="bold" />
                                  <YAxis stroke="#6B7280" fontSize={10} fontWeight="bold" />
                                  <RechartsTooltip
                                    contentStyle={{
                                      backgroundColor: '#050505',
                                      border: '1px solid rgba(255,255,255,0.1)',
                                      borderRadius: '2px',
                                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="usage"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    fill="url(#bandwidthGradient)"
                                  />
                                </RechartsAreaChart>
                              </ResponsiveContainer>
                            </div>
                          </GlassWrapper>
                        </div>

                        <GlassWrapper className="bg-[#0a0a0c] border-white/5 overflow-hidden rounded-sm">
                          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                                </div>
                                <div>
                                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Node_Distribution</h3>
                                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Asset_Spatial_Intelligence</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 border border-white/10 text-slate-500 hover:bg-white/5 rounded-sm"
                                onClick={() => {
                                  const data = [
                                    { name: 'Active', value: stats.active_devices },
                                    { name: 'Inactive', value: Math.max(0, stats.total_devices - stats.active_devices) },
                                  ]
                                  const csv = 'Name,Value\n' + data.map(row => `${row.name},${row.value} `).join('\n')
                                  const blob = new Blob([csv], { type: 'text/csv' })
                                  const url = URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = 'device-status.csv'
                                  a.click()
                                  URL.revokeObjectURL(url)
                                  addToast('Device status data exported', 'success')
                                }}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-6">
                            <ResponsiveContainer width="100%" height={200}>
                              <RechartsPieChart>
                                <Pie
                                  data={deviceStatusData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                  stroke="none"
                                  onClick={(data) => addToast(`Node Type: ${data.name} `, 'info')}
                                  cursor="pointer"
                                >
                                  {deviceStatusData.map((entry, index) => (
                                    <Cell key={`cell - ${index} `} fill={entry.name === 'Active' ? '#00FF41' : '#ff4444'} />
                                  ))}
                                </Pie>
                                <RechartsTooltip
                                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px' }}
                                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-around mt-6 pt-4 border-t border-white/5">
                              <div className="text-center">
                                <div className="text-2xl font-black text-emerald-500 italic tracking-tighter">{stats.active_devices}</div>
                                <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">Synchronized</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-black text-cosmic-red italic tracking-tighter">{Math.max(0, stats.total_devices - stats.active_devices)}</div>
                                <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">Disconnected</div>
                              </div>
                            </div>
                          </div>
                        </GlassWrapper>

                        <GlassWrapper className="bg-[#0a0a0c] border-white/5 overflow-hidden rounded-sm">
                          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                                <Activity className="h-4 w-4 text-blue-400" />
                              </div>
                              <div>
                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Resource_Flux</h3>
                                <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">High_Precision_Monitoring</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-6">
                            <ResponsiveContainer width="100%" height={200}>
                              <RechartsBarChart data={performanceMetrics}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                                <XAxis dataKey="name" stroke="#333" fontSize={9} fontWeight="bold" axisLine={false} tickLine={false} />
                                <YAxis stroke="#333" fontSize={9} fontWeight="bold" axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px' }}
                                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                  {performanceMetrics.map((entry, index) => (
                                    <Cell key={`cell - ${index} `} fill={entry.color} />
                                  ))}
                                </Bar>
                              </RechartsBarChart>
                            </ResponsiveContainer>
                          </div>
                        </GlassWrapper>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                        <GlassWrapper className="bg-[#0a0a0c] border-white/5 overflow-hidden rounded-sm">
                          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-sm">
                                <AreaChart className="h-4 w-4 text-indigo-400" />
                              </div>
                              <div>
                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Traffic_Waveform</h3>
                                <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Packet_Collision_Analysis</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-6">
                            <ResponsiveContainer width="100%" height={300}>
                              <RechartsLineChart data={networkTrafficData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" />
                                <XAxis dataKey="time" stroke="#333" fontSize={9} fontWeight="bold" />
                                <YAxis stroke="#333" fontSize={9} fontWeight="bold" />
                                <RechartsTooltip
                                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px' }}
                                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                />
                                <Legend iconType="circle" />
                                <Line
                                  type="stepAfter"
                                  dataKey="inbound"
                                  stroke="#00FF41"
                                  strokeWidth={2}
                                  name="Inbound"
                                  dot={false}
                                />
                                <Line
                                  type="stepAfter"
                                  dataKey="outbound"
                                  stroke="#0081ff"
                                  strokeWidth={2}
                                  name="Outbound"
                                  dot={false}
                                />
                              </RechartsLineChart>
                            </ResponsiveContainer>
                          </div>
                        </GlassWrapper>

                        <GlassWrapper className="bg-[#0a0a0c] border-white/5 overflow-hidden rounded-sm">
                          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                                <Activity className="h-4 w-4 text-emerald-400" />
                              </div>
                              <div>
                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">System_Health_Overview</h3>
                                <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Core_Biological_Synchronicity</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-6">
                            <div className="grid grid-cols-2 gap-12">
                              <div className="text-center space-y-4">
                                <div className="h-32 relative">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={8} data={[{ value: systemHealthData.cpu }]}>
                                      <RadialBar dataKey="value" cornerRadius={0} fill="#10B981" background={{ fill: '#ffffff03' }} />
                                    </RadialBarChart>
                                  </ResponsiveContainer>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-3xl font-black text-white italic tracking-tighter leading-none">{systemHealthData.cpu}%</div>
                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">CPU_LOAD</div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-center space-y-4">
                                <div className="h-32 relative">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={8} data={[{ value: systemHealthData.memory }]}>
                                      <RadialBar dataKey="value" cornerRadius={0} fill="#F59E0B" background={{ fill: '#ffffff03' }} />
                                    </RadialBarChart>
                                  </ResponsiveContainer>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-3xl font-black text-white italic tracking-tighter leading-none">{systemHealthData.memory}%</div>
                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">MEM_UTIL</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-12 flex flex-col items-center">
                              <div className="relative w-40 h-40 flex items-center justify-center">
                                {/* Visual Flair: Energy Rings */}
                                <div className="absolute inset-0 border border-emerald-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
                                <div className="absolute inset-4 border border-emerald-500/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                                <div className="text-center">
                                  <div className="text-5xl font-black text-emerald-500 italic tracking-tighter leading-none">{systemHealthData.healthScore}</div>
                                  <div className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.4em] mt-2">Nominal</div>
                                </div>
                              </div>
                              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mt-6">Aggregate_Cluster_Integrity_Score</p>
                            </div>
                          </div>
                        </GlassWrapper>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        <SoftLift>
                          <GlassWrapper className="p-8 border-white/5 hover:border-blue-500/20 group transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Connections_Network</p>
                                <div className="text-5xl font-black text-white italic tracking-tighter transition-colors group-hover:text-blue-400 leading-none">
                                  <CountUp value={metrics ? Object.keys(metrics).length : 0} />
                                </div>
                                <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] mt-3">Active_Monitoring_Links</p>
                              </div>
                              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-sm">
                                <Wifi className="h-8 w-8 text-blue-500/60" />
                              </div>
                            </div>
                          </GlassWrapper>
                        </SoftLift>

                        <SoftLift>
                          <GlassWrapper className="p-8 border-white/5 hover:border-emerald-500/20 group transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Cluster_Pathology</p>
                                <div className="text-5xl font-black text-white italic tracking-tighter transition-colors group-hover:text-emerald-400 leading-none">
                                  <CountUp value={systemHealthData.healthScore} />
                                  <span className="text-lg not-italic text-slate-500 ml-1">%</span>
                                </div>
                                <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] mt-3">Aggregate_System_Pulse</p>
                              </div>
                              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-sm">
                                <Activity className="h-8 w-8 text-emerald-500/60" />
                              </div>
                            </div>
                          </GlassWrapper>
                        </SoftLift>

                        <SoftLift>
                          <GlassWrapper className="p-8 border-white/5 hover:border-purple-500/20 group transition-all sm:col-span-2 lg:col-span-1">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Data_Throughput</p>
                                <div className="text-5xl font-black text-white italic tracking-tighter transition-colors group-hover:text-purple-400 leading-none">
                                  2.4 <span className="text-lg not-italic text-slate-500">TB</span>
                                </div>
                                <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] mt-3">Monthly_Processed_Volume</p>
                              </div>
                              <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-sm">
                                <Cpu className="h-8 w-8 text-purple-500/60" />
                              </div>
                            </div>
                          </GlassWrapper>
                        </SoftLift>
                      </div>
                    </section>
                  )}
                </StaggerItem>
              </StaggerList>

              {/* Right Sidebar - Onboarding & Extras */}
              <div className="space-y-6">
                {/* Onboarding Widget */}
                <div className="bg-oled-black border border-earth-green/20 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(0,255,65,0.05)]">
                  <OnboardingProgress progress={onboardingProgress} tasks={onboardingTasks} className="border-0" />
                </div>

                {/* Quick Actions moved here or other widgets */}
                <div className="bg-oled-black border border-white/5 rounded-lg p-6">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">System Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Gateway</span>
                      <span className="text-earth-green">ONLINE</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Database</span>
                      <span className="text-earth-green">CONNECTED</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Licensing</span>
                      <span className="text-white">PRO_TIER</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modals */}
            <WelcomeModal
              isOpen={showWelcome}
              onClose={() => setShowWelcome(false)}
              onStart={handleWelcomeStart}
            />

            <AnimatePresence>
              {showWizard && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                >
                  <SetupWizard
                    onComplete={handleWizardComplete}
                    onCancel={() => setShowWizard(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="fixed top-4 right-4 z-50 space-y-2">
              {toasts.map((toast) => (
                <div
                  key={toast.id}
                  className={`max - w - sm p - 4 rounded - lg shadow - lg border transition - all duration - 300 ${toast.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                    : toast.type === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                    } `}
                  role="alert"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{toast.message}</p>
                    <button
                      onClick={() => removeToast(toast.id)}
                      className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                      aria-label="Close notification"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}