// App Shell - Premium layout with sidebar navigation

import { type ReactNode, useState, type ComponentType, type SVGProps } from 'react';
import {
  HomeIcon,
  ChartBarIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  path: string;
  label: string;
  icon: HeroIcon;
}

const MAIN_NAV: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: HomeIcon },
  { path: '/usage', label: 'Usage', icon: ChartBarIcon },
  { path: '/billing', label: 'Billing', icon: CreditCardIcon },
  { path: '/lines', label: 'Lines', icon: DevicePhoneMobileIcon },
  { path: '/roaming', label: 'Roaming', icon: GlobeAltIcon },
  { path: '/support', label: 'Support', icon: ChatBubbleLeftRightIcon },
  { path: '/notifications', label: 'Notifications', icon: BellIcon },
];

const SECONDARY_NAV: NavItem[] = [
  { path: '/catalog', label: 'Catalog', icon: ShoppingCartIcon },
  { path: '/orders', label: 'Orders', icon: ArchiveBoxIcon },
  { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/usage': 'Usage Details',
  '/billing': 'Billing',
  '/lines': 'My Lines',
  '/roaming': 'Roaming',
  '/support': 'Support',
  '/notifications': 'Notifications',
  '/catalog': 'Catalog',
  '/orders': 'Orders',
  '/settings': 'Settings',
};

interface AppShellProps {
  children: ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  notificationCount?: number;
  userName?: string;
  onLogout?: () => void;
}

export function AppShell({
  children,
  currentPath,
  onNavigate,
  notificationCount = 3,
  userName = 'Customer',
  onLogout,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const pageTitle = PAGE_TITLES[currentPath] || (currentPath.startsWith('/lines/') ? 'Line Detail' : 'MyTelco');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--premium-bg)' }}>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          {!sidebarCollapsed && <span className="sidebar-logo-text">MyTelco</span>}
          <button
            className="btn-icon-only"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ color: 'rgba(255,255,255,.6)', width: '32px', height: '32px' }}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon style={{ width: 18, height: 18 }} />
            ) : (
              <ChevronLeftIcon style={{ width: 18, height: 18 }} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {!sidebarCollapsed && <div className="sidebar-section-label">Main</div>}
          <NavSection
            items={MAIN_NAV}
            currentPath={currentPath}
            onNavigate={onNavigate}
            collapsed={sidebarCollapsed}
          />
          <div className="sidebar-divider" />
          {!sidebarCollapsed && <div className="sidebar-section-label">More</div>}
          <NavSection
            items={SECONDARY_NAV}
            currentPath={currentPath}
            onNavigate={onNavigate}
            collapsed={sidebarCollapsed}
          />
        </nav>

        {/* User section */}
        <div className="sidebar-user">
          <div className="row" style={{ gap: '10px' }}>
            <div className="sidebar-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }} className="truncate">
                  {userName}
                </div>
                <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.75rem' }}>Customer</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`app-main ${sidebarCollapsed ? 'app-main-collapsed' : ''}`}>
        {/* Header */}
        <header className="app-header">
          <span className="app-header-title">{pageTitle}</span>
          <div className="row" style={{ gap: '8px' }}>
            <button
              className="btn-icon-only relative"
              onClick={() => onNavigate('/notifications')}
              aria-label="Notifications"
            >
              <BellIcon style={{ width: 20, height: 20 }} />
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </button>
            {onLogout && (
              <button className="btn-icon-only" onClick={onLogout} aria-label="Logout" title="Logout">
                <ArrowRightOnRectangleIcon style={{ width: 20, height: 20 }} />
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="app-content" style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

interface NavSectionProps {
  items: NavItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
}

function NavSection({ items, currentPath, onNavigate, collapsed }: NavSectionProps) {
  return (
    <div className="stack" style={{ gap: '2px' }}>
      {items.map((item) => {
        const isActive = currentPath === item.path;
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
            style={collapsed ? { justifyContent: 'center', padding: '10px' } : undefined}
            title={collapsed ? item.label : undefined}
          >
            <Icon style={{ width: 20, height: 20, flexShrink: 0 }} />
            {!collapsed && <span>{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
