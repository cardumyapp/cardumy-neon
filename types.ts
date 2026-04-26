
export enum GameType {
  ONE_PIECE = 'One Piece',
  DIGIMON = 'Digimon',
  POKEMON = 'Pokémon',
  MAGIC = 'Magic',
  DRAGON_BALL = 'Dragon Ball',
  YU_GI_OH = 'Yu-Gi-Oh!',
  GUNDAM = 'Gundam',
  RIFTBOUND = 'Riftbound',
  SORCERY = 'Sorcery',
  LORCANA = 'Disney Lorcana',
  VANGUARD = 'Cardfight!! Vanguard',
  UNION_ARENA = 'Union Arena'
}

export enum ProductType {
  CARD = 'Carta Avulsa',
  SEALED = 'Produto Selado',
  ACCESSORY = 'Acessório',
  TICKET = 'Ingresso',
  PROMO = 'Promoção',
  STARTER_DECK = 'Starter Deck',
  BOOSTER = 'Booster Box',
  PREMIUM_BANDAI = 'Premium Bandai'
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  storeName: string;
  storeId: string;
  storeHandle?: string;
  storeLogo?: string;
  isOfficialPartner: boolean;
  game?: GameType;
  stock?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderComment {
  user: string;
  text: string;
  timestamp: string;
  isAdmin?: boolean;
}

export interface Order {
  id: string;
  date: string;
  status: 'Pendente' | 'Enviado' | 'Entregue' | 'Cancelado';
  total: number;
  shippingCost: number;
  storeName: string;
  paymentMethod: 'Mercado Pago' | 'Pix Direto' | 'A combinar com vendedor';
  couponUsed: string | null;
  comments: OrderComment[];
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface StoreEvent {
  id: string;
  name: string;
  date: string;
  price?: number;
  totalSpots: number;
  filledSpots: number;
  type: 'Tournament' | 'Prerelease' | 'Special';
  game: GameType;
  description?: string;
  imageUrl?: string;
  isHighlighted?: boolean;
}

export interface Ticket {
  id: string;
  eventName: string;
  date: string;
  location: string;
  qrCode: string;
  status: 'Válido' | 'Utilizado' | 'Expirado';
}

export interface Card {
  id: string;
  code: string;
  name: string;
  imageUrl: string;
  game: GameType;
  set: string;
  variants?: any[];
  rarity?: string;
  price?: number;
}

export interface DeckCard {
  card: Card;
  quantity: number;
}

export interface Deck {
  id: string;
  name: string;
  game: GameType;
  format: string;
  cards: {
    main: DeckCard[];
    extra?: DeckCard[];
    eggs?: DeckCard[];
  };
}

export interface Store {
  id: string;
  name: string;
  location: string;
  logo: string;
  isPartner: boolean;
  whatsapp: string;
  email: string;
  schedule: Array<{
    game: GameType;
    day: string;
    time: string;
    fee?: string;
  }>;
  events?: StoreEvent[];
  instagram?: string;
  discord?: string;
  site?: string;
  about?: string;
  opening_hours?: string;
  slug?: string;
}

export interface UpdateLog {
  date: string;
  changes: string[];
}

export interface UserAction {
  user: string;
  userId?: string;
  action: string;
  target: string;
  timestamp: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface Trade {
  id: string;
  partner: {
    name: string;
    avatar: string;
  };
  status: 'Pendente' | 'Aceito' | 'Recusado' | 'Concluído';
  offering: Card[];
  requesting: Card[];
  timestamp: string;
}

export interface Tournament {
  id: string;
  name: string;
  game: GameType;
  date: string;
  location: string;
  price?: number;
  totalSpots: number;
  filledSpots: number;
  status: 'Aberto' | 'Em Andamento' | 'Finalizado';
  imageUrl: string;
}

export interface RankingItem {
  name: string;
  userId?: string;
  cards: number;
  rank: number;
  avatar: string;
  isTop?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  codename: string;
  avatar?: string;
  photoURL?: string;
  bio?: string;
  phone?: string;
  birth_date?: string;
  favorite_game?: string;
  fighter_tags?: string[];
  cover_url?: string;
  role?: string;
}

export const FIGHTER_TAGS = [
  'Casual', 'Competitivo', 'Colecionador', 'Trabalhador', 'Juiz', 
  'Streamer', 'Vendedor', 'Pro Player', 'Batedor de Bafo', 'Mestre de Deck'
];

export const PREDEFINED_AVATARS = [
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=victoria',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=felix',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=leo',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=simon',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=lara',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=alex',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=jake',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=ruby'
];

export const PREDEFINED_COVERS = [
  'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1606103920295-9a091573f160?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&q=80&w=1200'
];

export const TCG_GAMES = [
  'One Piece TCG',
  'Digimon Card Game',
  'Pokémon TCG',
  'Yu-Gi-Oh!',
  'Magic: The Gathering',
  'Disney Lorcana',
  'Dragon Ball Super',
  'Cardfight!! Vanguard',
  'Union Arena',
  'Gundam Card Game'
];
