
import React from 'react';
import { GameType, RankingItem, UserAction, UpdateLog, Card, Store, Product, ProductType, Order, Ticket, Notification, Trade, Tournament } from './types';

export const MOCK_CARDS: Card[] = Array.from({ length: 20 }, (_, i) => ({
  id: `op-${i}`,
  code: `EB01-00${i + 5}`,
  name: i % 2 === 0 ? "Just Shut Up and Come with Us!!!!" : "Cavendish",
  imageUrl: `https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&q=80&w=300`,
  game: 'One Piece',
  set: "PREMIUM BOOSTER -ONE PIECE CARD THE BEST vol.2-",
  variants: [],
  price: Math.floor(Math.random() * 50) + 10,
}));

export const MOCK_PRODUCTS: Product[] = [
  // INGRESSOS (TICKETS)
  {
    id: 't-1', slug: 'regional-op-sp', name: 'Regional One Piece SP - 2026', type: ProductType.TICKET,
    price: 150.00, imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600',
    storeName: 'Beco da Capivara', storeId: 's1', isOfficialPartner: true, game: 'One Piece', stock: 32
  },
  {
    id: 't-2', slug: 'store-champ-digi', name: 'Store Championship Digimon - BT17', type: ProductType.TICKET,
    price: 45.00, imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=600',
    storeName: 'Matrona TCG', storeId: 's2', isOfficialPartner: true, game: 'Digimon', stock: 16
  },
  {
    id: 't-3', slug: 'prerelease-pokemon', name: 'Prerelease Pokémon: Stellar Crown', type: ProductType.TICKET,
    price: 120.00, imageUrl: 'https://images.unsplash.com/photo-1601987077677-5346c0c57d3f?auto=format&fit=crop&q=80&w=600',
    storeName: 'NewStation Sorocaba', storeId: 's3', isOfficialPartner: true, game: 'Pokémon', stock: 24
  },
  {
    id: 't-4', slug: 'fnm-magic-standard', name: 'Friday Night Magic - Standard Showdown', type: ProductType.TICKET,
    price: 35.00, imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=600',
    storeName: 'Matrona TCG', storeId: 's2', isOfficialPartner: true, game: 'Magic', stock: 40
  },
  {
    id: 't-5', slug: 'ots-yugioh-championship', name: 'OTS Championship Yu-Gi-Oh! - Qualificatório', type: ProductType.TICKET,
    price: 60.00, imageUrl: 'https://images.unsplash.com/photo-1620332372374-f108c53d2e03?auto=format&fit=crop&q=80&w=600',
    storeName: 'Loja do Caos', storeId: 's4', isOfficialPartner: false, game: 'Yu-Gi-Oh!', stock: 20
  },
  {
    id: 't-6', slug: 'lorcana-intro-event', name: 'Disney Lorcana: Illumineer\'s Quest - Intro', type: ProductType.TICKET,
    price: 80.00, imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600',
    storeName: 'Beco da Capivara', storeId: 's1', isOfficialPartner: true, game: 'Disney Lorcana', stock: 12
  },
  // PRODUTOS REGULARES
  {
    id: 'p-st1-1', slug: 'st1-gaia-red', name: 'GAIA RED [ST-1]', type: ProductType.STARTER_DECK,
    price: 85.00, imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=400',
    storeName: 'Matrona TCG', storeId: 's2', storeHandle: '@matronatcg', storeLogo: 'https://picsum.photos/seed/matrona/50/50',
    isOfficialPartner: true, game: 'Digimon', stock: 5
  },
  {
    id: 'p-st1-2', slug: 'st1-gaia-red', name: 'GAIA RED [ST-1]', type: ProductType.STARTER_DECK,
    price: 89.90, imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=400',
    storeName: 'Beco da Capivara', storeId: 's1', storeHandle: '@becodacapivara', storeLogo: 'https://picsum.photos/seed/beco/50/50',
    isOfficialPartner: false, game: 'Digimon', stock: 2
  },
  {
    id: 'p-st2-1', slug: 'st2-cocytus-blue', name: 'COCYTUS BLUE [ST-2]', type: ProductType.STARTER_DECK,
    price: 82.00, imageUrl: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&q=80&w=400',
    storeName: 'NewStation Sorocaba', storeId: 's3', storeHandle: '@newstationso', storeLogo: 'https://picsum.photos/seed/ns/50/50',
    isOfficialPartner: true, game: 'Digimon', stock: 10
  },
  {
    id: 'p-st3-1', slug: 'st3-heavens-yellow', name: "HEAVEN'S YELLOW [ST-3]", type: ProductType.STARTER_DECK,
    price: 85.00, imageUrl: 'https://images.unsplash.com/photo-1523875194681-bedd468c58bf?auto=format&fit=crop&q=80&w=400',
    storeName: 'Matrona TCG', storeId: 's2', isOfficialPartner: true, game: 'Digimon', stock: 4
  },
  {
    id: 'p-pb01-1', slug: 'pb01-tamer-box', name: "TAMER'S EVOLUTION BOX [PB-01]", type: ProductType.PREMIUM_BANDAI,
    price: 580.00, imageUrl: 'https://images.unsplash.com/photo-1601987077677-5346c0c57d3f?auto=format&fit=crop&q=80&w=400',
    storeName: 'Loja do Caos', storeId: 's4', storeHandle: '@lojadocaos', storeLogo: 'https://picsum.photos/seed/caos/50/50',
    isOfficialPartner: false, game: 'Digimon', stock: 2
  },
  {
    id: 'p-eb03-1', slug: 'eb03-one-piece', name: 'EXTRA BOOSTER -ONE PIECE HEROINES EDITION- [EB-03]', type: ProductType.BOOSTER,
    price: 1.00, imageUrl: 'https://images.unsplash.com/photo-1620332372374-f108c53d2e03?auto=format&fit=crop&q=80&w=400',
    storeName: 'NewStation Sorocaba', storeId: 's3', storeHandle: '@newstationso', storeLogo: 'https://picsum.photos/seed/ns/50/50',
    isOfficialPartner: true, game: 'One Piece', stock: 1
  },
  {
    id: 'p-eb03-2', slug: 'eb03-one-piece', name: 'EXTRA BOOSTER -ONE PIECE HEROINES EDITION- [EB-03]', type: ProductType.BOOSTER,
    price: 580.00, imageUrl: 'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&q=80&w=400',
    storeName: 'Loja do Caos', storeId: 's4', storeHandle: '@lojadocaos', storeLogo: 'https://picsum.photos/seed/caos/50/50',
    isOfficialPartner: false, game: 'One Piece', stock: 2
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
  { name: 'Victoria Pedretti', cards: 1248, rank: 1, avatar: 'https://i.pravatar.cc/150?u=victoria', isTop: true, userId: '89' },
  { name: 'Matrona TCG', cards: 850, rank: 2, avatar: 'https://i.pravatar.cc/150?u=matrona', userId: '90' },
  { name: 'Caos Gamer', cards: 720, rank: 3, avatar: 'https://i.pravatar.cc/150?u=caos', userId: '91' },
  { name: 'Luffy King', cards: 540, rank: 4, avatar: 'https://i.pravatar.cc/150?u=luffy', userId: '92' },
  { name: 'Zoro Master', cards: 430, rank: 5, avatar: 'https://i.pravatar.cc/150?u=zoro', userId: '93' },
];

export const MOCK_UPDATES: UpdateLog[] = [
  { date: '2026-01-06', changes: ['Corrigida quantidade ao adicionar carta na pasta'] },
  { date: '2026-01-02', changes: ['Correções no layout da busca', 'Melhorias no deckbuilder'] },
];

export const MOCK_ACTIONS: UserAction[] = [
  { user: 'Victoria Pedretti', action: 'adicionou a carta', target: 'ST12-12', timestamp: '06/01/2026 10:18', avatar: 'https://i.pravatar.cc/150?u=victoria', userId: '1' },
  { user: 'Matrona TCG', action: 'seguiu o usuário', target: 'Victoria Pedretti', timestamp: '04/01/2026 20:08', avatar: 'https://i.pravatar.cc/150?u=matrona', userId: '2' },
  { user: 'Caos Gamer', action: 'criou o deck', target: 'Zoro Aggro', timestamp: '03/01/2026 15:45', avatar: 'https://i.pravatar.cc/150?u=caos', userId: '3' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Nova Proposta de Troca', message: 'MrGabr enviou uma proposta de troca para você.', type: 'info', timestamp: '10/01/2026 14:30', read: false },
  { id: '2', title: 'Pedido Enviado', message: 'Seu pedido ORD-2026-X1 foi enviado pela loja.', type: 'success', timestamp: '09/01/2026 16:00', read: true },
];

export const MOCK_TRADES: Trade[] = [
  {
    id: 'TRD-001',
    partner: { name: 'MrGabr', avatar: 'https://i.pravatar.cc/150?u=MrGabr' },
    status: 'Pendente',
    offering: [MOCK_CARDS[0], MOCK_CARDS[1]],
    requesting: [MOCK_CARDS[2]],
    timestamp: '12/01/2026 10:00'
  }
];

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 'tourney-1',
    name: 'Regional One Piece SP',
    game: 'One Piece',
    date: '15/02/2026',
    location: 'Centro de Convenções SP',
    price: 150,
    totalSpots: 128,
    filledSpots: 96,
    status: 'Aberto',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'tourney-2',
    name: 'Store Championship Digimon',
    game: 'Digimon',
    date: '20/02/2026',
    location: 'Matrona TCG',
    price: 45,
    totalSpots: 32,
    filledSpots: 16,
    status: 'Aberto',
    imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=600'
  }
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
      { game: 'Pokémon', day: 'Segunda', time: '20:00' },
      { game: 'Gundam', day: 'Terça', time: '20:00' },
      { game: 'One Piece', day: 'Quinta', time: '20:00' },
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
        game: 'One Piece',
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
        game: 'One Piece'
      },
      {
        id: 'e1-3',
        name: 'Store Championship Digimon',
        date: '02/11/2025',
        price: 40,
        totalSpots: 16,
        filledSpots: 4,
        type: 'Tournament',
        game: 'Digimon'
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
      { game: 'Riftbound', day: 'Domingo', time: '19:00', fee: 'R$ 5.00' },
      { game: 'Digimon', day: 'Sexta', time: '15:30' },
      { game: 'Magic', day: 'Sexta', time: '20:00' },
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
        game: 'Magic',
        description: 'Venha aprender a jogar Magic e ganhe um deck de boas-vindas!',
        isHighlighted: true,
        imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=300'
      }
    ]
  }
];
