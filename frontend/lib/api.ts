import axios from 'axios'
import { AuthResponse, LoginRequest } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    // Create axios instance with default config
    this.api = this.createAxiosInstance()
  }

  public getBaseURL(): string {
    return this.baseURL;
  }

  private createAxiosInstance() {
    const instance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      // Enable withCredentials to send cookies with cross-origin requests
      withCredentials: true,
    });

    // Add request interceptor for auth token
    instance.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`
      }
      return config
    })

    // Add response interceptor for error handling
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken() // Just clear token on 401, don't make API call
        }
        return Promise.reject(error)
      }
    )

    return instance
  }

  private api: ReturnType<typeof axios.create>

  /**
   * Update user profile
   * @param updates Partial user data to update
   * @returns Updated user data
   */
  async updateUserProfile(updates: Partial<{ name: string; email: string; avatar?: string }>) {
    const response = await this.api.patch<{ user: any }>('/users/me', updates);
    return response.data.user;
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  }

  getToken(): string | null {
    return this.token
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials)
    this.setToken(response.data.token)
    return response.data
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout')
    // Call the private method to clear token
    this.clearToken()
  }

  async forgotPassword(email: string): Promise<{ message: string; reset_link?: string }> {
    const response = await this.api.post('/auth/forgot-password', { email })
    return response.data
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await this.api.post('/auth/reset-password', { token, password })
    return response.data
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async register(userData: { username: string; email: string; password: string }): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', userData)
    return response.data
  }

  // Device management
  async getDevices() {
    const response = await this.api.get('/devices')
    return response.data
  }

  async getDevice(id: number) {
    const response = await this.api.get(`/devices/${id}`)
    return response.data
  }

  async createDevice(data: Partial<import('@/types').Device>) {
    const response = await this.api.post('/devices', data)
    return response.data
  }

  async updateDevice(id: number, data: Partial<import('@/types').Device>) {
    const response = await this.api.put(`/devices/${id}`, data)
    return response.data
  }

  async deleteDevice(id: number) {
    await this.api.delete(`/devices/${id}`)
  }

  // Network discovery
  async startDiscovery(subnets: string[]) {
    const response = await this.api.post('/discovery/start', {
      target_networks: subnets,
      enable_snmp: true,
      snmp_community: 'public',
    })
    return response.data
  }

  async getDiscoveryStatus(jobId: string) {
    const response = await this.api.get(`/discovery/status/${jobId}`)
    return response.data
  }

  // Configuration management
  async getBackups() {
    const response = await this.api.get('/configs')
    return response.data
  }

  async createBackup(deviceId: number) {
    const response = await this.api.post('/config/backup', { device_id: deviceId })
    return response.data
  }

  async restoreConfig(deviceId: string) {
    const response = await this.api.post(`/config/restore/${deviceId}`)
    return response.data
  }

  async compareConfigs(deviceId: string) {
    const response = await this.api.get(`/config/compare/${deviceId}`)
    return response.data
  }

  async applyTemplate(templateData: any) {
    const response = await this.api.post('/config/template/apply', templateData)
    return response.data
  }

  // Telemetry and monitoring
  async getLiveMetrics() {
    const response = await this.api.get('/telemetry/metrics/live')
    return response.data
  }

  async getHistoricalMetrics(deviceId: string, start?: string, end?: string) {
    const params = new URLSearchParams()
    if (start) params.append('start', start)
    if (end) params.append('end', end)

    const response = await this.api.get(`/telemetry/history/${deviceId}?${params}`)
    return response.data
  }

  async getAlerts() {
    const response = await this.api.get('/telemetry/alerts')
    return response.data
  }

  // User management (admin only)
  async getUsers() {
    const response = await this.api.get('/rbac/admin/users')
    return response.data
  }

  async createUser(userData: any) {
    const response = await this.api.post('/rbac/admin/users', userData)
    return response.data
  }

  async updateUser(id: number, userData: any) {
    const response = await this.api.patch(`/rbac/admin/users/${id}`, userData)
    return response.data
  }

  async deleteUser(id: number) {
    await this.api.delete(`/rbac/admin/users/${id}`)
  }

  // Settings
  async getSettings() {
    const response = await this.api.get('/settings')
    return response.data
  }

  async updateSettings(settings: any) {
    const response = await this.api.patch('/settings', settings)
    return response.data
  }

  // RBAC Role Management (Admin)
  async getAdminRoles() {
    const response = await this.api.get('/rbac/admin/roles')
    return response.data
  }

  async createRole(role: any) {
    const response = await this.api.post('/rbac/admin/roles', role)
    return response.data
  }

  async updateRole(role: any) {
    const response = await this.api.put('/rbac/admin/roles', role)
    return response.data
  }

  async deleteRole(id: number) {
    await this.api.delete(`/rbac/admin/roles/${id}`)
  }

  // IPAM
  async getIPPools() {
    const response = await this.api.get('/ipam/pools')
    return response.data
  }

  async createIPPool(pool: any) {
    const response = await this.api.post('/ipam/pools', pool)
    return response.data
  }

  // Health & Recovery
  async get<T = any>(url: string) {
    const response = await this.api.get<T>(url)
    return response.data
  }

  async post<T = any>(url: string, data: any = {}) {
    const response = await this.api.post<T>(url, data)
    return response.data
  }

  async patch<T = any>(url: string, data: any = {}) {
    const response = await this.api.patch<T>(url, data)
    return response.data
  }

  async put<T = any>(url: string, data: any = {}) {
    const response = await this.api.put<T>(url, data)
    return response.data
  }

  async delete<T = any>(url: string) {
    const response = await this.api.delete<T>(url)
    return response.data
  }

  async upload(url: string, data: FormData, config?: { onUploadProgress?: (progressEvent: any) => void }) {
    const response = await this.api.post(url, data, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }

  // Health API
  async getLatestHealthAnalysis() {
    return this.get('/health/analysis/latest')
  }

  async runHealthAnalysis() {
    return this.post('/health/analysis/run', {})
  }

  async getHealthIssues(analysisId: number) {
    return this.get(`/health/analysis/${analysisId}/issues`)
  }

  async getQuickFixes(issueId: number) {
    return this.get(`/health/issues/${issueId}/fixes`)
  }

  async applyQuickFix(fixId: number) {
    return this.post(`/health/fixes/${fixId}/apply`, {})
  }

  // Onboarding API
  async getOnboardingStatus() {
    return this.get('/onboarding/status')
  }

  async getOnboardingTours() {
    return this.get('/onboarding/tours')
  }

  async completeOnboardingStep(stepId: number) {
    return this.post(`/onboarding/steps/${stepId}/complete`, {})
  }

  async skipOnboardingStep(stepId: number) {
    return this.post(`/onboarding/steps/${stepId}/skip`, {})
  }

  // Topology API
  async getLatestTopologyAnalysis() {
    return this.get('/topology/analysis/latest')
  }

  async runTopologyAnalysis() {
    return this.post('/topology/analysis/run', {})
  }

  async exportTopologyData() {
    return this.get('/topology/export')
  }

  // Reporting API
  async getReports() {
    return this.get('/reports')
  }

  async getReportsByType(type: string) {
    return this.get(`/reports/type/${type}`)
  }

  async getTrafficStats(timeRange: string = '1h') {
    return this.get(`/network/traffic?range=${timeRange}`)
  }

  async getNetworkFlows(timeRange: string = '1h') {
    return this.get(`/network/top-talkers?range=${timeRange}`)
  }

  async generateIncidentReport(timeRange: string) {
    return this.post('/reports/generate/incident', { time_range: timeRange })
  }

  async generatePerformanceReport(timeRange: string) {
    return this.post('/reports/generate/performance', { time_range: timeRange })
  }

  async generateSecurityReport(timeRange: string) {
    return this.post('/reports/generate/security', { time_range: timeRange })
  }

  async exportReport(reportId: number, format: string = 'json') {
    return this.get(`/reports/${reportId}/export?format=${format}`)
  }

  // Staff Tracking API
  async checkIn(location: string) {
    return this.post('/staff/checkin', { location })
  }

  async checkOut() {
    return this.post('/staff/checkout', {})
  }

  async getTodayAttendance() {
    return this.get('/staff/attendance/today')
  }

  async getAttendanceReport(days: number = 30) {
    return this.get(`/staff/attendance/report?days=${days}`)
  }

  async logWork(workLog: any) {
    return this.post('/staff/worklog', workLog)
  }

  async completeWorkLog(logId: number, notes: string) {
    return this.post(`/staff/worklog/${logId}/complete`, { notes })
  }

  async getWorkLogReport(days: number = 30) {
    return this.get(`/staff/worklog/report?days=${days}`)
  }

  async requestLeave(leaveRequest: any) {
    return this.post('/staff/leave/request', leaveRequest)
  }

  async approveLeave(requestId: number, comments: string) {
    return this.post(`/staff/leave/${requestId}/approve`, { comments })
  }

  // RBAC & Audit API
  async getUserRoles() {
    return this.get('/rbac/roles')
  }

  async getUserActivity(days: number = 30) {
    return this.get(`/rbac/activity?days=${days}`)
  }

  async getAuditLogs(params?: { userId?: number; resource?: string; limit?: number }) {
    const query = new URLSearchParams()
    if (params?.userId) query.append('user_id', params.userId.toString())
    if (params?.resource) query.append('resource', params.resource)
    if (params?.limit) query.append('limit', params.limit.toString())
    return this.get(`/audit/logs?${query}`)
  }

  // Workflows (Flow Forge)
  async getWorkflows() {
    const response = await this.api.get('/workflows')
    return response.data
  }

  async getWorkflow(id: string | number) {
    const response = await this.api.get(`/workflows/${id}`)
    return response.data
  }

  async createWorkflow(data: any) {
    const response = await this.api.post('/workflows', data)
    return response.data
  }

  async updateWorkflow(id: string | number, data: any) {
    const response = await this.api.put(`/workflows/${id}`, data)
    return response.data
  }

  async runWorkflow(id: string | number) {
    const response = await this.api.post(`/workflows/${id}/run`)
    return response.data
  }

  // Finance & Wallet API
  async getWallet() {
    return this.get('/finance/wallet')
  }

  async getWalletTransactions() {
    return this.get('/finance/wallet/transactions')
  }

  async topUpWallet(amount: number, ref: string) {
    return this.post('/finance/wallet/topup', { amount, ref })
  }

  async getSellerStats() {
    return this.get('/finance/seller/stats')
  }

  async getPricingPackages(type?: string) {
    return this.get(`/hotspot/packages${type ? `?type=${type}` : ''}`)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient
