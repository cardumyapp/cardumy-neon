
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
  price: number;
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
  variants?: number;
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
}

export interface UpdateLog {
  date: string;
  changes: string[];
}

export interface UserAction {
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface RankingItem {
  name: string;
  cards: number;
  rank: number;
  avatar: string;
  isTop?: boolean;
}
