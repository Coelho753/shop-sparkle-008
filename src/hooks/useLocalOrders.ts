import { useState, useCallback, useEffect } from 'react';

export interface LocalOrder {
  id: string;
  items: {
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    unitPrice: number;
  }[];
  total: number;
  shippingCost: number;
  paymentMethod: 'pix' | 'card';
  status: 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';
  createdAt: string;
  estimatedDelivery: string;
  trackingUpdates: {
    status: string;
    label: string;
    date: string;
    completed: boolean;
  }[];
}

const STORAGE_KEY = 'dsg-orders';

function getStoredOrders(): LocalOrder[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: LocalOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function generateTrackingUpdates(createdAt: string): LocalOrder['trackingUpdates'] {
  const created = new Date(createdAt);
  return [
    {
      status: 'confirmed',
      label: 'Pedido confirmado',
      date: created.toISOString(),
      completed: true,
    },
    {
      status: 'processing',
      label: 'Em preparação',
      date: new Date(created.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      completed: true,
    },
    {
      status: 'shipped',
      label: 'Enviado',
      date: '',
      completed: false,
    },
    {
      status: 'out_for_delivery',
      label: 'Saiu para entrega',
      date: '',
      completed: false,
    },
    {
      status: 'delivered',
      label: 'Entregue',
      date: '',
      completed: false,
    },
  ];
}

export function useLocalOrders() {
  const [orders, setOrders] = useState<LocalOrder[]>(getStoredOrders);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  const addOrder = useCallback((order: Omit<LocalOrder, 'id' | 'trackingUpdates' | 'estimatedDelivery' | 'status'>) => {
    const now = order.createdAt || new Date().toISOString();
    const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const newOrder: LocalOrder = {
      ...order,
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      status: 'processing',
      estimatedDelivery,
      trackingUpdates: generateTrackingUpdates(now),
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  }, []);

  return { orders, addOrder };
}
