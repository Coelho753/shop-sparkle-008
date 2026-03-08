import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(items.map(i => i.product.id)));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.product.id)));
    }
  };

  const selectedItems = items.filter(i => selectedIds.has(i.product.id));
  const selectedTotal = selectedItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const selectedCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0);

  const handleCheckout = () => {
    if (selectedItems.length === 0) return;
    sessionStorage.setItem('dsg-selected-items', JSON.stringify(selectedIds.size === items.length ? [] : Array.from(selectedIds)));
    navigate('/order-confirmation');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in text-center py-20 space-y-4">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/30" />
        <h1 className="text-2xl font-display font-bold text-foreground">Carrinho vazio</h1>
        <p className="text-muted-foreground">Adicione produtos para começar.</p>
        <Button variant="outline" onClick={() => navigate('/products')}>
          Ver produtos
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar ao início
      </Button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">
            Carrinho ({totalItems})
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
          Limpar tudo
        </Button>
      </div>

      {/* Select all */}
      <div className="flex items-center gap-2 px-1">
        <Checkbox
          checked={selectedIds.size === items.length}
          onCheckedChange={toggleAll}
          id="select-all"
        />
        <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
          Selecionar todos ({items.length})
        </label>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map(({ product, quantity }) => {
          const isUnavailable = !product.active || product.stock <= 0;
          const isSelected = selectedIds.has(product.id);
          return (
            <div
              key={product.id}
              className={`flex gap-4 p-4 rounded-xl bg-card border transition-colors ${
                isUnavailable ? 'border-destructive/50 opacity-60' :
                isSelected ? 'border-primary/50 bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelect(product.id)}
                  disabled={isUnavailable}
                />
              </div>
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-20 h-20 rounded-lg object-cover bg-secondary flex-shrink-0"
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'; }}
              />
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{product.category}</p>
                <h3 className="font-semibold text-foreground text-sm truncate">{product.name}</h3>
                {isUnavailable && (
                  <p className="text-xs text-destructive font-medium">Produto indisponível — remova do carrinho</p>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-primary font-bold">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </span>
                  {product.originalPrice && (
                    <span className="price-original text-xs">
                      R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(product.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(product.id, quantity - 1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-medium w-6 text-center text-foreground">{quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(product.id, quantity + 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Selecionados ({selectedCount} itens)</span>
          <span>R$ {selectedTotal.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="border-t border-border pt-4 flex justify-between items-baseline">
          <span className="font-display font-bold text-foreground text-lg">Total</span>
          <span className="text-2xl font-bold text-primary">
            R$ {selectedTotal.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <Button className="w-full" size="lg" onClick={handleCheckout} disabled={selectedItems.length === 0}>
          Continuar ({selectedCount} {selectedCount === 1 ? 'item' : 'itens'})
        </Button>
      </div>
    </div>
  );
}
