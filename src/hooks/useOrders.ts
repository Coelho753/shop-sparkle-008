import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    image?: string;
    price?: number;
  } | string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  shippingCompany?: string;
  shippingEstimatedDays?: number;
  shippingAddress?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    complement?: string;
  };
  createdAt: string;
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const raw = await api.get<any>('/api/orders/my-orders');
      // Backend wraps in { success, data } via ok() helper
      const list = Array.isArray(raw) ? raw : raw.data ?? raw.orders ?? [];
      return list.map((o: any): Order => ({
        id: o._id || o.id,
        items: (o.items || []).map((item: any) => ({
          product: item.product,
          name: item.name || (typeof item.product === 'object' ? item.product.name : ''),
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? 0,
          subtotal: item.subtotal ?? 0,
        })),
        subtotal: o.subtotal ?? 0,
        shipping: o.shipping ?? 0,
        total: o.total ?? 0,
        status: o.status ?? 'pending',
        shippingCompany: o.shippingCompany,
        shippingEstimatedDays: o.shippingEstimatedDays,
        shippingAddress: o.shippingAddress,
        createdAt: o.createdAt ?? new Date().toISOString(),
      }));
    },
    retry: 1,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { items: { productId: string; quantity: number }[] }) =>
      api.post('/api/orders', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
