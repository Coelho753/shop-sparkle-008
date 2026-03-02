import { Star, ShoppingCart, ImageOff } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback } from 'react';

// Category placeholders matching useProducts - full set for unique images
const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  fones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
  eletronicos: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop',
  acessorios: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
  roupas: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=400&fit=crop',
  calcados: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
  casa: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
  esportes: 'https://images.unsplash.com/photo-1461896836934-bd45ba7e9bd7?w=400&h=400&fit=crop',
  beleza: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
  jogos: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop',
  informatica: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
  chinelos: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&h=400&fit=crop',
  default: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
};

function getFallbackImage(category: string): string {
  const key = category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [cat, url] of Object.entries(CATEGORY_PLACEHOLDERS)) {
    if (cat === 'default') continue;
    if (key.includes(cat) || cat.includes(key)) return url;
  }
  return CATEGORY_PLACEHOLDERS.default;
}

interface ProductCardProps {
  product: Product;
  index: number;
  onBuy?: (product: Product) => void;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [imgError, setImgError] = useState(false);

  const fallback = getFallbackImage(product.category);
  const imageSrc = imgError ? fallback : product.images[0];

  const handleImageError = useCallback(() => {
    setImgError(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="card-product group cursor-pointer"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {imgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-secondary">
            <img
              src={fallback}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={handleImageError}
          />
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{product.category}</p>
        <h3 className="font-semibold text-card-foreground text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{product.name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="price-promo">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="price-original">
                R$ {product.originalPrice.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
              </span>
            </>
          )}
        </div>

        <Button
          size="sm"
          className="w-full mt-2"
          onClick={(e) => {
            e.stopPropagation();
            addItem(product);
            toast({ title: `${product.name} adicionado ao carrinho!` });
          }}
        >
          <ShoppingCart className="w-3.5 h-3.5 mr-1" />
          Adicionar
        </Button>
      </div>
    </motion.div>
  );
}
