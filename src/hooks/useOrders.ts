import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Order {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  status: string;
  createdAt: string;
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const data = await api.get<any>('/api/pedidos');
      const list = Array.isArray(data) ? data : data.orders ?? data.pedidos ?? [];
      return list.map((o: any): Order => ({
        id: o._id || o.id,
        productId: o.productId || o.product?._id || o.produto?._id || '',
        productName: o.productName || o.product?.name || o.produto?.nome || 'Produto',
        quantity: o.quantity ?? o.quantidade ?? 1,
        total: o.total ?? o.price ?? o.valor ?? 0,
        status: o.status ?? 'pending',
        createdAt: o.createdAt ?? o.criadoEm ?? new Date().toISOString(),
      }));
    },
    retry: 1,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { productId: string; quantity?: number }) =>
      api.post('/api/pedidos', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
