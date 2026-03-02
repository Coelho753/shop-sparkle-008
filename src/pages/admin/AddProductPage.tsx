import { useState } from 'react';
import { PlusCircle, Upload, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export default function AddProductPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [active, setActive] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category) {
      toast({ title: '⚠️ Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
      const formData = new FormData();
      formData.append('name', name);
      formData.append('nome', name);
      formData.append('slug', slug);
      formData.append('description', description);
      formData.append('descricao', description);
      formData.append('price', price);
      formData.append('preco', price);
      if (originalPrice) formData.append('precoOriginal', originalPrice);
      formData.append('stock', stock || '0');
      formData.append('estoque', stock || '0');
      formData.append('categoria', category);
      formData.append('ativo', String(active));
      images.forEach((img) => formData.append('image', img));

      await api.upload('/api/products', formData);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: '✅ Produto adicionado com sucesso!' });

      // Reset
      setName(''); setDescription(''); setPrice(''); setOriginalPrice('');
      setStock(''); setCategory(''); setActive(true);
      setImages([]); setPreviews([]);
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <PlusCircle className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Adicionar Produto</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-card border border-border space-y-5">
        <div className="space-y-2">
          <Label>Nome *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do produto" />
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição detalhada..." rows={4} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Preço *</Label>
            <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label>Preço Original</Label>
            <Input type="number" step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="0,00" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Estoque</Label>
            <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={active} onCheckedChange={setActive} />
          <Label>Produto ativo</Label>
        </div>

        {/* Image Upload */}
        <div className="space-y-3">
          <Label>Imagens</Label>
          <div className="flex flex-wrap gap-3">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <input type="file" accept="image/*" multiple onChange={handleImageAdd} className="hidden" />
            </label>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
          {loading ? 'Salvando...' : 'Adicionar Produto'}
        </Button>
      </form>
    </div>
  );
}
