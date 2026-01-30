export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'engineer' | 'viewer' | 'seller'
  is_verified?: boolean
  created_at: string
  updated_at: string
}

export interface Device {
  id: number
  ip_address: string
  mac_address: string
  hostname: string
  vendor: string
  device_type: string
  os: string
  snmp_version: string
  community: string
  username: string
  password: string
  location: string
  notes: string
  status: 'discovered' | 'active' | 'inactive' | 'unknown'
  last_seen: string
  created_at: string
  updated_at: string
}

export interface ConfigBackup {
  id: number
  device_id: number
  device: Device
  config: string
  version: string
  tags: string
  created_at: string
  updated_at: string
}

export interface TelemetryData {
  id: number
  device_id: number
  device: Device
  metric: string
  value: number
  unit: string
  timestamp: string
  created_at: string
  updated_at: string
}

export interface DiscoveryJob {
  id: number
  subnet: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  results: string
  error: string
  started_at: string
  completed_at: string
  created_at: string
  updated_at: string
}

export interface NetworkAlert {
  id: number
  device_id?: number
  device?: Device
  type: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  acknowledged: boolean
  resolved: boolean
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginRequest {
  username: string
  password: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface NetworkStats {
  total_devices: number
  active_devices: number
  total_alerts: number
  critical_alerts: number
  uptime_percentage: number
  bandwidth_usage: number
}

// Module Marketplace Types
export type ExecutionMode = 'server' | 'browser' | 'hybrid'
export type LicenseType = 'preview' | 'lease' | 'purchase'
export type ModuleCategory = 'church' | 'school' | 'healthcare' | 'retail' | 'business' | 'security' | 'analytics' | 'network' | 'events' | 'compliance'

export interface PrimitiveRef {
  module: string
  method: string
  config: Record<string, any>
}

export interface Module {
  id: string
  name: string
  description: string
  category: string
  version: string
  price: number
  license_type: LicenseType
  execution_mode: ExecutionMode
  primitives: PrimitiveRef[]
  ui_template?: string
  ui_schema: Record<string, any>
  author: string
  icon_url?: string
  tags: string[]
  requires_hal: boolean
  requires_gpu: boolean
  aura_types: string[]
  downloads: number
  rating: number
  review_count: number
  created_at: string
  updated_at: string
}

export interface ModuleLicense {
  id: number
  user_id: number
  module_id: string
  type: LicenseType
  starts_at: string
  expires_at?: string
  max_executions?: number
  execution_count: number
  is_active: boolean
  created_at: string
}

export interface ModuleExecutionLog {
  id: number
  user_id: number
  module_id: string
  execution_mode: ExecutionMode
  status: 'pending' | 'running' | 'success' | 'failed'
  duration_ms: number
  error?: string
  created_at: string
}
