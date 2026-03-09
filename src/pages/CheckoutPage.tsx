import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/services/api';
import { useLocalOrders } from '@/hooks/useLocalOrders';
import {
  ArrowLeft,
  ShieldCheck,
  Loader2,
  ShoppingCart,
  QrCode,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CheckoutPage() {
  const { items, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addOrder } = useLocalOrders();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(user?.email || '');

  const shippingCost = parseFloat(sessionStorage.getItem('dsg-shipping-cost') || '0');
  const savedCoupon = (() => {
    try {
      const c = sessionStorage.getItem('dsg-coupon');
      return c ? JSON.parse(c) : null;
    } catch {
      return null;
    }
  })();
  const discount = savedCoupon?.discount || 0;
  const total = Math.max(0, totalPrice + shippingCost - discount);

  const saveOrderLocally = () => {
    addOrder({
      items: items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        productImage: i.product.images[0] || '',
        quantity: i.quantity,
        unitPrice: i.product.price,
      })),
      total,
      shippingCost,
      paymentMethod: 'pix',
      createdAt: new Date().toISOString(),
    });
  };

  const extractOrderId = (payload: any): string | null => {
    return (
      payload?.data?._id ||
      payload?.data?.id ||
      payload?.data?.order?._id ||
      payload?.data?.order?.id ||
      payload?.order?._id ||
      payload?.order?.id ||
      payload?._id ||
      payload?.id ||
      null
    );
  };

  const createOrder = async (): Promise<string | null> => {
    const endpoints = [
      '/api/checkout/create-order',
      '/api/checkout/createOrder',
      '/api/orders',
      '/api/orders/create-order',
      '/api/orders/create',
    ];

    for (const endpoint of endpoints) {
      try {
        const orderRes = await api.post<any>(endpoint, {
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        });

        const orderId = extractOrderId(orderRes);
        console.log(`[Checkout] Endpoint ${endpoint} → orderId: ${orderId}`);
        if (orderId) return orderId;
      } catch (err: any) {
        console.warn(`[Checkout] Falha ${endpoint}:`, err?.message);
        if (String(err?.message || '').includes('Sessão expirada')) throw err;
      }
    }

    return null;
  };

  const handlePayPix = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const orderId = await createOrder();

      if (!orderId) {
        throw new Error(
          'Não foi possível criar o pedido. O backend pode estar iniciando — aguarde alguns segundos e tente novamente.'
        );
      }

      const res = await api.post<any>('/api/payments/create', { orderId });

      const pixData = res?.data || res;
      if (pixData.qr_code_base64 || pixData.qr_code) {
        saveOrderLocally();
        navigate('/pix-payment', {
          state: {
            qr_code_base64: pixData.qr_code_base64,
            qr_code: pixData.qr_code,
            total,
          },
        });
      } else {
        throw new Error('O servidor não retornou dados do PIX (qr_code). Verifique o backend.');
      }
    } catch (err: any) {
      console.error('[Checkout] Erro PIX:', err);
      setError(err.message || 'Erro desconhecido');
      toast({ title: 'Erro no PIX', description: err.message, variant: 'destructive' });
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
      <Button variant="ghost" size="sm" onClick={() => navigate('/order-confirmation')} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar à confirmação
      </Button>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Carrinho</span>
        <ChevronRight className="w-3 h-3" />
        <span>Confirmação</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-primary font-semibold">Pagamento PIX</span>
      </div>

      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Pagamento via PIX</h1>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email + PIX info */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-3">
          <QrCode className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold text-foreground">Pagar com PIX</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail para recibo</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Ao clicar em "Gerar PIX", um QR code será exibido para você pagar pelo app do seu banco.
        </p>
      </div>

      {/* Totals + Pay */}
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
        {savedCoupon && (
          <div className="flex justify-between text-sm text-green-500">
            <span>Cupom ({savedCoupon.code})</span>
            <span>-R$ {savedCoupon.discount.toFixed(2).replace('.', ',')}</span>
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
          onClick={handlePayPix}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processando...
            </>
          ) : (
            'Gerar PIX'
          )}
        </Button>
      </div>
    </div>
  );
}
