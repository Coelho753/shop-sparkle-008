import { useState } from 'react';
import { FolderPlus, Loader2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export default function CategoriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useCategories();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post('/api/categories', { name: name.trim(), nome: name.trim() });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: '✅ Categoria criada!' });
      setName('');
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    try {
      await api.delete(`/api/categories/${id}`);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: '🗑️ Removida', description: catName });
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <FolderPlus className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Categorias</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-card border border-border space-y-4">
        <div className="space-y-2">
          <Label>Nome da Categoria</Label>
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Eletrônicos" />
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
            </Button>
          </div>
        </div>
      </form>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="p-3 bg-secondary">
          <h3 className="text-sm font-semibold text-foreground">Categorias existentes</h3>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !categories?.length ? (
          <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma categoria.</p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-3 bg-card hover:bg-secondary/50 transition-colors">
                <span className="text-sm font-medium text-card-foreground">{c.name}</span>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id, c.name)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
