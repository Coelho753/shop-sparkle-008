import { LayoutGrid, Loader2, Trash2, Eye, EyeOff } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';

export default function ManageProductsPage() {
  const { data, isLoading } = useProducts();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const products = data?.products ?? [];

  const toggleActive = async (product: Product) => {
    try {
      await api.patch(`/api/products/${product.id}`, { active: !product.active });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: '✅ Atualizado!', description: `${product.name} ${product.active ? 'desativado' : 'ativado'}` });
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    }
  };

  const deleteProduct = async (product: Product) => {
    try {
      await api.delete(`/api/products/${product.id}`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: '🗑️ Removido', description: product.name });
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <LayoutGrid className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Gerenciar Produtos</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="p-6 rounded-xl bg-card border border-border text-center">
          <p className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Produto</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Categoria</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Preço</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Estoque</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id} className="bg-card hover:bg-secondary/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'; }} />
                      <span className="font-medium text-card-foreground truncate max-w-[200px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.category}</td>
                  <td className="p-3 text-right font-semibold text-card-foreground">
                    R$ {p.price.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-3 text-center text-muted-foreground">{p.stock}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                    }`}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleActive(p)} title={p.active ? 'Desativar' : 'Ativar'}>
                        {p.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteProduct(p)} title="Remover">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
