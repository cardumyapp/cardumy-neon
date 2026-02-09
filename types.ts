
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
  LORCANA = 'Disney Lorcana'
}

export enum ProductType {
  CARD = 'Carta Avulsa',
  SEALED = 'Produto Selado',
  ACCESSORY = 'Acessório',
  TICKET = 'Ingresso',
  PROMO = 'Promoção'
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  storeName: string;
  storeId: string;
  isOfficialPartner: boolean;
  game?: GameType;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  status: 'Pendente' | 'Enviado' | 'Entregue' | 'Cancelado';
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
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
