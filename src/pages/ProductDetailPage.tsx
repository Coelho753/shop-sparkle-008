import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '@/hooks/useProducts';
import { ArrowLeft, Star, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import ProductReviews from '@/components/ProductReviews';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id || '');
  const [selectedImage, setSelectedImage] = useState(0);
  const { toast } = useToast();
  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
    toast({ title: `${product.name} adicionado ao carrinho!` });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20 space-y-4">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/products')}>
          Voltar aos produtos
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary border border-border">
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';
              }}
            />
            {product.hasPromo && product.promoLabel && (
              <span className="promo-badge absolute top-3 left-3 shadow-md text-sm">
                {product.promoLabel}
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                    i === selectedImage ? 'border-primary' : 'border-border'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {product.category}
          </p>
          <h1 className="text-2xl font-display font-bold text-foreground">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'fill-primary text-primary'
                    : 'text-muted-foreground/30'
                }`}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-1">
              ({product.reviewCount} avaliações)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="price-original text-base">
                  R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Stock */}
          <p className="text-sm text-muted-foreground">
            {product.stock > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}
          </p>

          <Button className="w-full md:w-auto gap-2" size="lg" onClick={handleAddToCart} disabled={product.stock <= 0}>
            <ShoppingCart className="w-5 h-5" />
            Adicionar ao Carrinho
          </Button>

          {/* Description */}
          {product.description && (
            <div className="pt-4 border-t border-border space-y-2">
              <h2 className="font-display font-semibold text-foreground">Descrição</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <ProductReviews
        productId={product.id}
        rating={product.rating}
        reviewCount={product.reviewCount}
      />
    </div>
  );
}
