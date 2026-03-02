import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

const BASE_URL = 'https://dsg-b.onrender.com';

// Category-based placeholder images (Unsplash, royalty-free)
const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  fones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
  eletrônicos: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop',
  acessórios: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
  roupas: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=400&fit=crop',
  calçados: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
  casa: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
  esportes: 'https://images.unsplash.com/photo-1461896836934-bd45ba7e9bd7?w=400&h=400&fit=crop',
  beleza: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
  jogos: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop',
  informatica: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
  default: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
};

function getCategoryPlaceholder(category: string): string {
  const key = category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [cat, url] of Object.entries(CATEGORY_PLACEHOLDERS)) {
    const normalizedCat = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (key.includes(normalizedCat) || normalizedCat.includes(key)) return url;
  }
  return CATEGORY_PLACEHOLDERS.default;
}

interface ApiProduct {
  _id?: string;
  id?: string;
  name?: string;
  nome?: string;
  description?: string;
  descricao?: string;
  price?: number;
  preco?: number;
  originalPrice?: number;
  precoOriginal?: number;
  precoFinal?: number;
  finalPrice?: number;
  promoPrice?: number | null;
  category?: string | { _id: string; name: string };
  categoria?: string | { _id: string; nome: string; slug?: string };
  image?: string;
  images?: string[];
  imagens?: string[];
  imageUrl?: string;
  rating?: number;
  avaliacaoMedia?: number;
  reviewCount?: number;
  totalAvaliacoes?: number;
  stock?: number;
  estoque?: number;
  active?: boolean;
  ativo?: boolean;
  hasPromo?: boolean;
  hasPromotion?: boolean;
  promocao?: { ativa: boolean };
  promocaoAtiva?: boolean;
  promoLabel?: string;
  discountPercentage?: number | null;
  descontoPercentualCalculado?: number;
  destaque?: boolean;
  soldCount?: number;
  totalVendido?: number;
  createdAt?: string;
  criadoEm?: string;
  updatedAt?: string;
  atualizadoEm?: string;
}

interface ProductsApiResponse {
  success?: boolean;
  data?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    products: ApiProduct[];
  };
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  products?: ApiProduct[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  active: boolean;
  hasPromo: boolean;
  promoLabel?: string;
  featured: boolean;
  soldCount: number;
}

function mapProduct(p: ApiProduct, categoryMap: Record<string, string> = {}): Product {
  const name = p.name || p.nome || '';
  const description = p.description || p.descricao || '';

  // Use finalPrice/precoFinal first, then fall back to price/preco
  // Backend stores prices in cents (e.g., 15990 = R$159.90). Convert if value > 1000 (likely cents)
  const rawFinal = p.finalPrice ?? p.precoFinal;
  const rawPrice = rawFinal ?? p.price ?? p.preco ?? 0;
  const price = rawPrice > 1000 ? rawPrice / 100 : rawPrice;

  const rawOriginal = p.originalPrice ?? p.precoOriginal;
  const originalPrice = rawOriginal ? (rawOriginal > 1000 ? rawOriginal / 100 : rawOriginal) : undefined;

  let categoryName = '';
  if (p.categoria && typeof p.categoria === 'object') {
    categoryName = p.categoria.nome;
  } else if (typeof p.categoria === 'string') {
    categoryName = categoryMap[p.categoria] || p.categoria;
  } else if (typeof p.category === 'object' && p.category) {
    categoryName = p.category.name;
  } else if (typeof p.category === 'string') {
    categoryName = categoryMap[p.category] || p.category;
  }

  const promoAtiva = p.hasPromotion ?? p.promocaoAtiva ?? p.promocao?.ativa ?? p.hasPromo ?? false;
  const hasPromo = promoAtiva || !!(originalPrice && originalPrice > price);

  let promoLabel = p.promoLabel;
  if (hasPromo && !promoLabel) {
    if (p.discountPercentage && p.discountPercentage > 0) {
      promoLabel = `-${Math.round(p.discountPercentage)}%`;
    } else if (p.descontoPercentualCalculado && p.descontoPercentualCalculado > 0) {
      promoLabel = `-${Math.round(p.descontoPercentualCalculado)}%`;
    } else if (originalPrice && originalPrice > price) {
      const discount = Math.round((1 - price / originalPrice) * 100);
      promoLabel = `-${discount}%`;
    }
  }

  // Build image list from all possible fields (including singular "image")
  const imgs = (p.images?.length ? p.images : p.imagens?.length ? p.imagens : []);
  const imageUrl = p.imageUrl || p.image || '';
  const rawImages = imgs.length ? imgs : imageUrl ? [imageUrl] : [];

  // Resolve URLs - prefix relative paths with BASE_URL
  const resolvedImages = rawImages.map(img => img.startsWith('http') ? img : `${BASE_URL}${img}`);

  // Always append category placeholder as last fallback
  const placeholder = getCategoryPlaceholder(categoryName);
  const finalImages = resolvedImages.length ? resolvedImages : [placeholder];

  return {
    id: p.id || p._id || '',
    name,
    description,
    price,
    originalPrice,
    category: categoryName,
    images: finalImages,
    rating: p.avaliacaoMedia ?? p.rating ?? 4.0,
    reviewCount: p.totalAvaliacoes ?? p.reviewCount ?? 0,
    stock: p.estoque ?? p.stock ?? 10,
    active: p.ativo ?? p.active ?? true,
    hasPromo,
    promoLabel,
    featured: p.destaque ?? false,
    soldCount: p.soldCount ?? p.totalVendido ?? 0,
  };
}

