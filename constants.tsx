
import React from 'react';
import { GameType, RankingItem, UserAction, UpdateLog, Card, Store, Product, ProductType, Order, Ticket } from './types';

export const GAMES = [
  { type: GameType.VANGUARD, icon: 'fa-sword' },
  { type: GameType.DIGIMON, icon: 'fa-dragon' },
  { type: GameType.LORCANA, icon: 'fa-wand-magic-sparkles' },
  { type: GameType.DRAGON_BALL, icon: 'fa-circle-dot' },
  { type: GameType.MAGIC, icon: 'fa-wand-sparkles' },
  { type: GameType.ONE_PIECE, icon: 'fa-anchor' },
  { type: GameType.POKEMON, icon: 'fa-bolt' },
  { type: GameType.YU_GI_OH, icon: 'fa-cards' },
  { type: GameType.GUNDAM, icon: 'fa-robot' },
];

export const MOCK_CARDS: Card[] = Array.from({ length: 20 }, (_, i) => ({
  id: `op-${i}`,
  code: `EB01-00${i + 5}`,
  name: i % 2 === 0 ? "Just Shut Up and Come with Us!!!!" : "Cavendish",
  imageUrl: `https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&q=80&w=300`,
  game: GameType.ONE_PIECE,
  set: "PREMIUM BOOSTER -ONE PIECE CARD THE BEST vol.2-",
  variants: 1,
  price: Math.floor(Math.random() * 50) + 10,
}));

