import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/services/api';
import { useLocalOrders } from '@/hooks/useLocalOrders';
import {
  ArrowLeft,
  ShieldCheck,
  Loader2,
  ShoppingCart,
  CreditCard,
  QrCode,
  Copy,
  Check,
} from 'lucide-react';

const MP_PUBLIC_KEY = 'APP_USR-dd9fe952-6a20-45a2-b191-ae638329008a';

type PaymentMethod = 'card' | 'pix';

interface PixData {
  qr_code_base64?: string;
  qr_code?: string;
  ticket_url?: string;
}

export default function CheckoutPage() {
  const { items, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addOrder } = useLocalOrders();

  const [loading, setLoading] = useState(false);
  const [mpReady, setMpReady] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [installments, setInstallments] = useState('1');
  const [email, setEmail] = useState(user?.email || '');

  const shippingCost = parseFloat(sessionStorage.getItem('dsg-shipping-cost') || '0');
  const total = totalPrice + shippingCost;

  const saveOrderLocally = (paymentMethod: 'pix' | 'card') => {
    addOrder({
      items: items.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        productImage: i.product.images[0] || '',
        quantity: i.quantity,
        unitPrice: i.product.price,
      })),
      total,
      shippingCost,
      paymentMethod,
      createdAt: new Date().toISOString(),
    });
  };

  // Load Mercado Pago SDK
  useEffect(() => {
    let cancelled = false;
    const loadMP = async () => {
      try {
        const { loadMercadoPago } = await import('@mercadopago/sdk-js');
        await loadMercadoPago();
        if (!cancelled) {
          (window as any).mpInstance = new (window as any).MercadoPago(MP_PUBLIC_KEY);
          setMpReady(true);
        }
      } catch (err) {
        console.error('Erro ao carregar SDK MercadoPago:', err);
      }
    };
    loadMP();
    return () => { cancelled = true; };
  }, []);

  const handlePayPix = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post<any>('/api/payments/create', {
        amount: total,
        payment_method_id: 'pix',
        email: email || user?.email || '',
        items: items.map(i => ({
          title: i.product.name,
          quantity: i.quantity,
          unit_price: Number(i.product.price),
        })),
      });

      if (res.qr_code_base64 || res.qr_code) {
        setPixData({
          qr_code_base64: res.qr_code_base64 || res.point_of_interaction?.transaction_data?.qr_code_base64,
          qr_code: res.qr_code || res.point_of_interaction?.transaction_data?.qr_code,
          ticket_url: res.ticket_url,
        });
        saveOrderLocally('pix');
        toast({ title: 'PIX gerado!', description: 'Escaneie o QR code ou copie o código para pagar.' });
      } else if (res.init_point || res.sandbox_init_point) {
        // Fallback to redirect
        clearCart();
        window.location.href = res.init_point || res.sandbox_init_point;
      } else {
        toast({ title: 'Erro', description: 'Não foi possível gerar o PIX.', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('Erro PIX:', err);
      toast({ title: 'Erro no PIX', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePayCard = async () => {
    if (items.length === 0 || !mpReady) return;
    setLoading(true);
    try {
      const mp = (window as any).mpInstance;
      const cardToken = await mp.createCardToken({
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName: cardHolder,
        cardExpirationMonth: expMonth,
        cardExpirationYear: expYear,
        securityCode: cvv,
      });

      const res = await api.post<any>('/api/payments/create', {
        amount: total,
        token: cardToken.id,
        payment_method_id: 'visa',
        installments: parseInt(installments),
        email: email || user?.email || '',
        items: items.map(i => ({
          title: i.product.name,
          quantity: i.quantity,
          unit_price: Number(i.product.price),
        })),
      });

      if (res.status === 'approved') {
        saveOrderLocally('card');
        clearCart();
        sessionStorage.removeItem('dsg-shipping-cost');
        toast({ title: 'Pagamento aprovado! ✅', description: 'Seu pedido foi confirmado.' });
        navigate('/my-orders');
      } else if (res.status === 'in_process' || res.status === 'pending') {
        saveOrderLocally('card');
        toast({ title: 'Pagamento em análise', description: 'Seu pagamento está sendo processado.' });
        navigate('/my-orders');
      } else {
        toast({ title: 'Pagamento recusado', description: res.status_detail || 'Tente outro cartão.', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('Erro cartão:', err);
      toast({ title: 'Erro no pagamento', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (pixData?.qr_code) {
      await navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Código copiado!' });
    }
  };

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  if (items.length === 0 && !pixData) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in text-center py-20 space-y-4">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/30" />
        <h1 className="text-2xl font-display font-bold text-foreground">Carrinho vazio</h1>
        <p className="text-muted-foreground">Adicione produtos para continuar.</p>
        <Button variant="outline" onClick={() => navigate('/products')}>Ver produtos</Button>
      </div>
    );
  }

  // PIX success screen
  if (pixData) {
    return (
      <div className="max-w-md mx-auto animate-fade-in space-y-6 py-6">
        <div className="flex items-center gap-3">
          <QrCode className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">Pague com PIX</h1>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border space-y-4 text-center">
          {pixData.qr_code_base64 && (
            <img
              src={`data:image/png;base64,${pixData.qr_code_base64}`}
              alt="QR Code PIX"
              className="w-56 h-56 mx-auto rounded-lg"
            />
          )}

          {pixData.qr_code && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Ou copie o código:</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={pixData.qr_code}
                  className="text-xs font-mono"
                />
                <Button variant="outline" size="icon" onClick={copyPixCode}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Abra o app do seu banco e escaneie o QR code ou cole o código PIX.
          </p>

          <div className="pt-2 border-t border-border">
            <p className="text-lg font-bold text-primary">
              R$ {total.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={() => { clearCart(); sessionStorage.removeItem('dsg-shipping-cost'); navigate('/my-orders'); }}>
          Já paguei — ver meus pedidos
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
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'; }}
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

      {/* Payment method selector */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <h2 className="font-display font-semibold text-foreground">Forma de pagamento</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMethod('pix')}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
              method === 'pix'
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            <QrCode className="w-5 h-5" /> PIX
          </button>
          <button
            onClick={() => setMethod('card')}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
              method === 'card'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            <CreditCard className="w-5 h-5" /> Cartão
          </button>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
        </div>

        {/* Card form */}
        {method === 'card' && (
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label>Número do cartão</Label>
              <Input
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome no cartão</Label>
              <Input
                placeholder="NOME COMPLETO"
                value={cardHolder}
                onChange={e => setCardHolder(e.target.value.toUpperCase())}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Mês</Label>
                <Select value={expMonth} onValueChange={setExpMonth}>
                  <SelectTrigger><SelectValue placeholder="MM" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const m = String(i + 1).padStart(2, '0');
                      return <SelectItem key={m} value={m}>{m}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Select value={expYear} onValueChange={setExpYear}>
                  <SelectTrigger><SelectValue placeholder="AA" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const y = String(new Date().getFullYear() + i).slice(-2);
                      return <SelectItem key={y} value={y}>{y}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <Input
                  placeholder="123"
                  value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Parcelas</Label>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                    <SelectItem key={n} value={String(n)}>
                      {n}x de R$ {(total / n).toFixed(2).replace('.', ',')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!mpReady && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Carregando SDK de pagamento...
              </p>
            )}
          </div>
        )}

        {method === 'pix' && (
          <p className="text-sm text-muted-foreground">
            Ao clicar em "Gerar PIX", um QR code será exibido para você pagar pelo app do seu banco.
          </p>
        )}
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
        <div className="border-t border-border pt-3 flex justify-between items-baseline">
          <span className="font-display font-bold text-foreground text-lg">Total</span>
          <span className="text-2xl font-bold text-primary">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <Button
          className="w-full"
          size="lg"
          onClick={method === 'pix' ? handlePayPix : handlePayCard}
          disabled={loading || (method === 'card' && !mpReady)}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processando...</>
          ) : method === 'pix' ? (
            'Gerar PIX'
          ) : (
            'Pagar com Cartão'
          )}
        </Button>
      </div>
    </div>
  );
}
