import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product } from '@/hooks/useProducts';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface ApiCartItem {
  product: string | { _id: string; nome?: string; name?: string; preco?: number; price?: number; images?: string[]; imagens?: string[]; imageUrl?: string; descricao?: string; description?: string; estoque?: number; stock?: number; categoria?: any; category?: any; avaliacaoMedia?: number; rating?: number; totalAvaliacoes?: number; reviewCount?: number; ativo?: boolean; active?: boolean; promocao?: any; hasPromo?: boolean; promoLabel?: string; precoOriginal?: number; originalPrice?: number };
  name?: string;
  price?: number;
  quantity: number;
  selected?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  syncing: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

const BASE_URL = 'https://dsg-b.onrender.com';

function mapApiCartToItems(apiItems: ApiCartItem[]): CartItem[] {
  return apiItems
    .filter(item => item.product && typeof item.product === 'object')
    .map(item => {
      const p = item.product as any;
      const rawPrice = p.price ?? p.preco ?? 0;
      const price = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
      const rawOriginal = p.originalPrice ?? p.precoOriginal;
      const originalPrice = rawOriginal ? (rawOriginal > 1000 ? rawOriginal / 100 : rawOriginal) : undefined;

      const imgs = (p.images?.length ? p.images : p.imagens?.length ? p.imagens : []);
      const imageUrl = p.imageUrl || '';
      const rawImages = imgs.length ? imgs : imageUrl ? [imageUrl] : [];
      const finalImages = rawImages.length
        ? rawImages.map((img: string) => img.startsWith('http') ? img : `${BASE_URL}${img}`)
        : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'];

      let categoryName = '';
      if (p.categoria && typeof p.categoria === 'object') categoryName = p.categoria.nome;
      else if (typeof p.category === 'object' && p.category) categoryName = p.category.name;
      else if (typeof p.category === 'string') categoryName = p.category;

      return {
        product: {
          id: p._id || p.id,
          name: p.name || p.nome || '',
          description: p.description || p.descricao || '',
          price,
          originalPrice,
          category: categoryName,
          images: finalImages,
          rating: p.avaliacaoMedia ?? p.rating ?? 4.0,
          reviewCount: p.totalAvaliacoes ?? p.reviewCount ?? 0,
          stock: p.estoque ?? p.stock ?? 10,
          active: p.ativo ?? p.active ?? true,
          hasPromo: p.promocao?.ativa ?? p.hasPromo ?? false,
          promoLabel: p.promoLabel,
          featured: p.destaque ?? false,
          soldCount: p.soldCount ?? p.totalVendido ?? 0,
        },
        quantity: item.quantity,
      };
    });
}

function getCartKey(userId?: string) {
  return userId ? `dsg-cart-${userId}` : 'dsg-cart-guest';
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(getCartKey(user?.id));
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [syncing, setSyncing] = useState(false);

  // Load cart for current user when user changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getCartKey(user?.id));
      setItems(stored ? JSON.parse(stored) : []);
    } catch {
      setItems([]);
    }
  }, [user?.id]);

  // Sync from server when user logs in
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const fetchCart = async () => {
      try {
        const data = await api.get<any>('/api/cart');
        const serverItems = data.items || data.products || data;
        if (Array.isArray(serverItems) && serverItems.length > 0) {
          const mapped = mapApiCartToItems(serverItems);
          if (mapped.length > 0) {
            setItems(mapped);
          }
        }
      } catch {
        // API do cart pode não existir ou falhar, manter local
      }
    };
    fetchCart();
  }, [user]);

  useEffect(() => {
    localStorage.setItem(getCartKey(user?.id), JSON.stringify(items));
  }, [items, user?.id]);

  // Add item via POST /api/cart
  const addToServer = useCallback(async (productId: string, quantity: number) => {
    if (!user) return;
    try {
      await api.post('/api/cart', { productId, quantity });
    } catch {
      // Silently fail - local cart is source of truth
    }
  }, [user]);

  // Update quantity via PUT /api/cart/quantity
  const updateOnServer = useCallback(async (productId: string, quantity: number) => {
    if (!user) return;
    try {
      await api.put('/api/cart/quantity', { productId, quantity });
    } catch {
      // Silently fail
    }
  }, [user]);

  const removeFromServer = useCallback(async (productId: string) => {
    if (!user) return;
    try {
      await api.delete(`/api/cart/${productId}`);
    } catch {
      // Silently fail
    }
  }, [user]);

  const clearOnServer = useCallback(async () => {
    if (!user) return;
    try {
      await api.delete('/api/cart/clear/all');
    } catch {
      // Silently fail
    }
  }, [user]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        updateOnServer(product.id, newQty);
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: newQty } : i
        );
      }
      addToServer(product.id, quantity);
      return [...prev, { product, quantity }];
    });
  }, [addToServer, updateOnServer]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
    removeFromServer(productId);
  }, [removeFromServer]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.product.id !== productId));
      removeFromServer(productId);
      return;
    }
    setItems(prev =>
      prev.map(i => (i.product.id === productId ? { ...i, quantity } : i))
    );
    updateOnServer(productId, quantity);
  }, [updateOnServer, removeFromServer]);

  const clearCart = useCallback(() => {
    setItems([]);
    clearOnServer();
  }, [clearOnServer]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, syncing }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
