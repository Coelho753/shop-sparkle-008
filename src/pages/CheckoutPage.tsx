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
  ChevronRight,
} from 'lucide-react';

const MP_PUBLIC_KEY = 'APP_USR-dd9fe952-6a20-45a2-b191-ae638329008a';

type PaymentMethod = 'card' | 'pix';

export default function CheckoutPage() {
  const { items, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addOrder } = useLocalOrders();

  const [loading, setLoading] = useState(false);
  const [mpReady, setMpReady] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('pix');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [installments, setInstallments] = useState('1');
  const [email, setEmail] = useState(user?.email || '');

  // Read saved data from confirmation page
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

  const saveOrderLocally = (paymentMethod: 'pix' | 'card') => {
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
    return () => {
      cancelled = true;
    };
  }, []);

  const getSavedAddress = () => {
    try {
      const a = sessionStorage.getItem('dsg-address');
      return a ? JSON.parse(a) : null;
    } catch {
      return null;
    }
  };

  // Step 1 (preferencial): criar pedido no backend; fallback para pagamento direto se rota não existir
  const createOrder = async (): Promise<string | null> => {
    const savedAddress = getSavedAddress();

    try {
      const orderRes = await api.post<any>('/api/checkout/create-order', {
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        shippingAddress: savedAddress || undefined,
        couponCode: savedCoupon?.code || undefined,
      });

      const orderId = orderRes?.data?._id || orderRes?._id || orderRes?.id;
      return orderId || null;
    } catch (err: any) {
      if (String(err?.message || '').includes('Sessão expirada')) {
        throw err;
      }
      console.warn('create-order indisponível, usando fallback de pagamento direto:', err?.message || err);
      return null;
    }
  };

  const handlePayPix = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const orderId = await createOrder();
      const savedAddress = getSavedAddress();

      const res = await api.post<any>('/api/payments/create',
        orderId
          ? {
              orderId,
              payment_method_id: 'pix',
              email: email || user?.email || '',
              payer: {
                email: email || user?.email || '',
                identification: {
                  type: 'CPF',
                  number: user?.cpf?.replace(/\D/g, '') || '',
                },
              },
            }
          : {
              amount: total,
              payment_method_id: 'pix',
              description: 'Pedido DSG',
              email: email || user?.email || '',
              shippingAddress: savedAddress || undefined,
              couponCode: savedCoupon?.code || undefined,
              payer: {
                email: email || user?.email || '',
                identification: {
                  type: 'CPF',
                  number: user?.cpf?.replace(/\D/g, '') || '',
                },
              },
              items: items.map((i) => ({
                title: i.product.name,
                quantity: i.quantity,
                unit_price: i.product.price,
                currency_id: 'BRL',
              })),
            }
      );

      if (res.qr_code_base64 || res.qr_code || res.point_of_interaction) {
        saveOrderLocally('pix');
        navigate('/pix-payment', {
          state: {
            qr_code_base64:
              res.qr_code_base64 || res.point_of_interaction?.transaction_data?.qr_code_base64,
            qr_code: res.qr_code || res.point_of_interaction?.transaction_data?.qr_code,
            total,
          },
        });
      } else if (res.init_point || res.sandbox_init_point) {
        saveOrderLocally('pix');
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
      const orderId = await createOrder();
      const savedAddress = getSavedAddress();

      const mp = (window as any).mpInstance;
      const cardToken = await mp.createCardToken({
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName: cardHolder,
        cardExpirationMonth: expMonth,
        cardExpirationYear: expYear,
        securityCode: cvv,
      });

      const res = await api.post<any>('/api/payments/create',
        orderId
          ? {
              orderId,
              token: cardToken.id,
              payment_method_id: 'visa',
              installments: parseInt(installments),
              email: email || user?.email || '',
              payer: {
                email: email || user?.email || '',
                identification: {
                  type: 'CPF',
                  number: user?.cpf?.replace(/\D/g, '') || '',
                },
              },
            }
          : {
              amount: total,
              token: cardToken.id,
              payment_method_id: 'visa',
              installments: parseInt(installments),
              description: 'Pedido DSG',
              email: email || user?.email || '',
              shippingAddress: savedAddress || undefined,
              couponCode: savedCoupon?.code || undefined,
              payer: {
                email: email || user?.email || '',
                identification: {
                  type: 'CPF',
                  number: user?.cpf?.replace(/\D/g, '') || '',
                },
              },
              items: items.map((i) => ({
                title: i.product.name,
                quantity: i.quantity,
                unit_price: i.product.price,
                currency_id: 'BRL',
              })),
            }
      );

      if (res.status === 'approved') {
        saveOrderLocally('card');
        clearCart();
        sessionStorage.removeItem('dsg-shipping-cost');
        sessionStorage.removeItem('dsg-coupon');
        sessionStorage.removeItem('dsg-address');
        toast({ title: 'Pagamento aprovado! ✅', description: 'Seu pedido foi confirmado.' });
        navigate('/my-orders');
      } else if (res.status === 'in_process' || res.status === 'pending') {
        saveOrderLocally('card');
        toast({ title: 'Pagamento em análise', description: 'Seu pagamento está sendo processado.' });
        navigate('/my-orders');
      } else {
        toast({
          title: 'Pagamento recusado',
          description: res.status_detail || 'Tente outro cartão.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Erro cartão:', err);
      toast({ title: 'Erro no pagamento', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
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
        <span className="text-primary font-semibold">Pagamento</span>
      </div>

      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Pagamento</h1>
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
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            <CreditCard className="w-5 h-5" /> Cartão
          </button>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
          />
        </div>

        {/* Card form */}
        {method === 'card' && (
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label>Número do cartão</Label>
              <Input
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome no cartão</Label>
              <Input
                placeholder="NOME COMPLETO"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Mês</Label>
                <Select value={expMonth} onValueChange={setExpMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const m = String(i + 1).padStart(2, '0');
                      return (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Select value={expYear} onValueChange={setExpYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="AA" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const y = String(new Date().getFullYear() + i).slice(-2);
                      return (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <Input
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Parcelas</Label>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
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
          onClick={method === 'pix' ? handlePayPix : handlePayCard}
          disabled={loading || (method === 'card' && !mpReady)}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processando...
            </>
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
