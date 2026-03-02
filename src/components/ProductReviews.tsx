import { useState } from 'react';
import { Star, ThumbsUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

interface Review {
  id: string;
  userName: string;
  avatar?: string;
  rating: number;
  date: string;
  comment: string;
  images?: string[];
  helpful: number;
}

// Mock reviews based on product
function generateMockReviews(productId: string, rating: number, count: number): Review[] {
  const names = ['Ana Costa', 'Carlos Mendes', 'Maria Silva', 'Pedro Santos', 'Julia Oliveira', 'Lucas Ferreira', 'Beatriz Lima', 'Rafael Souza'];
  const comments = [
    'Produto excelente! Superou minhas expectativas. A qualidade é incrível e chegou antes do prazo.',
    'Muito bom, recomendo! Funciona perfeitamente e o acabamento é de primeira.',
    'Bom custo-benefício. Para o preço que paguei, está muito acima da média.',
    'Chegou rápido e bem embalado. O produto é exatamente como descrito no anúncio.',
    'Ótima qualidade de construção. Uso diariamente e não tenho nenhuma reclamação.',
    'Atende bem ao que promete. Não é perfeito, mas pelo preço, é uma ótima compra.',
    'Adorei! Já é o segundo que compro. Dessa vez comprei para dar de presente.',
    'Produto ok, mas esperava um pouco mais pela marca. O acabamento poderia ser melhor.',
  ];
  const reviewImages = [
    ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop'],
    ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&h=150&fit=crop'],
    [],
    ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=150&h=150&fit=crop'],
    [],
    [],
    ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&h=150&fit=crop'],
    [],
  ];

  const seed = parseInt(productId, 36) || 1;
  return Array.from({ length: Math.min(count, 8) }, (_, i) => {
    const idx = (seed + i) % names.length;
    // Distribute ratings around the product's average
    const reviewRating = Math.max(1, Math.min(5, Math.round(rating + (i % 3 === 0 ? -1 : i % 3 === 1 ? 0 : 1))));
    const daysAgo = (i + 1) * 7 + (seed % 10);
    const date = new Date(Date.now() - daysAgo * 86400000);

    return {
      id: `review-${productId}-${i}`,
      userName: names[idx],
      rating: reviewRating,
      date: date.toLocaleDateString('pt-BR'),
      comment: comments[idx],
      images: reviewImages[idx],
      helpful: Math.floor(Math.random() * 30) + 1,
    };
  });
}

function RatingDistribution({ rating, count }: { rating: number; count: number }) {
  // Simulate distribution centered around the rating
  const dist = [5, 4, 3, 2, 1].map(star => {
    const diff = Math.abs(star - rating);
    const pct = Math.max(3, Math.round(100 * Math.exp(-diff * 1.2)));
    return { star, pct };
  });
  const totalPct = dist.reduce((s, d) => s + d.pct, 0);

  return (
    <div className="space-y-1.5">
      {dist.map(d => (
        <div key={d.star} className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground w-3">{d.star}</span>
          <Star className="w-3 h-3 fill-primary text-primary" />
          <Progress value={(d.pct / totalPct) * 100} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground w-8">{Math.round((d.pct / totalPct) * count)}</span>
        </div>
      ))}
    </div>
  );
}

interface ProductReviewsProps {
  productId: string;
  rating: number;
  reviewCount: number;
}

export default function ProductReviews({ productId, rating, reviewCount }: ProductReviewsProps) {
  const reviews = generateMockReviews(productId, rating, reviewCount);
  const [visibleCount, setVisibleCount] = useState(4);
  const [helpedIds, setHelpedIds] = useState<Set<string>>(new Set());

  const handleHelpful = (id: string) => {
    setHelpedIds(prev => new Set(prev).add(id));
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-xl text-foreground">
        Avaliações ({reviewCount})
      </h2>

      {/* Summary */}
      <div className="flex gap-8 p-5 rounded-xl bg-card border border-border">
        <div className="flex flex-col items-center justify-center gap-1 min-w-[100px]">
          <span className="text-4xl font-bold text-foreground">{rating.toFixed(1)}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(rating) ? 'fill-primary text-primary' : 'text-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{reviewCount} avaliações</span>
        </div>
        <div className="flex-1">
          <RatingDistribution rating={rating} count={reviewCount} />
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {reviews.slice(0, visibleCount).map(review => (
          <div key={review.id} className="p-4 rounded-xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  {review.avatar && <AvatarImage src={review.avatar} />}
                  <AvatarFallback className="text-xs">
                    {review.userName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{review.userName}</p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>

            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {review.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="Foto da avaliação"
                    className="w-20 h-20 rounded-lg object-cover border border-border flex-shrink-0"
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => handleHelpful(review.id)}
              disabled={helpedIds.has(review.id)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                helpedIds.has(review.id)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              Útil ({review.helpful + (helpedIds.has(review.id) ? 1 : 0)})
            </button>
          </div>
        ))}
      </div>

      {visibleCount < reviews.length && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setVisibleCount(prev => prev + 4)}
        >
          <ChevronDown className="w-4 h-4" />
          Ver mais avaliações
        </Button>
      )}
    </div>
  );
}
