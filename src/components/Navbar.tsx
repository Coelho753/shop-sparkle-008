import { Search, ShoppingCart, Sun, Moon, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { MobileSidebar } from '@/components/MobileSidebar';
import { useTheme } from 'next-themes';
import { useCategories } from '@/hooks/useCategories';
import { motion, AnimatePresence } from 'framer-motion';
import dsgLogo from '@/assets/dsg-logo-dragon.webp';

export function Navbar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catExpanded, setCatExpanded] = useState(true);
  const { theme, setTheme } = useTheme();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const { data: categories } = useCategories();

  return (
    <>
      <header className="sticky top-0 z-30 bg-navbar border-b border-primary/20">
        {/* Main bar */}
        <div className="flex items-center gap-3 px-4 md:px-6 h-14">
          {/* Logo - acts as menu button on mobile */}
          <button
            onClick={() => { if (window.innerWidth < 768) setMobileOpen(true); else navigate('/'); }}
            className="flex items-center gap-2 shrink-0 p-1 rounded-full hover:ring-2 hover:ring-primary/50 transition-all"
          >
            <img src={dsgLogo} alt="DSG Tech" className="w-8 h-8 rounded-full" />
            <span className="hidden sm:block font-display font-bold text-primary gold-glow text-lg tracking-wide">
              DSG Tech
            </span>
          </button>

          {/* Search */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-10 bg-secondary/50 border-primary/10 focus-visible:ring-1 focus-visible:ring-primary h-9 text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={() => navigate('/cart')}>
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Button>
            {user && (
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Categories expanding bar */}
        <div className="border-t border-primary/10">
          <button
            onClick={() => setCatExpanded(!catExpanded)}
            className="flex items-center gap-2 px-4 md:px-6 h-9 w-full text-left hover:bg-primary/5 transition-colors"
          >
            <ChevronRight className={`w-3.5 h-3.5 text-primary transition-transform duration-200 ${catExpanded ? 'rotate-90' : ''}`} />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Categorias</span>
            <span className="text-[10px] text-muted-foreground ml-1">({(categories ?? []).length})</span>
          </button>

          <AnimatePresence initial={false}>
            {catExpanded && (
              <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-primary/5"
              >
                <div className="px-4 md:px-6 py-1.5 flex flex-wrap gap-1">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => navigate('/products')}
                    className="px-3 py-1.5 text-xs font-medium text-navbar-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all duration-200 border border-primary/10"
                  >
                    Todos
                  </motion.button>
                  {(categories ?? []).map((cat, i) => (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      onClick={() => navigate('/products')}
                      className="px-3 py-1.5 text-xs font-medium text-navbar-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all duration-200 border border-primary/10"
                    >
                      {cat.name}
                    </motion.button>
                  ))}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </header>

      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
