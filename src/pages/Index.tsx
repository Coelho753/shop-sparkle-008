import { TrendingUp, ShoppingBag, Star, Truck, Shield, Headphones } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCreateOrder } from '@/hooks/useOrders';
import { motion } from 'framer-motion';
import bannerBg from '@/assets/dsg-banner-bg.png';

const features = [
  { icon: Truck, title: 'Frete Grátis', desc: 'Em compras acima de R$199' },
  { icon: Shield, title: 'Compra Segura', desc: 'Garantia de 30 dias' },
  { icon: Headphones, title: 'Suporte 24h', desc: 'Atendimento dedicado' },
];

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data, isLoading } = useProducts();
  const createOrder = useCreateOrder();

  const products = data?.products ?? [];
  const promoProducts = products.filter((p) => p.hasPromo).slice(0, 4);
  const topRated = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);

  const handleBuy = (product: Product) => {
    createOrder.mutate(
      { items: [{ productId: product.id, quantity: 1 }] },
      {
        onSuccess: () => {
          toast({ title: '🛒 Pedido criado!', description: `${product.name} - Redirecionando para o WhatsApp...` });
        },
        onError: (err: any) => {
          toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Banner - full width, responsive cover */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl overflow-hidden gold-border-glow border dragon-corner"
      >
        <img
          src={bannerBg}
          alt="DSG Tech Banner"
          className="w-full h-auto min-h-[200px] max-h-[400px] object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
      </motion.div>



      {/* Promo Section */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display font-bold text-foreground">Promoções</h2>
          </div>
          <button onClick={() => navigate('/products')} className="text-sm text-primary font-medium hover:underline">
            Ver todos →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : promoProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} onBuy={handleBuy} />)}
        </div>
      </section>

      {/* Top Rated */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display font-bold text-foreground">Mais Avaliados</h2>
          </div>
          <button onClick={() => navigate('/products')} className="text-sm text-primary font-medium hover:underline">
            Ver todos →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : topRated.map((p, i) => <ProductCard key={p.id} product={p} index={i} onBuy={handleBuy} />)}
        </div>
      </section>

      {/* Features - below products */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <f.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-card-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Index;