export const MOCK_PRODUCTS: Product[] = [
  // INGRESSOS (TICKETS)
  {
    id: 't-1', slug: 'regional-op-sp', name: 'Regional One Piece SP - 2026', type: ProductType.TICKET,
    price: 150.00, imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600',
    storeName: 'Beco da Capivara', storeId: 's1', isOfficialPartner: true, game: GameType.ONE_PIECE, stock: 32
  },
  {
    id: 't-2', slug: 'store-champ-digi', name: 'Store Championship Digimon - BT17', type: ProductType.TICKET,
    price: 45.00, imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=600',
    storeName: 'Matrona TCG', storeId: 's2', isOfficialPartner: true, game: GameType.DIGIMON, stock: 16
  },
  {
    id: 't-3', slug: 'prerelease-pokemon', name: 'Prerelease Pokémon: Stellar Crown', type: ProductType.TICKET,
    price: 120.00, imageUrl: 'https://images.unsplash.com/photo-1601987077677-5346c0c57d3f?auto=format&fit=crop&q=80&w=600',
    storeName: 'NewStation Sorocaba', storeId: 's3', isOfficialPartner: true, game: GameType.POKEMON, stock: 24
  },
  // PRODUTOS REGULARES
  {
    id: 'p-st1-1', slug: 'st1-gaia-red', name: 'GAIA RED [ST-1]', type: ProductType.STARTER_DECK,
    price: 85.00, imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=400',
    storeName: 'Matrona TCG', storeId: 's2', storeHandle: '@matronatcg', storeLogo: 'https://picsum.photos/seed/matrona/50/50',
    isOfficialPartner: true, game: GameType.DIGIMON, stock: 5
  },
  {
    id: 'p-st1-2', slug: 'st1-gaia-red', name: 'GAIA RED [ST-1]', type: ProductType.STARTER_DECK,
    price: 89.90, imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=400',
    storeName: 'Beco da Capivara', storeId: 's1', storeHandle: '@becodacapivara', storeLogo: 'https://picsum.photos/seed/beco/50/50',
    isOfficialPartner: false, game: GameType.DIGIMON, stock: 2
  },
  {
    id: 'p-st2-1', slug: 'st2-cocytus-blue', name: 'COCYTUS BLUE [ST-2]', type: ProductType.STARTER_DECK,
    price: 82.00, imageUrl: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&q=80&w=400',
    storeName: 'NewStation Sorocaba', storeId: 's3', storeHandle: '@newstationso', storeLogo: 'https://picsum.photos/seed/ns/50/50',
    isOfficialPartner: true, game: GameType.DIGIMON, stock: 10
  },
  {
    id: 'p-st3-1', slug: 'st3-heavens-yellow', name: "HEAVEN'S YELLOW [ST-3]", type: ProductType.STARTER_DECK,
    price: 85.00, imageUrl: 'https://images.unsplash.com/photo-1523875194681-bedd468c58bf?auto=format&fit=crop&q=80&w=400',
    storeName: 'Matrona TCG', storeId: 's2', isOfficialPartner: true, game: GameType.DIGIMON, stock: 4
  },
  {
    id: 'p-pb01-1', slug: 'pb01-tamer-box', name: "TAMER'S EVOLUTION BOX [PB-01]", type: ProductType.PREMIUM_BANDAI,
    price: 580.00, imageUrl: 'https://images.unsplash.com/photo-1601987077677-5346c0c57d3f?auto=format&fit=crop&q=80&w=400',
    storeName: 'Loja do Caos', storeId: 's4', storeHandle: '@lojadocaos', storeLogo: 'https://picsum.photos/seed/caos/50/50',
    isOfficialPartner: false, game: GameType.DIGIMON, stock: 2
  },
  {
    id: 'p-eb03-1', slug: 'eb03-one-piece', name: 'EXTRA BOOSTER -ONE PIECE HEROINES EDITION- [EB-03]', type: ProductType.BOOSTER,
    price: 1.00, imageUrl: 'https://images.unsplash.com/photo-1620332372374-f108c53d2e03?auto=format&fit=crop&q=80&w=400',
    storeName: 'NewStation Sorocaba', storeId: 's3', storeHandle: '@newstationso', storeLogo: 'https://picsum.photos/seed/ns/50/50',
    isOfficialPartner: true, game: GameType.ONE_PIECE, stock: 1
  },
  {
    id: 'p-eb03-2', slug: 'eb03-one-piece', name: 'EXTRA BOOSTER -ONE PIECE HEROINES EDITION- [EB-03]', type: ProductType.BOOSTER,
    price: 580.00, imageUrl: 'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&q=80&w=400',
    storeName: 'Loja do Caos', storeId: 's4', storeHandle: '@lojadocaos', storeLogo: 'https://picsum.photos/seed/caos/50/50',
    isOfficialPartner: false, game: GameType.ONE_PIECE, stock: 2
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2026-X1',
    date: '10/01/2026',
    status: 'Enviado',
    total: 515.00,
    shippingCost: 25.00,
    storeName: 'NewStation Sorocaba',
    paymentMethod: 'Mercado Pago',
    couponUsed: 'BEMVINDO20',
    comments: [
      { user: 'viped', text: 'Por favor, envie bem protegido com plástico bolha!', timestamp: '10/01/2026 14:30' },
      { user: 'NewStation Sorocaba', text: 'Pode deixar! Enviaremos com cuidado extra.', timestamp: '10/01/2026 16:00', isAdmin: true }
    ],
    items: [
      { name: 'Booster Box One Piece OP-05', quantity: 1, price: 450.00 },
      { name: 'Dragon Shield Sleeves', quantity: 1, price: 65.00 }
    ]
  },
  {
    id: 'ORD-2026-Y2',
    date: '12/01/2026',
    status: 'Pendente',
    total: 103.90,
    shippingCost: 18.90,
    storeName: 'Matrona TCG',
    paymentMethod: 'Pix Direto',
    couponUsed: null,
    comments: [],
    items: [
      { name: 'GAIA RED [ST-1]', quantity: 1, price: 85.00 }
    ]
  }
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TCK-9921',
    eventName: 'Regional Pokémon 2026',
    date: '15/02/2026 - 10:00',
    location: 'Centro de Convenções SP',
    qrCode: 'CARDUMY-TCK-9921',
    status: 'Válido'
  }
];

