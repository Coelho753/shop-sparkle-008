import { Package, Loader2 } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';

export default function MyOrdersPage() {
  const { data: orders, isLoading, error } = useOrders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Package className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-display font-bold text-foreground mb-2">Minhas Compras</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Você ainda não tem compras. Explore nossos produtos e encontre o que precisa!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Package className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Minhas Compras</h1>
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="p-4 bg-card rounded-xl border border-border flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-card-foreground">{order.productName}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString('pt-BR')} · Qtd: {order.quantity}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                order.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                'bg-muted text-muted-foreground'
              }`}>
                {order.status === 'completed' ? 'Concluído' : order.status === 'pending' ? 'Pendente' : order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
