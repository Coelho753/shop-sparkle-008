import { useState } from 'react';
import { Package, Loader2, ChevronRight, Truck, CheckCircle2, Clock, Box, MapPin, ShoppingBag } from 'lucide-react';
import { useOrders, Order } from '@/hooks/useOrders';
import { useLocalOrders, LocalOrder } from '@/hooks/useLocalOrders';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const BASE_URL = 'https://dsg-b.onrender.com';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: 'Pendente', color: 'text-yellow-500 bg-yellow-500/10', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'text-blue-500 bg-blue-500/10', icon: CheckCircle2 },
  processing: { label: 'Em preparação', color: 'text-amber-500 bg-amber-500/10', icon: Box },
  shipped: { label: 'Enviado', color: 'text-purple-500 bg-purple-500/10', icon: Truck },
  out_for_delivery: { label: 'Saiu para entrega', color: 'text-orange-500 bg-orange-500/10', icon: MapPin },
  delivered: { label: 'Entregue', color: 'text-green-500 bg-green-500/10', icon: CheckCircle2 },
  completed: { label: 'Concluído', color: 'text-green-500 bg-green-500/10', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'text-red-500 bg-red-500/10', icon: Clock },
};

function resolveImage(img?: string) {
  if (!img) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';
  return img.startsWith('http') ? img : `${BASE_URL}${img}`;
}

// Unified order type for display
interface DisplayOrder {
  id: string;
  items: { name: string; image: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  shippingCompany?: string;
  shippingEstimatedDays?: number;
  createdAt: string;
  source: 'api' | 'local';
}

function apiOrderToDisplay(o: Order): DisplayOrder {
  return {
    id: o.id,
    items: o.items.map(item => {
      const productObj = typeof item.product === 'object' ? item.product : null;
      return {
        name: item.name || productObj?.name || 'Produto',
        image: resolveImage(productObj?.image),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      };
    }),
    subtotal: o.subtotal,
    shipping: o.shipping,
    total: o.total,
    status: o.status,
    shippingCompany: o.shippingCompany,
    shippingEstimatedDays: o.shippingEstimatedDays,
    createdAt: o.createdAt,
    source: 'api',
  };
}

function localOrderToDisplay(o: LocalOrder): DisplayOrder {
  return {
    id: o.id,
    items: o.items.map(item => ({
      name: item.productName,
      image: resolveImage(item.productImage),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    subtotal: o.total - o.shippingCost,
    shipping: o.shippingCost,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
    source: 'local',
  };
}

function OrderCard({ order, onSelect }: { order: DisplayOrder; onSelect: () => void }) {
  const config = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground font-mono">{order.id.slice(0, 20)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${config.color}`}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </span>
      </div>

      <div className="space-y-2">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <img
              src={item.image}
              alt={item.name}
              className="w-12 h-12 rounded-lg object-cover bg-secondary flex-shrink-0"
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'; }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.quantity}x R$ {item.unitPrice.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <p className="font-bold text-sm text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</p>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}

function OrderDetail({ order, onBack }: { order: DisplayOrder; onBack: () => void }) {
  const config = statusConfig[order.status] || statusConfig.pending;

  const trackingSteps = [
    { status: 'pending', label: 'Pedido recebido' },
    { status: 'processing', label: 'Em preparação' },
    { status: 'shipped', label: 'Enviado' },
    { status: 'out_for_delivery', label: 'Saiu para entrega' },
    { status: 'delivered', label: 'Entregue' },
  ];

  const statusOrder = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(order.status);

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 -ml-2">
        ← Voltar
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Pedido</h2>
          <p className="text-xs text-muted-foreground font-mono">{order.id}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>

      {/* Tracking */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Acompanhamento</h3>
        </div>
        <div className="space-y-0">
          {trackingSteps.map((step, i) => {
            const isCompleted = i <= currentIndex;
            const isLast = i === trackingSteps.length - 1;
            return (
              <div key={step.status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 mt-1 ${
                    isCompleted ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/30'
                  }`} />
                  {!isLast && (
                    <div className={`w-0.5 flex-1 min-h-[28px] ${
                      isCompleted && i < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20'
                    }`} />
                  )}
                </div>
                <div className="pb-4">
                  <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {order.shippingCompany && (
          <div className="mt-2 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Transportadora: <span className="font-medium text-foreground">{order.shippingCompany}</span>
            </p>
            {order.shippingEstimatedDays && (
              <p className="text-xs text-muted-foreground">
                Prazo estimado: <span className="font-medium text-foreground">{order.shippingEstimatedDays} dias úteis</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <h3 className="font-display font-semibold text-foreground mb-3">Itens do pedido</h3>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-14 h-14 rounded-lg object-cover bg-secondary flex-shrink-0"
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'; }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-foreground">
                R$ {(item.unitPrice * item.quantity).toFixed(2).replace('.', ',')}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-border space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
          </div>
          {order.shipping > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Frete</span>
              <span>R$ {order.shipping.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const { orders: localOrders } = useLocalOrders();
  const { data: apiOrders, isLoading } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Convert both sources to DisplayOrder
  const apiDisplay = (apiOrders || []).map(apiOrderToDisplay);
  const localDisplay = localOrders.map(localOrderToDisplay);

  // Combine, API takes priority (avoid duplicates)
  const apiIds = new Set(apiDisplay.map(o => o.id));
  const allOrders = [...apiDisplay, ...localDisplay.filter(o => !apiIds.has(o.id))];

  const selectedOrder = allOrders.find(o => o.id === selectedOrderId);

  if (selectedOrder) {
    return (
      <div className="animate-fade-in">
        <OrderDetail order={selectedOrder} onBack={() => setSelectedOrderId(null)} />
      </div>
    );
  }

  if (isLoading && localOrders.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (allOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ShoppingBag className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-display font-bold text-foreground mb-2">Nenhuma compra ainda</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          Você ainda não fez nenhuma compra. Explore nossos produtos e encontre o que precisa!
        </p>
        <Button onClick={() => navigate('/products')} className="gap-2">
          <ShoppingBag className="w-4 h-4" /> Ver produtos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Package className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Minhas Compras</h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
          {allOrders.length}
        </span>
      </div>
      <div className="space-y-3">
        {allOrders.map((order) => (
          <OrderCard key={order.id} order={order} onSelect={() => setSelectedOrderId(order.id)} />
        ))}
      </div>
    </div>
  );
}
