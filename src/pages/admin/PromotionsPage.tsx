import { useState } from 'react';
import { Tag, Loader2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';

interface Promotion {
  _id: string;
  productId?: string | { _id: string; nome?: string; name?: string };
  product?: string | { _id: string; nome?: string; name?: string };
  discountType?: string;
  type?: string;
  discountValue?: number;
  value?: number;
  startDate?: string;
  endDate?: string;
  active: boolean;
  title?: string;
}

// Normalize API fields
function getPromoDiscount(p: Promotion) {
  return {
    type: p.discountType || p.type || 'percentage',
    value: p.discountValue ?? p.value ?? 0,
    productRef: p.productId || p.product,
  };
}

function usePromotions() {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const data = await api.get<Promotion[] | { promotions: Promotion[] }>('/api/promotions');
      return Array.isArray(data) ? data : data.promotions ?? [];
    },
  });
}

export default function PromotionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data } = useProducts();
  const products = data?.products ?? [];
  const { data: promotions = [], isLoading: loadingPromos } = usePromotions();

  const [productId, setProductId] = useState('');
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);
  const previewPrice = selectedProduct
    ? discountType === 'percentage'
      ? selectedProduct.price * (1 - Number(discountValue || 0) / 100)
      : selectedProduct.price - Number(discountValue || 0)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !discountValue) {
      toast({ title: '⚠️ Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/promotions', {
        product: productId,
        title: title.trim() || `Promoção ${selectedProduct?.name || ''}`,
        type: discountType,
        value: Number(discountValue),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        active,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast({ title: '✅ Promoção criada!' });
      setProductId(''); setTitle(''); setDiscountValue(''); setStartDate(''); setEndDate('');
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromo = async (id: string) => {
    try {
      await api.delete(`/api/promotions/${id}`);
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: '🗑️ Promoção removida!' });
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    }
  };

  const getProductInfo = (p: Promotion) => {
    const { productRef } = getPromoDiscount(p);
    let name = 'Produto desconhecido';
    let image = '';
    let price = 0;
    let id = '';

    if (typeof productRef === 'object' && productRef) {
      name = (productRef as any).nome || (productRef as any).name || name;
      id = (productRef as any)._id || '';
    } else {
      id = String(productRef || '');
    }
    // Always try to find from local products list for full info
    const found = products.find(prod => prod.id === id);
    if (found) {
      name = found.name;
      image = found.images?.[0] || '';
      price = found.price;
    }
    return { name, image, price, id };
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Tag className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Promoções</h1>
      </div>

      {/* Lista de promoções existentes */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <h2 className="font-display font-semibold text-foreground">Promoções Ativas</h2>
        {loadingPromos ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : (() => {
          const now = new Date();
          const activePromotions = promotions.filter((promo) => {
            // Remove promoções expiradas (endDate no passado)
            if (promo.endDate && new Date(promo.endDate) < now) return false;
            return true;
          });
          const expiredPromotions = promotions.filter((promo) => {
            return promo.endDate && new Date(promo.endDate) < now;
          });

          return activePromotions.length === 0 && expiredPromotions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma promoção cadastrada.</p>
          ) : (
            <div className="space-y-4">
              {activePromotions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma promoção ativa no momento.</p>
              ) : (
                <div className="space-y-3">
                  {activePromotions.map((promo) => {
                    const info = getProductInfo(promo);
                    return (
                      <div key={promo._id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
                        {info.image ? (
                          <img src={info.image} alt={info.name} className="w-12 h-12 rounded-md object-cover border border-border flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                            <Tag className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {info.name}
                            {(() => {
                              const d = getPromoDiscount(promo);
                              return info.price > 0 && d.value > 0 ? (
                                <span className="ml-2 text-xs font-medium text-primary">
                                  → R$ {Math.max(0, d.type === 'percentage' ? info.price * (1 - d.value / 100) : info.price - d.value).toFixed(2).replace('.', ',')}
                                </span>
                              ) : null;
                            })()}
                          </p>
                          {info.id && <p className="text-[10px] text-muted-foreground font-mono truncate">ID: {info.id}</p>}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={promo.active ? 'default' : 'secondary'}>
                              {promo.active ? 'Ativa' : 'Inativa'}
                            </Badge>
                            {(() => {
                              const d = getPromoDiscount(promo);
                              return (
                                <span className="text-xs text-muted-foreground">
                                  {d.type === 'percentage' ? `${d.value}%` : `R$ ${d.value.toFixed(2).replace('.', ',')}`} de desconto
                                </span>
                              );
                            })()}
                            {info.price > 0 && (
                              <span className="text-xs text-primary font-medium">
                                Preço original: R$ {info.price.toFixed(2).replace('.', ',')}
                              </span>
                            )}
                          </div>
                          {(promo.startDate || promo.endDate) && (
                            <p className="text-xs text-muted-foreground">
                              {promo.startDate && `De ${new Date(promo.startDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`}
                              {promo.endDate && ` até ${new Date(promo.endDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => handleDeletePromo(promo._id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {expiredPromotions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Promoções Expiradas ({expiredPromotions.length})</h3>
                  <div className="space-y-2 opacity-60">
                    {expiredPromotions.map((promo) => {
                      const info = getProductInfo(promo);
                      const d = getPromoDiscount(promo);
                      return (
                        <div key={promo._id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 border border-border">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground truncate">
                              {info.name} — {d.type === 'percentage' ? `${d.value}%` : `R$ ${d.value.toFixed(2).replace('.', ',')}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Expirou em {new Date(promo.endDate!).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">Expirada</Badge>
                          <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8" onClick={() => handleDeletePromo(promo._id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Formulário de criação */}
      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-card border border-border space-y-5">
        <h2 className="font-display font-semibold text-foreground">Criar Nova Promoção</h2>

        {/* Promoções existentes do produto selecionado */}
        {productId && (() => {
          const existingPromos = promotions.filter(p => {
            const d = getPromoDiscount(p);
            const pid = typeof d.productRef === 'object' && d.productRef ? (d.productRef as any)._id : d.productRef;
            return pid === productId;
          });
          if (existingPromos.length === 0) return null;
          return (
            <div className="p-3 rounded-lg bg-accent/30 border border-border space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Promoções já existentes neste produto</p>
              {existingPromos.map(ep => {
                const d = getPromoDiscount(ep);
                const epProduct = products.find(pr => pr.id === productId);
                const discountedPrice = epProduct
                  ? d.type === 'percentage'
                    ? epProduct.price * (1 - d.value / 100)
                    : epProduct.price - d.value
                  : null;
                return (
                  <div key={ep._id} className="flex items-center gap-2 text-sm flex-wrap">
                    <Badge variant={ep.active ? 'default' : 'secondary'} className="text-[10px]">
                      {ep.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <span className="text-foreground">
                      {d.type === 'percentage'
                        ? `${d.value}% de desconto`
                        : `R$ ${d.value.toFixed(2).replace('.', ',')} de desconto`}
                    </span>
                    {discountedPrice !== null && (
                      <span className="text-xs font-medium text-primary">
                        → R$ {Math.max(0, discountedPrice).toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    {(ep.startDate || ep.endDate) && (
                      <span className="text-xs text-muted-foreground">
                        ({ep.startDate && new Date(ep.startDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        {ep.endDate && ` — ${new Date(ep.endDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        <div className="space-y-2">
          <Label>Título da Promoção</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Promoção relâmpago" />
        </div>

        <div className="space-y-2">
          <Label>Produto *</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Desconto</Label>
            <Select value={discountType} onValueChange={setDiscountType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Valor *</Label>
            <Input type="number" step="0.01" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === 'percentage' ? 'Ex: 20' : 'Ex: 50.00'} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data/Hora Início</Label>
            <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data/Hora Fim</Label>
            <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={active} onCheckedChange={setActive} />
          <Label>Promoção ativa</Label>
        </div>

        {/* Preview */}
        {selectedProduct && previewPrice !== null && (
          <div className="p-4 rounded-lg bg-secondary border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Preview do preço</p>
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-bold text-primary">
                R$ {Math.max(0, previewPrice).toFixed(2).replace('.', ',')}
              </span>
              <span className="line-through text-sm text-muted-foreground">
                R$ {selectedProduct.price.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Tag className="w-4 h-4 mr-2" />}
          {loading ? 'Salvando...' : 'Criar Promoção'}
        </Button>
      </form>
    </div>
  );
}
