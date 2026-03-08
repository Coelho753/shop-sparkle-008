import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/services/api';
import {
  ArrowLeft,
  MapPin,
  Tag,
  X,
  Loader2,
  ShoppingCart,
  ChevronRight,
  Truck,
} from 'lucide-react';

export default function OrderConfirmationPage() {
  const { items, totalPrice, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: string;
    value: number;
    discount: number;
  } | null>(null);

  // Address pre-filled from user profile
  const userAddr = user?.address;
  const [address, setAddress] = useState({
    street: userAddr?.street || '',
    number: userAddr?.number || '',
    neighborhood: userAddr?.neighborhood || '',
    city: userAddr?.city || '',
    state: userAddr?.state || '',
    zipCode: userAddr?.zipCode || '',
    complement: userAddr?.complement || '',
  });

  const shippingCost = parseFloat(sessionStorage.getItem('dsg-shipping-cost') || '0');
  const discount = appliedCoupon?.discount || 0;
  const total = Math.max(0, totalPrice + shippingCost - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post<any>('/api/coupons/validate', {
        code: couponCode.trim().toUpperCase(),
        orderTotal: totalPrice,
      });
      const discountValue =
        res.type === 'percentage'
          ? Math.min((totalPrice * res.value) / 100, res.maxDiscount || Infinity)
          : Math.min(res.value, totalPrice);
      setAppliedCoupon({
        code: res.code || couponCode.trim().toUpperCase(),
        type: res.type,
        value: res.value,
        discount: discountValue,
      });
      toast({
        title: 'Cupom aplicado! 🎉',
        description: `Desconto de R$ ${discountValue.toFixed(2).replace('.', ',')}`,
      });
    } catch (err: any) {
      toast({
        title: 'Cupom inválido',
        description: err.message || 'Verifique o código e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleProceed = () => {
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      toast({
        title: 'Endereço incompleto',
        description: 'Preencha os campos obrigatórios do endereço.',
        variant: 'destructive',
      });
      return;
    }
    // Save coupon and address for checkout
    if (appliedCoupon) {
      sessionStorage.setItem('dsg-coupon', JSON.stringify(appliedCoupon));
    } else {
      sessionStorage.removeItem('dsg-coupon');
    }
    sessionStorage.setItem('dsg-address', JSON.stringify(address));
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in text-center py-20 space-y-4">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/30" />
        <h1 className="text-2xl font-display font-bold text-foreground">Carrinho vazio</h1>
        <p className="text-muted-foreground">Adicione produtos para continuar.</p>
        <Button variant="outline" onClick={() => navigate('/products')}>
          Ver produtos
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/cart')} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar ao carrinho
      </Button>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-foreground font-medium">Carrinho</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-primary font-semibold">Confirmação</span>
        <ChevronRight className="w-3 h-3" />
        <span>Pagamento</span>
      </div>

      {/* Items summary */}
      <div className="p-5 rounded-xl bg-card border border-border space-y-3">
        <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          Itens ({totalItems})
        </h2>
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-12 h-12 rounded-lg object-cover bg-secondary flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {quantity}x R$ {product.price.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <span className="text-sm font-semibold text-foreground">
              R$ {(product.price * quantity).toFixed(2).replace('.', ',')}
            </span>
          </div>
        ))}
      </div>

      {/* Delivery address */}
      <div className="p-5 rounded-xl bg-card border border-border space-y-4">
        <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Endereço de entrega
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="street">Rua *</Label>
            <Input
              id="street"
              value={address.street}
              onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
              placeholder="Rua / Avenida"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="number">Número *</Label>
            <Input
              id="number"
              value={address.number}
              onChange={(e) => setAddress((a) => ({ ...a, number: e.target.value }))}
              placeholder="123"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={address.complement}
              onChange={(e) => setAddress((a) => ({ ...a, complement: e.target.value }))}
              placeholder="Apto, bloco..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="neighborhood">Bairro *</Label>
            <Input
              id="neighborhood"
              value={address.neighborhood}
              onChange={(e) => setAddress((a) => ({ ...a, neighborhood: e.target.value }))}
              placeholder="Bairro"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              value={address.city}
              onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
              placeholder="Cidade"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">Estado *</Label>
            <Input
              id="state"
              value={address.state}
              onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
              placeholder="UF"
              maxLength={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zipCode">CEP *</Label>
            <Input
              id="zipCode"
              value={address.zipCode}
              onChange={(e) => setAddress((a) => ({ ...a, zipCode: e.target.value }))}
              placeholder="00000-000"
            />
          </div>
        </div>
      </div>

      {/* Coupon */}
      <div className="p-5 rounded-xl bg-card border border-border space-y-3">
        <h2 className="font-display font-semibold text-foreground flex items-center gap-2 text-sm">
          <Tag className="w-4 h-4 text-primary" />
          Cupom de desconto
        </h2>
        {appliedCoupon ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div>
              <span className="font-mono font-semibold text-sm text-foreground">
                {appliedCoupon.code}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                -R$ {appliedCoupon.discount.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={removeCoupon}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="CÓDIGO"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              className="font-mono uppercase"
            />
            <Button
              variant="outline"
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
            >
              {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
            </Button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-3">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal ({totalItems} itens)</span>
          <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
        </div>
        {shippingCost > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Frete
            </span>
            <span>R$ {shippingCost.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
        {appliedCoupon && (
          <div className="flex justify-between text-sm text-green-500">
            <span>Cupom ({appliedCoupon.code})</span>
            <span>-R$ {appliedCoupon.discount.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
        <div className="border-t border-border pt-3 flex justify-between items-baseline">
          <span className="font-display font-bold text-foreground text-lg">Total</span>
          <span className="text-2xl font-bold text-primary">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <Button className="w-full" size="lg" onClick={handleProceed}>
          Ir para pagamento <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
