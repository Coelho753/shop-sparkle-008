import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import {
  ArrowLeft,
  ShieldCheck,
  Loader2,
  ShoppingCart,
  CreditCard,
} from 'lucide-react';

interface MercadoPagoResponse {
  init_point?: string;
  sandbox_init_point?: string;
  [key: string]: any;
}

export default function CheckoutPage() {
  const { items, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const shippingCost = parseFloat(sessionStorage.getItem('dsg-shipping-cost') || '0');
  const total = totalPrice + shippingCost;

  const handleFinish = async () => {
    if (items.length === 0) return;

    setLoading(true);

    try {
      const body = {
        items: items.map(i => ({
          title: i.product.name,
          quantity: i.quantity,
          unit_price: Number(i.product.price),
        })),
      };

      const res = await api.post<MercadoPagoResponse>('/api/payments/create', body);

      const redirectUrl = res.init_point || res.sandbox_init_point;

      if (redirectUrl) {
        clearCart();
        sessionStorage.removeItem('dsg-shipping-cost');
        window.location.href = redirectUrl;
      } else {
        toast({ title: 'Erro', description: 'Não foi possível iniciar o pagamento. Tente novamente.', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('Erro ao criar pagamento:', err);
      toast({ title: 'Erro no pagamento', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
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

      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Finalizar Compra</h1>
      </div>

      {/* Items summary */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-3">
        <h2 className="font-display font-semibold text-foreground mb-3">Resumo do pedido</h2>
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-12 h-12 rounded-lg object-cover bg-secondary flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">{quantity}x R$ {product.price.toFixed(2).replace('.', ',')}</p>
            </div>
            <span className="text-sm font-semibold text-foreground">
              R$ {(product.price * quantity).toFixed(2).replace('.', ',')}
            </span>
          </div>
        ))}
      </div>

      {/* Payment info */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <CreditCard className="w-5 h-5 text-primary" />
          <span className="font-semibold">Pagamento via Mercado Pago</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Ao clicar em "Pagar", você será redirecionado ao Mercado Pago para escolher a forma de pagamento (cartão, PIX, boleto, etc).
        </p>
      </div>

      {/* Totals */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-3">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
        </div>
        {shippingCost > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Frete</span>
            <span>R$ {shippingCost.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
        <div className="border-t border-border pt-3 flex justify-between items-baseline">
          <span className="font-display font-bold text-foreground text-lg">Total</span>
          <span className="text-2xl font-bold text-primary">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <Button
          className="w-full"
          size="lg"
          onClick={handleFinish}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processando...</>
          ) : (
            'Pagar com Mercado Pago'
          )}
        </Button>
      </div>
    </div>
  );
}
