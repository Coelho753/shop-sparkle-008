import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface Category {
  id: string;
  name: string;
  slug?: string;
}

interface ApiCategory {
  _id: string;
  name?: string;
  nome?: string;
  slug?: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const raw = await api.get<ApiCategory[] | { categories: ApiCategory[] } | { success: boolean; data: ApiCategory[] }>('/api/categories');
      let list: ApiCategory[];
      if (Array.isArray(raw)) {
        list = raw;
      } else if ('categories' in raw) {
        list = raw.categories ?? [];
      } else if ('data' in raw && Array.isArray((raw as any).data)) {
        list = (raw as any).data;
      } else {
        list = [];
      }
      return list.map((c): Category => {
        const catName = c.nome || c.name || '';
        return {
          id: c._id,
          name: catName,
          slug: c.slug ?? catName.toLowerCase(),
        };
      });
    },
    retry: 1,
  });
}
