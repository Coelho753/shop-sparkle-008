export type UserRole = 'user' | 'admin' | 'distributor' | 'reseller';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
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
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Promotion {
  id: string;
  productId: string;
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export const mockCategories: Category[] = [
  { id: '1', name: 'Eletrônicos', slug: 'eletronicos' },
  { id: '2', name: 'Áudio', slug: 'audio' },
  { id: '3', name: 'Smartphones', slug: 'smartphones' },
  { id: '4', name: 'Acessórios', slug: 'acessorios' },
  { id: '5', name: 'Computadores', slug: 'computadores' },
  { id: '6', name: 'Games', slug: 'games' },
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Fone Bluetooth Pro Max',
    description: 'Fone de ouvido sem fio com cancelamento de ruído ativo',
    price: 199.90,
    originalPrice: 349.90,
    category: 'Áudio',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'],
    rating: 4.5,
    reviewCount: 234,
    stock: 50,
    active: true,
    hasPromo: true,
    promoLabel: '-43%',
  },
  {
    id: '2',
    name: 'Smart Watch Ultra',
    description: 'Relógio inteligente com GPS e monitor cardíaco',
    price: 599.90,
    originalPrice: 899.90,
    category: 'Eletrônicos',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'],
    rating: 4.8,
    reviewCount: 189,
    stock: 30,
    active: true,
    hasPromo: true,
    promoLabel: '-33%',
  },
  {
    id: '3',
    name: 'Câmera 360° HD',
    description: 'Câmera panorâmica com resolução 4K',
    price: 450.00,
    category: 'Eletrônicos',
    images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop'],
    rating: 4.2,
    reviewCount: 78,
    stock: 15,
    active: true,
    hasPromo: false,
  },
  {
    id: '4',
    name: 'Caixa de Som Portátil',
    description: 'Speaker bluetooth à prova d\'água com 20h de bateria',
    price: 289.90,
    originalPrice: 399.90,
    category: 'Áudio',
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop'],
    rating: 4.6,
    reviewCount: 312,
    stock: 80,
    active: true,
    hasPromo: true,
    promoLabel: '-28%',
  },
  {
    id: '5',
    name: 'Tablet Pro 11"',
    description: 'Tablet com tela AMOLED e caneta stylus inclusa',
    price: 2499.90,
    originalPrice: 3199.90,
    category: 'Computadores',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop'],
    rating: 4.7,
    reviewCount: 156,
    stock: 20,
    active: true,
    hasPromo: true,
    promoLabel: '-22%',
  },
  {
    id: '6',
    name: 'Controle Gamer Elite',
    description: 'Controle sem fio com vibração háptica avançada',
    price: 349.90,
    category: 'Games',
    images: ['https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=400&h=400&fit=crop'],
    rating: 4.4,
    reviewCount: 98,
    stock: 45,
    active: true,
    hasPromo: false,
  },
  {
    id: '7',
    name: 'Smartphone X Pro',
    description: 'Celular flagship com câmera de 108MP',
    price: 3999.90,
    originalPrice: 4999.90,
    category: 'Smartphones',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop'],
    rating: 4.9,
    reviewCount: 445,
    stock: 25,
    active: true,
    hasPromo: true,
    promoLabel: '-20%',
  },
  {
    id: '8',
    name: 'Mouse Ergonômico Wireless',
    description: 'Mouse sem fio com design ergonômico e sensor óptico',
    price: 159.90,
    category: 'Acessórios',
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop'],
    rating: 4.3,
    reviewCount: 67,
    stock: 100,
    active: true,
    hasPromo: false,
  },
  {
    id: '9',
    name: 'Notebook Ultrabook 14"',
    description: 'Notebook leve com processador de última geração',
    price: 4299.90,
    originalPrice: 5499.90,
    category: 'Computadores',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop'],
    rating: 4.6,
    reviewCount: 203,
    stock: 12,
    active: true,
    hasPromo: true,
    promoLabel: '-22%',
  },
  {
    id: '10',
    name: 'Earbuds Sport',
    description: 'Fone in-ear esportivo com encaixe perfeito',
    price: 129.90,
    originalPrice: 199.90,
    category: 'Áudio',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop'],
    rating: 4.1,
    reviewCount: 145,
    stock: 200,
    active: true,
    hasPromo: true,
    promoLabel: '-35%',
  },
  {
    id: '11',
    name: 'Webcam Full HD',
    description: 'Webcam com microfone integrado e foco automático',
    price: 249.90,
    category: 'Acessórios',
    images: ['https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400&h=400&fit=crop'],
    rating: 4.0,
    reviewCount: 42,
    stock: 60,
    active: true,
    hasPromo: false,
  },
  {
    id: '12',
    name: 'Teclado Mecânico RGB',
    description: 'Teclado mecânico com switches blue e iluminação RGB',
    price: 399.90,
    originalPrice: 549.90,
    category: 'Acessórios',
    images: ['https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop'],
    rating: 4.7,
    reviewCount: 178,
    stock: 35,
    active: true,
    hasPromo: true,
    promoLabel: '-27%',
  },
];

export const mockUser: User = {
  id: '1',
  name: 'João Silva',
  email: 'joao@email.com',
  role: 'admin',
};