interface ApiPromotion {
  _id: string;
  productId: string | { _id: string };
  product?: string | { _id: string };
  discountType?: string;
  discountValue?: number;
  discount?: number;
  active?: boolean;
  endDate?: string;
  dataFim?: string;
}

function applyPromotions(products: Product[], promotions: ApiPromotion[]): Product[] {
  if (!promotions.length) return products;

  const now = new Date();
  const promoMap = new Map<string, ApiPromotion>();
  promotions.forEach(p => {
    if (!p.active && p.active !== undefined) return;
    // Skip expired promotions
    const endDate = p.endDate || p.dataFim;
    if (endDate && new Date(endDate) < now) return;
    const pid = typeof p.productId === 'object' ? p.productId._id : (typeof p.product === 'object' ? (p.product as any)._id : (p.productId || p.product || ''));
    if (pid) promoMap.set(pid, p);
  });

  return products.map(prod => {
    const promo = promoMap.get(prod.id);
    if (!promo) return prod;

    const discountValue = promo.discountValue ?? promo.discount ?? 0;
    const discountType = promo.discountType ?? 'percentage';
    const originalPrice = prod.originalPrice ?? prod.price;
    const newPrice = discountType === 'percentage'
      ? prod.price * (1 - discountValue / 100)
      : prod.price - discountValue;

    return {
      ...prod,
      price: Math.max(0, newPrice),
      originalPrice: originalPrice,
      hasPromo: true,
      promoLabel: discountType === 'percentage' ? `-${Math.round(discountValue)}%` : `-R$${discountValue}`,
    };
  });
}

export function useProducts(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const raw = await api.get<ApiProduct[] | ProductsApiResponse>('/api/products', params);

      // Handle flat array, {success, data: {products}}, or {products} formats
      let list: ApiProduct[];
      if (Array.isArray(raw)) {
        list = raw;
      } else {
        const inner = (raw as ProductsApiResponse).data ?? (raw as ProductsApiResponse);
        list = inner.products ?? [];
      }

      // Fetch categories to resolve category IDs to names
      let categoryMap: Record<string, string> = {};
      try {
        const cats = await api.get<Array<{ _id: string; nome?: string; name?: string }> | { categories: Array<{ _id: string; nome?: string; name?: string }> }>('/api/categories');
        const catList = Array.isArray(cats) ? cats : cats.categories ?? [];
        catList.forEach(c => {
          categoryMap[c._id] = c.nome || c.name || '';
        });
      } catch {}

      let products = list.map(p => mapProduct(p, categoryMap));

      // Fetch and apply promotions
      try {
        const promosRaw = await api.get<ApiPromotion[] | { promotions: ApiPromotion[] }>('/api/promotions');
        const promos = Array.isArray(promosRaw) ? promosRaw : (promosRaw as any).promotions ?? [];
        products = applyPromotions(products, promos);
      } catch {}

      return {
        totalItems: Array.isArray(raw) ? list.length : ((raw as ProductsApiResponse).data?.totalItems ?? (raw as ProductsApiResponse).totalItems ?? list.length),
        totalPages: Array.isArray(raw) ? 1 : ((raw as ProductsApiResponse).data?.totalPages ?? (raw as ProductsApiResponse).totalPages ?? 1),
        currentPage: Array.isArray(raw) ? 1 : ((raw as ProductsApiResponse).data?.currentPage ?? (raw as ProductsApiResponse).currentPage ?? 1),
        products,
      };
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const raw = await api.get<ApiProduct | { success: boolean; data: ApiProduct } | { product: ApiProduct }>(`/api/products/${id}`);
      
      // Unwrap response: could be {success, data: product}, {product: ...}, or flat product
      let data: ApiProduct;
      if ('success' in (raw as any) && (raw as any).data && !(raw as any).data.products) {
        data = (raw as any).data;
      } else if ('product' in (raw as any)) {
        data = (raw as any).product;
      } else {
        data = raw as ApiProduct;
      }

      let categoryMap: Record<string, string> = {};
      try {
        const cats = await api.get<Array<{ _id: string; nome?: string; name?: string }> | { categories: Array<{ _id: string; nome?: string; name?: string }> }>('/api/categories');
        const catList = Array.isArray(cats) ? cats : (cats as any).categories ?? [];
        catList.forEach((c: any) => { categoryMap[c._id] = c.nome || c.name || ''; });
      } catch {}
      return mapProduct(data, categoryMap);
    },
    enabled: !!id,
  });
}
