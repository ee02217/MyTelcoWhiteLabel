// App Shell - Main layout with sidebar navigation

import { type ReactNode, useState } from 'react';
import { Typography } from '../design-system/Typography';
import { Button } from '../design-system/Button';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const MAIN_NAV: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/usage', label: 'Usage', icon: '📊' },
  { path: '/billing', label: 'Billing', icon: '💳' },
  { path: '/lines', label: 'Lines', icon: '📱' },
  { path: '/roaming', label: 'Roaming', icon: '🌍' },
  { path: '/support', label: 'Support', icon: '🎧' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
];

const SECONDARY_NAV: NavItem[] = [
  { path: '/catalog', label: 'Catalog', icon: '🛒' },
  { path: '/orders', label: 'Orders', icon: '📦' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

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
  notificationCount = 0,
  userName = 'Customer',
  onLogout,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarCollapsed ? '64px' : '240px',
          background: '#1a1a2e',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          position: 'fixed',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: sidebarCollapsed ? '16px' : '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          }}
        >
          {!sidebarCollapsed && (
            <Typography variant="h4" style={{ color: 'white' }}>
              MyTelco
            </Typography>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ color: 'white', minWidth: 'auto', padding: '4px 8px' }}
          >
            {sidebarCollapsed ? '→' : '←'}
          </Button>
        </div>

        {/* Main Navigation */}
        <nav style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          <NavSection
            items={MAIN_NAV}
            currentPath={currentPath}
            onNavigate={onNavigate}
            collapsed={sidebarCollapsed}
          />
          <div
            style={{
              height: '1px',
              background: 'rgba(255,255,255,0.1)',
              margin: '8px 16px',
            }}
          />
          <NavSection
            items={SECONDARY_NAV}
            currentPath={currentPath}
            onNavigate={onNavigate}
            collapsed={sidebarCollapsed}
          />
        </nav>

        {/* User section */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="small"
                  style={{ color: 'white', fontWeight: 500 }}
                >
                  {userName}
                </Typography>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '64px' : '240px',
          transition: 'margin-left 0.2s ease',
        }}
      >
        {/* Header */}
        <header
          style={{
            background: 'white',
            padding: '12px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '16px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('/notifications')}
            style={{ position: 'relative' }}
          >
            🔔
            {notificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  padding: '2px 5px',
                  minWidth: '18px',
                  textAlign: 'center',
                }}
              >
                {notificationCount}
              </span>
            )}
          </Button>
          {onLogout && (
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Logout
            </Button>
          )}
        </header>

        {/* Page content */}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </main>
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
    <div>
      {items.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            style={{
              width: '100%',
              padding: collapsed ? '12px' : '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              border: 'none',
              color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {!collapsed && (
              <Typography variant="body" style={{ color: 'inherit' }}>
                {item.label}
              </Typography>
            )}
          </button>
        );
      })}
    </div>
  );
}
