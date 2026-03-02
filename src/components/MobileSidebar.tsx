import { Home, ShoppingBag, Package, Settings, LogOut, PlusCircle, LayoutGrid, Tag, FolderPlus, X } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';

const userLinks = [
  { to: '/', label: 'Home', icon: Home },
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

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const { user, logout, hasRole } = useAuth();
  const isAdmin = hasRole(['admin', 'distributor', 'reseller']);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground animate-slide-in-left shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">🐉</span>
            <span className="font-display text-xl font-bold text-sidebar-accent-foreground gold-glow">DSG Tech</span>
            <span className="text-lg">🐉</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {userLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
              onClick={onClose}
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
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                  onClick={onClose}
                >
                  <link.icon className="w-4.5 h-4.5" />
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {user && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sm font-bold text-sidebar-primary-foreground">
                {(user.name || user.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user.name || user.email}</p>
              </div>
              <button onClick={logout} className="p-1.5 rounded-md hover:bg-sidebar-accent">
                <LogOut className="w-4 h-4 text-sidebar-muted" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
