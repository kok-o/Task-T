import { NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, clientsApi, mastersApi } from '@/api';
import {
  CalendarDays,
  Users,
  Scissors,
  LayoutDashboard,
  Settings,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api';
import { cn } from '@/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Сегодня', roles: ['OWNER', 'MASTER'] },
  { to: '/calendar', icon: CalendarDays, label: 'Календарь', roles: ['OWNER', 'MASTER'] },
  { to: '/clients', icon: Users, label: 'Клиенты', roles: ['OWNER', 'MASTER'] },
  { to: '/masters', icon: UserCheck, label: 'Мастера', roles: ['OWNER'] },
  { to: '/services', icon: Scissors, label: 'Услуги', roles: ['OWNER'] },
  { to: '/settings', icon: Settings, label: 'Настройки', roles: ['OWNER'] },
];

export function Sidebar() {
  const { user, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleLogout = async () => {
    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => {});
    }
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  );

  return (
    <aside className="hidden md:flex w-64 h-screen flex-col bg-card shadow-sm border-r border-border/50 sticky top-0 z-10">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-border/30">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-lg shadow-sm">
            💅
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Nail Studio</p>
            <p className="text-xs text-muted-foreground">Управление записями</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onMouseEnter={() => {
                  if (item.to === '/calendar') {
                    qc.prefetchQuery({ queryKey: ['appointments', undefined], queryFn: () => appointmentsApi.list() });
                  } else if (item.to === '/clients') {
                    qc.prefetchQuery({ queryKey: ['clients', undefined], queryFn: () => clientsApi.list() });
                  } else if (item.to === '/masters') {
                    qc.prefetchQuery({ queryKey: ['masters'], queryFn: () => mastersApi.list() });
                  }
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User & Logout */}
      <div className="px-3 py-4 border-t border-border/30 space-y-1">
        <div className="px-3 py-2 rounded-2xl bg-muted/50">
          <p className="text-xs font-medium truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground">
            {user?.role === 'OWNER' ? '👑 Владелец' : '✂️ Мастер'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
