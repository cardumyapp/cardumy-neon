
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
  favorite_cardgame_id?: number | string;
  fighter_tags?: string | string[];
  banner_url?: string;
  cover_url?: string;
  gender?: string;
  role?: string;
}

export const FIGHTER_TAGS = [
  'Casual', 'Competitivo', 'Colecionador', 'Trabalhador', 'Juiz', 
  'Streamer', 'Vendedor', 'Pro Player', 'Batedor de Bafo', 'Mestre de Deck'
];

export const PREDEFINED_AVATARS = [
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762114474/woEyRVKRhWojYuIlGcOD--0--xtw18_z3vee9.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761957942/i6stfajJfAvGdB5sPGkz--0--x1tvd_tesfo4.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761957944/xlqPvNUixJYJkF41njQR--0--5kbnx_zytmy1.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761957939/k5szIZAg1U6ytSDL0aZl--0--skv9i_xfctmb.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762114462/6gcrLOypNE8I8WY428H0--0--0499y_hwig5i.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761955256/WEhyhhCcgFr5t9tnIUKL--0--kfsjq_cwdm7o.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761955251/JuHbjfGg9ALZJPyNa4gT--0--1w02j_dj7skr.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761955251/H1yFuolXAEMMJjNaDhuR--0--pses9_o5d7ys.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762114461/0ClkdZniiJKYLVaraamN--0--lb9kc_dnzsit.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762114473/tPpka7gY2urnt7ACmMcr--0--91ibu_xmsczn.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761957939/8pHkBGAKmXxMFWcYh93O--0--ocxw6_licxyn.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761957940/VSEzZGHz2M3Q12ZxviF9--0--mq6ar_zjjyal.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761955257/zg73BAw5HJbdB5mptokN--0--m5roy_ab9mdm.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761955250/1wPRZYN91F0MB4H6Gfyx--0--vi2hd_pw185x.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761955250/7ABBB46gTYjaYNK1KW7O--0--wc4j8_b6fogi.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762114467/M0KAWc0Ge3WgorGWxuBH--0--uusxj_hcf6j1.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761955250/D6acCxh3r3rg2fCBsWWg--0--cris9_txqed4.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762114476/wQdSHVgNZR0jQxtukfI8--0--xnu42_laqlwe.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762114471/RnABmUzz3lE2trQ3dO76--0--0mqpg_dz0xmq.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762115514/44ZmWWgbHVtMjQ81B3wr--0--tr1bl_swuqfk.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762115513/9o1gm2iHzGmwImTv9hNu--0--xwij1_wky6dl.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761955256/TfNST6mFd88uBdIrcQqd--0--6rary_rj6tcb.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762115516/dSvrMMd8gY5mm242bGcf--0--d9p8g_dmhhti.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1761955255/sT7vLvcVz7g90zbhZbkH--0--9xict_vvcrkv.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762114478/wqG1MaaSmRJX8wD55dM7--0--m7cyy_rbgkx4.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762114463/hHrUZ6ReF5vTaW1gBA5N--0--bvvqf_sdfx3o.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762114465/JWUC3Fr6OJza1JNbqlpn--0--un12g_n44j90.jpg",
  "https://res.cloudinary.com/dtlp9ayj1/image/upload/v1762114469/ODeZPRjqyECN0qRpJjZU--0--9ypju_muoohd.jpg"
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
