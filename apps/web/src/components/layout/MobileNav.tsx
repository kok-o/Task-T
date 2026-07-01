import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  Users,
  Scissors,
  LayoutDashboard,
  Settings,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Главная', roles: ['OWNER', 'MASTER'] },
  { to: '/calendar', icon: CalendarDays, label: 'Записи', roles: ['OWNER', 'MASTER'] },
  { to: '/clients', icon: Users, label: 'Клиенты', roles: ['OWNER', 'MASTER'] },
  { to: '/masters', icon: UserCheck, label: 'Мастера', roles: ['OWNER'] },
  { to: '/services', icon: Scissors, label: 'Услуги', roles: ['OWNER'] },
  { to: '/settings', icon: Settings, label: 'Настройки', roles: ['OWNER'] },
];

export function MobileNav() {
  const { user } = useAuthStore();
  const visibleItems = navItems.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  ).slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-4px_24px_rgb(0,0,0,0.02)]">
      <ul className="flex items-center justify-around px-2 py-2">
        {visibleItems.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "p-1.5 rounded-full transition-colors duration-300", 
                    isActive ? "bg-primary/10" : ""
                  )}>
                    <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium tracking-wide",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
