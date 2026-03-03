import { Home, ShoppingBag, Package, Settings, LogOut, PlusCircle, LayoutGrid, Tag, FolderPlus } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';

const userLinks = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/products', label: 'Produtos', icon: ShoppingBag },
  { to: '/my-orders', label: 'Minhas Compras', icon: Package },
  { to: '/settings', label: 'Configurações', icon: Settings },
];

const adminLinks = [
  { to: '/admin/add-product', label: 'Adicionar Produto', icon: PlusCircle },
  { to: '/admin/manage-products', label: 'Gerenciar Produtos', icon: LayoutGrid },
  { to: '/admin/promotions', label: 'Criar Promoção', icon: Tag },
  { to: '/admin/categories', label: 'Criar Categoria', icon: FolderPlus },
];

export function AppSidebar() {
  const { user, logout, hasRole } = useAuth();
  const isAdmin = hasRole(['admin', 'distributor', 'reseller']);

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <span className="font-display text-xl font-bold text-sidebar-accent-foreground tracking-tight">DSG Tech</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">Menu</p>
        {userLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/home'}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
          >
            <link.icon className="w-4.5 h-4.5" />
            <span>{link.label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="my-4 border-t border-sidebar-border" />
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">Admin</p>
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
              >
                <link.icon className="w-4.5 h-4.5" />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      {user && (
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sm font-bold text-sidebar-primary-foreground">
              {(user.name || user.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user.name || user.email}</p>
              <p className="text-xs text-sidebar-muted truncate">{user.role}</p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors" title="Sair">
              <LogOut className="w-4 h-4 text-sidebar-muted" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
