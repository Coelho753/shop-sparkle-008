import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Truck, Loader2, MapPin } from 'lucide-react';

interface ShippingOption {
  name: string;
  price: number;
  deadline: string;
  company?: string;
  picture?: string;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();
  
  const { toast } = useToast();

  const [cep, setCep] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[] | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<number | null>(null);
  const [addressLabel, setAddressLabel] = useState('');

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  };

  const handleCalcShipping = async () => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      toast({ title: 'CEP inválido', description: 'Digite um CEP com 8 dígitos.', variant: 'destructive' });
      return;
    }

    setLoadingCep(true);
    setShippingOptions(null);
    setSelectedShipping(null);
    setAddressLabel('');

    try {
      // First get address label from ViaCEP
      try {
        const viaCepRes = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const viaCepData = await viaCepRes.json();
        if (!viaCepData.erro) {
          setAddressLabel(`${viaCepData.localidade} - ${viaCepData.uf}`);
        }
      } catch {
        // ViaCEP is optional, continue with shipping calc
      }

      // Call Melhor Envio API via backend
      const products = items.map(({ product, quantity }) => ({
        id: product.id,
        quantity,
        weight: 0.3, // default weight in kg
        width: 15,    // default dimensions in cm
        height: 10,
        length: 20,
      }));

      let mapped: ShippingOption[] = [];

      try {
        const res = await api.post<any>('/api/frete/calcular', { cep: digits, products });

        // Normalize response - handle various Melhor Envio response formats
        const rawOptions = Array.isArray(res) ? res : res.data || res.options || res.shipping || [];

        mapped = rawOptions
          .filter((opt: any) => !opt.error && opt.price !== undefined)
          .map((opt: any) => ({
            name: opt.name || opt.company?.name || opt.service || 'Envio',
            price: typeof opt.price === 'string' ? parseFloat(opt.price) : opt.price,
            deadline: opt.deadline ? `${opt.deadline} dias úteis` : opt.delivery_time ? `${opt.delivery_time} dias úteis` : opt.prazo || 'Consultar',
            company: opt.company?.name || '',
            picture: opt.company?.picture || '',
          }));
      } catch (apiErr) {
        console.warn('Melhor Envio API falhou, usando frete estimado:', apiErr);
      }

      // Fallback: se a API falhar ou não retornar opções, usar estimativa
      if (mapped.length === 0) {
        // Detect region from ViaCEP address
        const uf = addressLabel.split(' - ')[1] || '';
        const isSudeste = ['SP', 'RJ', 'MG', 'ES'].includes(uf);
        const base = isSudeste ? 14.9 : 24.9;

        mapped = [
          { name: 'Econômico', price: base, deadline: isSudeste ? '8-12 dias úteis' : '12-18 dias úteis' },
          { name: 'Padrão', price: base + 8, deadline: isSudeste ? '5-7 dias úteis' : '7-10 dias úteis' },
          { name: 'Expresso', price: base + 18, deadline: isSudeste ? '2-3 dias úteis' : '4-6 dias úteis' },
        ];
      }

      setShippingOptions(mapped);
      setSelectedShipping(0);
    } catch (err: any) {
      console.error('Erro ao calcular frete:', err);
      toast({ title: 'Erro ao calcular frete', description: err.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setLoadingCep(false);
    }
  };

  const shippingCost = selectedShipping !== null && shippingOptions ? shippingOptions[selectedShipping].price : 0;

  const handleCheckout = () => {
    if (items.length === 0) return;
    // Save shipping cost to pass to checkout page
    sessionStorage.setItem('dsg-shipping-cost', String(shippingCost));
    navigate('/checkout');
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
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
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

      {/* Items */}
      <div className="space-y-3">
        {items.map(({ product, quantity }) => {
          const isUnavailable = !product.active || product.stock <= 0;
          return (
          <div
            key={product.id}
            className={`flex gap-4 p-4 rounded-xl bg-card border ${isUnavailable ? 'border-destructive/50 opacity-60' : 'border-border'}`}
          >
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

            {/* Quantity controls */}
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
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm font-medium w-6 text-center text-foreground">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Shipping Calculator */}
      <div className="p-5 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Truck className="w-5 h-5 text-primary" />
          Calcular frete
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="00000-000"
            value={cep}
            onChange={e => setCep(formatCep(e.target.value))}
            onKeyDown={e => e.key === 'Enter' && handleCalcShipping()}
            className="max-w-[160px]"
          />
          <Button variant="outline" onClick={handleCalcShipping} disabled={loadingCep}>
            {loadingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Calcular'}
          </Button>
        </div>

        {addressLabel && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            {addressLabel}
          </div>
        )}

        {shippingOptions && (
          <div className="space-y-2">
            {shippingOptions.map((opt, idx) => (
              <label
                key={opt.name}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedShipping === idx
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
                onClick={() => setSelectedShipping(idx)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedShipping === idx ? 'border-primary' : 'border-muted-foreground/40'
                  }`}>
                    {selectedShipping === idx && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{opt.name}</p>
                    <p className="text-xs text-muted-foreground">{opt.deadline}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  R$ {opt.price.toFixed(2).replace('.', ',')}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal ({totalItems} itens)</span>
          <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
        </div>
        {shippingOptions && selectedShipping !== null && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Frete ({shippingOptions[selectedShipping].name})</span>
            <span>R$ {shippingCost.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
        <div className="border-t border-border pt-4 flex justify-between items-baseline">
          <span className="font-display font-bold text-foreground text-lg">Total</span>
          <span className="text-2xl font-bold text-primary">
            R$ {(totalPrice + shippingCost).toFixed(2).replace('.', ',')}
          </span>
        </div>
        <Button className="w-full" size="lg" onClick={handleCheckout}>
          Ir para pagamento
        </Button>
      </div>
    </div>
  );
}
