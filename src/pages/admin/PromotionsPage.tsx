import { useState } from 'react';
import { Tag, Loader2, Trash2, Ticket, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';

// ── Promotion types & helpers ──

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

// ── Coupon types & helpers ──

interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number;
  maxDiscount: number;
  expiresAt?: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
}

function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const data = await api.get<Coupon[] | { coupons: Coupon[] }>('/api/coupons');
      return Array.isArray(data) ? data : (data as any).coupons ?? [];
    },
  });
}

// ── Main Page ──

export default function PromotionsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Tag className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Promoções & Cupons</h1>
      </div>

      <Tabs defaultValue="promotions" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="promotions" className="gap-2">
            <Tag className="w-4 h-4" /> Promoções
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-2">
            <Ticket className="w-4 h-4" /> Cupons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="promotions" className="space-y-6 mt-4">
          <PromotionsTab />
        </TabsContent>

        <TabsContent value="coupons" className="space-y-6 mt-4">
          <CouponsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ══════════════════════════════════════
// PROMOTIONS TAB (existing logic)
// ══════════════════════════════════════

function PromotionsTab() {
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
    const found = products.find(prod => prod.id === id);
    if (found) { name = found.name; image = found.images?.[0] || ''; price = found.price; }
    return { name, image, price, id };
  };

  return (
    <>
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
                  ? d.type === 'percentage' ? epProduct.price * (1 - d.value / 100) : epProduct.price - d.value
                  : null;
                return (
                  <div key={ep._id} className="flex items-center gap-2 text-sm flex-wrap">
                    <Badge variant={ep.active ? 'default' : 'secondary'} className="text-[10px]">
                      {ep.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <span className="text-foreground">
                      {d.type === 'percentage' ? `${d.value}% de desconto` : `R$ ${d.value.toFixed(2).replace('.', ',')} de desconto`}
                    </span>
                    {discountedPrice !== null && (
                      <span className="text-xs font-medium text-primary">→ R$ {Math.max(0, discountedPrice).toFixed(2).replace('.', ',')}</span>
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

        {selectedProduct && previewPrice !== null && (
          <div className="p-4 rounded-lg bg-secondary border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Preview do preço</p>
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-bold text-primary">R$ {Math.max(0, previewPrice).toFixed(2).replace('.', ',')}</span>
              <span className="line-through text-sm text-muted-foreground">R$ {selectedProduct.price.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Tag className="w-4 h-4 mr-2" />}
          {loading ? 'Salvando...' : 'Criar Promoção'}
        </Button>
      </form>
    </>
  );
}

// ══════════════════════════════════════
// COUPONS TAB (new)
// ══════════════════════════════════════

function CouponsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: coupons = [], isLoading } = useCoupons();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCode(''); setType('percentage'); setValue(''); setMinOrderValue('');
    setMaxDiscount(''); setUsageLimit(''); setExpiresAt(''); setActive(true);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'DSG-';
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setCode(result);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value) {
      toast({ title: '⚠️ Código e valor são obrigatórios', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/coupons', {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        minOrderValue: Number(minOrderValue) || 0,
        maxDiscount: Number(maxDiscount) || 0,
        usageLimit: Number(usageLimit) || 0,
        expiresAt: expiresAt || undefined,
        active,
      });
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({ title: '✅ Cupom criado!' });
      resetForm();
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/coupons/${id}`);
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({ title: '🗑️ Cupom removido!' });
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      await api.patch(`/api/coupons/${coupon._id}`, { active: !coupon.active });
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({ title: coupon.active ? '⏸️ Cupom desativado' : '▶️ Cupom ativado' });
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    }
  };

  const copyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const now = new Date();
  const activeCoupons = coupons.filter((c: Coupon) => c.active && (!c.expiresAt || new Date(c.expiresAt) > now));
  const inactiveCoupons = coupons.filter((c: Coupon) => !c.active || (c.expiresAt && new Date(c.expiresAt) <= now));

  return (
    <>
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-foreground">Cupons de Desconto</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Ticket className="w-4 h-4" /> Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Cupom de Desconto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Código do Cupom *</Label>
                <div className="flex gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: DESCONTO20"
                    className="font-mono uppercase"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generateCode} className="whitespace-nowrap text-xs">
                    Gerar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={(v) => setType(v as 'percentage' | 'fixed')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={type === 'percentage' ? 'Ex: 15' : 'Ex: 30.00'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Pedido Mínimo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desconto Máximo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="Sem limite"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Limite de Uso</Label>
                  <Input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="Ilimitado"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expira em</Label>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={active} onCheckedChange={setActive} />
                <Label>Cupom ativo</Label>
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ticket className="w-4 h-4 mr-2" />}
                  {loading ? 'Criando...' : 'Criar Cupom'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupon list */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando cupons...</span>
          </div>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cupom cadastrado.</p>
        ) : (
          <div className="space-y-4">
            {activeCoupons.length > 0 && (
              <div className="space-y-3">
                {activeCoupons.map((coupon: Coupon) => (
                  <CouponCard
                    key={coupon._id}
                    coupon={coupon}
                    copiedCode={copiedCode}
                    onCopy={copyCode}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {inactiveCoupons.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Inativos / Expirados ({inactiveCoupons.length})
                </h3>
                <div className="space-y-2 opacity-60">
                  {inactiveCoupons.map((coupon: Coupon) => (
                    <CouponCard
                      key={coupon._id}
                      coupon={coupon}
                      copiedCode={copiedCode}
                      onCopy={copyCode}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Coupon Card ──

function CouponCard({
  coupon, copiedCode, onCopy, onToggle, onDelete, compact,
}: {
  coupon: Coupon;
  copiedCode: string | null;
  onCopy: (code: string) => void;
  onToggle: (c: Coupon) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  const now = new Date();
  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) <= now;
  const isLimitReached = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;

  return (
    <div className={`flex items-center gap-3 ${compact ? 'p-2' : 'p-3'} rounded-lg bg-secondary border border-border`}>
      <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
        <Ticket className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-foreground">{coupon.code}</span>
          <button onClick={() => onCopy(coupon.code)} className="text-muted-foreground hover:text-foreground transition-colors">
            {copiedCode === coupon.code ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={coupon.active && !isExpired ? 'default' : 'secondary'} className="text-[10px]">
            {isExpired ? 'Expirado' : isLimitReached ? 'Esgotado' : coupon.active ? 'Ativo' : 'Inativo'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2).replace('.', ',')}`} de desconto
          </span>
          {coupon.minOrderValue > 0 && (
            <span className="text-xs text-muted-foreground">• Min: R$ {coupon.minOrderValue.toFixed(2).replace('.', ',')}</span>
          )}
          {coupon.maxDiscount > 0 && (
            <span className="text-xs text-muted-foreground">• Máx: R$ {coupon.maxDiscount.toFixed(2).replace('.', ',')}</span>
          )}
        </div>

        {!compact && (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {coupon.usageLimit > 0 && <span>Usos: {coupon.usedCount}/{coupon.usageLimit}</span>}
            {coupon.expiresAt && (
              <span>Expira: {new Date(coupon.expiresAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Switch checked={coupon.active} onCheckedChange={() => onToggle(coupon)} className="scale-75" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(coupon._id)}>
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
