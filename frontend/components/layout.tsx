import { ReactNode, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/use-auth'
import { useMounted } from '@/hooks/use-mounted'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/theme-context'
import {
  LayoutDashboard,
  Network,
  Settings,
  Users,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  List,
  Sun,
  Moon,
  Shield,
  Activity,
  FileText,
  AlertCircle,
  MessageSquare,
  Zap,
  ShoppingCart,
  Wallet,
  Upload,
} from '@/components/icons'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { BlurReveal, SoftLift } from '@/components/ui/motion-container'

interface LayoutProps {
  children: ReactNode
  title?: string
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Devices', href: '/devices', icon: Network },
  { name: 'Wireless', href: '/wireless', icon: Zap },
  { name: 'Discovery', href: '/discovery', icon: Search },
  { name: 'Configuration', href: '/config', icon: Settings },
  { name: 'SD-WAN', href: '/sdwan', icon: Network },
  { name: 'Telemetry', href: '/telemetry', icon: Bell },
  { name: 'Health', href: '/health', icon: Shield },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Simulation', href: '/simulation', icon: Activity },
  { name: 'Tickets', href: '/tickets', icon: AlertCircle },
  { name: 'Migration', href: '/migration', icon: Upload },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingCart },
  { name: 'Hub', href: '/community', icon: Users },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Studio_Home', href: '/studio/dashboard', icon: LayoutDashboard },
  { name: 'App_Forge', href: '/studio/create', icon: Zap },
  { name: 'PDF_Forge', href: '/studio/pdf', icon: FileText },
  { name: 'Flow_Forge', href: '/studio/flow', icon: Network },
]

const adminNavigation = [
  { name: 'User_Management', href: '/admin/users', icon: Users },
  { name: 'Role_Management', href: '/admin/roles', icon: Shield },
  { name: 'Market_Sellers', href: '/admin/sellers', icon: ShoppingCart },
  { name: 'Network_Topology', href: '/admin/topology', icon: Network },
  { name: 'Nexus_Traffic', href: '/admin/nexus', icon: Activity },
  { name: 'Scheduled_Tasks', href: '/admin/tasks', icon: List },
  { name: 'GIS_Mapping', href: '/admin/gis', icon: Search },
  { name: 'Monetization_Ctrl', href: '/admin/monetization', icon: Wallet },
  { name: 'System_Settings', href: '/admin/settings', icon: Settings },
]

export default function Layout({ children, title = 'Network Automation' }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const mounted = useMounted()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', sidebarOpen)
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [sidebarOpen])


  if (!mounted || !isAuthenticated) {
    return <>{children}</>
  }

  const currentPath = router.asPath
  const isActive = (href: string) => currentPath === href || currentPath.startsWith(`${href}/`)
  const isDarkTheme = theme === 'dark'

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] lg:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Network Automation Platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Mobile sidebar overlay - Enhanced */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar - Enhanced responsive design */}
      <div
        id="primary-navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 sm:w-72 lg:w-80 bg-oled-black border-r border-white/5 shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="navigation"
        aria-label="Primary"
      >
        <div className="flex flex-col h-full">
          {/* Logo - Alien Net Branding */}
          <div className="flex items-center justify-between h-16 sm:h-20 px-6 bg-oled-black border-b border-white/5">
            <Logo variant="sidebar" />
            <Button
              variant="ghost"
              size="icon"
              className="text-[hsl(var(--primary-foreground))] hover:bg-white/10 focus-visible:ring-white lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation - Enhanced spacing and responsiveness */}
          <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block"
                  onClick={() => setSidebarOpen(false)}
                >
                  <SoftLift
                    className={cn(
                      "group flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-200 border border-transparent",
                      isActive(item.href)
                        ? "bg-stardust-violet/10 text-stardust-violet border-stardust-violet/20 shadow-[inset_0_0_10px_rgba(138,43,226,0.05)]"
                        : "text-slate-500 hover:text-white hover:bg-white/5"
                    )}
                    style={{ borderRadius: '2px' }}
                  >
                    <Icon className={cn(
                      "w-4 h-4 mr-4 transition-colors",
                      isActive(item.href) ? "text-stardust-violet" : "text-slate-600 group-hover:text-slate-300"
                    )} />
                    <span className="truncate">{item.name}</span>
                  </SoftLift>
                </Link>
              )
            })}

            {/* Admin navigation - Enhanced visual separation */}
            {user?.role === 'admin' && (
              <>
                <div className="pt-8 pb-4">
                  <div className="px-4">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] border-b border-white/5 pb-2">
                      Administration
                    </div>
                  </div>
                </div>
                {adminNavigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-200 border border-transparent",
                        isActive(item.href)
                          ? "bg-cosmic-red/10 text-cosmic-red border-cosmic-red/20 shadow-[inset_0_0_10px_rgba(255,77,0,0.05)]"
                          : "text-slate-500 hover:text-white hover:bg-white/5"
                      )}
                      style={{ borderRadius: '2px' }}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      <Icon className={cn(
                        "w-4 h-4 mr-4 transition-colors",
                        isActive(item.href) ? "text-cosmic-red" : "text-slate-600 group-hover:text-slate-300"
                      )} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          {/* User info - Technical Style */}
          <div className="p-6 border-t border-white/5 bg-[#030303]">
            <div className="flex items-center space-x-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white uppercase tracking-widest truncate">
                  {user?.name}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 text-[8px] font-black border border-earth-green/30 bg-earth-green/5 text-earth-green uppercase tracking-[0.2em]">
                    {user?.role}
                  </span>
                  <div className="w-1.5 h-1.5 bg-earth-green rounded-full animate-pulse shadow-[0_0_8px_rgba(45,90,39,0.5)]"></div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex-shrink-0 hover:bg-white/5 text-slate-600 hover:text-white transition-colors"
                style={{ borderRadius: '1.5px' }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="min-h-screen flex-1 bg-oled-black relative">
        {/* Technical Grid Background */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.05]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-cosmic-red/5 via-void-indigo/5 to-transparent" />
        </div>

        {/* Top bar - Enhanced */}
        <div className="sticky top-0 z-30 bg-oled-black/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
          <div className="px-6 py-4 mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden hover:bg-white/5 rounded p-2 text-slate-400"
                  onClick={() => setSidebarOpen(true)}
                  aria-expanded={sidebarOpen}
                  aria-controls="primary-navigation"
                >
                  <Menu className="w-6 h-6" />
                </Button>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                    {title}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5 hidden sm:block">
                    Network_Status_v2.0
                  </p>
                </div>
              </div>

              {/* Right side - notifications and actions */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-white/5 rounded p-2 text-slate-500"
                  onClick={toggleTheme}
                >
                  {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" className="relative hover:bg-white/5 rounded p-2 text-slate-500">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-cosmic-red rounded-full shadow-[0_0_8px_rgba(255,71,0,0.5)]">
                  </span>
                </Button>

                {/* User avatar - Sharp */}
                <div className="hidden lg:flex items-center space-x-3">
                  <div className="w-8 h-8 border border-white/10 bg-white/5 flex items-center justify-center" style={{ borderRadius: '1.5px' }}>
                    <span className="text-[10px] font-black text-earth-green uppercase">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content - Enhanced spacing for all platforms */}
        <main id="main-content" className="px-4 pb-10 pt-4 sm:px-6 sm:pt-6 sm:pb-12 lg:px-8">
          <BlurReveal key={router.asPath} className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8">
            {children}
          </BlurReveal>
        </main>
      </div>
    </div>
  )
}
