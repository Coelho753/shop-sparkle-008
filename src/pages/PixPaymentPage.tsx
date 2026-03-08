import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, QrCode, Copy, Check, ChevronRight, Clock } from 'lucide-react';

export default function PixPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const pixData = location.state as {
    qr_code_base64?: string;
    qr_code?: string;
    total: number;
  } | null;

  if (!pixData) {
    return (
      <div className="max-w-md mx-auto animate-fade-in text-center py-20 space-y-4">
        <QrCode className="w-16 h-16 mx-auto text-muted-foreground/30" />
        <h1 className="text-2xl font-display font-bold text-foreground">Nenhum PIX gerado</h1>
        <p className="text-muted-foreground">Volte ao checkout e gere o pagamento.</p>
        <Button variant="outline" onClick={() => navigate('/checkout')}>
          Voltar ao checkout
        </Button>
      </div>
    );
  }

  const copyPixCode = async () => {
    if (pixData.qr_code) {
      await navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Código copiado!' });
    }
  };

  const handleDone = () => {
    clearCart();
    sessionStorage.removeItem('dsg-shipping-cost');
    sessionStorage.removeItem('dsg-coupon');
    sessionStorage.removeItem('dsg-address');
    navigate('/my-orders');
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in space-y-6 py-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/checkout')} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Carrinho</span>
        <ChevronRight className="w-3 h-3" />
        <span>Confirmação</span>
        <ChevronRight className="w-3 h-3" />
        <span>Pagamento</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-primary font-semibold">PIX</span>
      </div>

      <div className="flex items-center gap-3">
        <QrCode className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Pague com PIX</h1>
      </div>

      <div className="p-6 rounded-xl bg-card border border-border space-y-5 text-center">
        {pixData.qr_code_base64 && (
          <div className="bg-white rounded-xl p-4 inline-block mx-auto">
            <img
              src={`data:image/png;base64,${pixData.qr_code_base64}`}
              alt="QR Code PIX"
              className="w-56 h-56 mx-auto"
            />
          </div>
        )}

        {pixData.qr_code && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Ou copie o código PIX:</p>
            <div className="flex gap-2">
              <Input readOnly value={pixData.qr_code} className="text-xs font-mono" />
              <Button variant="outline" size="icon" onClick={copyPixCode}>
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          Abra o app do seu banco e escaneie o QR code ou cole o código PIX.
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Valor a pagar</p>
          <p className="text-2xl font-bold text-primary">
            R$ {pixData.total.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      <Button className="w-full" size="lg" onClick={handleDone}>
        Já paguei — ver meus pedidos
      </Button>
    </div>
  );
}