export const MOCK_RANKING: RankingItem[] = [
  { name: 'Tiago Santos', cards: 51, rank: 1, avatar: 'https://i.pravatar.cc/150?u=tiago', isTop: true },
  { name: 'Ronaldo Filho', cards: 44, rank: 2, avatar: 'https://i.pravatar.cc/150?u=ronaldo' },
  { name: 'Matheus Oliveira', cards: 30, rank: 3, avatar: 'https://i.pravatar.cc/150?u=matheus' },
  { name: 'João Cassiano', cards: 17, rank: 4, avatar: 'https://i.pravatar.cc/150?u=joao' },
  { name: 'Laura Romarino', cards: 6, rank: 5, avatar: 'https://i.pravatar.cc/150?u=laura' },
];

export const MOCK_UPDATES: UpdateLog[] = [
  { date: '2026-01-06', changes: ['Corrigida quantidade ao adicionar carta na pasta'] },
  { date: '2026-01-02', changes: ['Correções no layout da busca', 'Melhorias no deckbuilder'] },
];

export const MOCK_ACTIONS: UserAction[] = [
  { user: 'viped', action: 'adicionou a carta', target: 'ST12-12', timestamp: '06/01/2026 10:18' },
  { user: 'MrGabr', action: 'seguiu o usuário', target: 'viped', timestamp: '04/01/2026 20:08' },
];

export const MOCK_STORES: Store[] = [
  {
    id: 's1',
    name: 'Beco da Capivara',
    location: 'São Paulo - SP',
    logo: 'https://picsum.photos/seed/beco/100/100',
    isPartner: true,
    whatsapp: '11915121742',
    email: 'becodacapivara@outlook.com',
    schedule: [
      { game: GameType.POKEMON, day: 'Segunda', time: '20:00' },
      { game: GameType.GUNDAM, day: 'Terça', time: '20:00' },
      { game: GameType.ONE_PIECE, day: 'Quinta', time: '20:00' },
    ],
    events: [
      {
        id: 'e1-1',
        name: 'Pré-lançamento: Pillars of Strength',
        date: '20/10/2025',
        price: 150,
        totalSpots: 32,
        filledSpots: 28,
        type: 'Prerelease',
        game: GameType.ONE_PIECE,
        description: 'Garanta sua vaga para o evento mais esperado do mês. Brindes exclusivos para os 16 primeiros inscritos!',
        isHighlighted: true,
        imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=300'
      },
      {
        id: 'e1-2',
        name: 'Regional Qualifier One Piece',
        date: '25/10/2025',
        price: 150,
        totalSpots: 32,
        filledSpots: 28,
        type: 'Tournament',
        game: GameType.ONE_PIECE
      },
      {
        id: 'e1-3',
        name: 'Store Championship Digimon',
        date: '02/11/2025',
        price: 40,
        totalSpots: 16,
        filledSpots: 4,
        type: 'Tournament',
        game: GameType.DIGIMON
      }
    ]
  },
  {
    id: 's2',
    name: 'Matrona TCG',
    location: 'São Paulo - SP',
    logo: 'https://picsum.photos/seed/matrona/100/100',
    isPartner: true,
    whatsapp: '11991689441',
    email: 'contato@matronatcg.com.br',
    schedule: [
      { game: GameType.RIFTBOUND, day: 'Domingo', time: '19:00', fee: 'R$ 5.00' },
      { game: GameType.DIGIMON, day: 'Sexta', time: '15:30' },
      { game: GameType.MAGIC, day: 'Sexta', time: '20:00' },
    ],
    events: [
      {
        id: 'e2-1',
        name: 'Magic Open Day',
        date: '15/10/2025',
        price: 0,
        totalSpots: 50,
        filledSpots: 12,
        type: 'Special',
        game: GameType.MAGIC,
        description: 'Venha aprender a jogar Magic e ganhe um deck de boas-vindas!',
        isHighlighted: true,
        imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=300'
      }
    ]
  }
];
