
import React from 'react';
import { GameType, RankingItem, UserAction, UpdateLog, Card, Store, Product, ProductType, Order, Ticket } from './types';

export const GAMES = [
  { type: GameType.DIGIMON, icon: 'fa-dragon' },
  { type: GameType.DRAGON_BALL, icon: 'fa-circle-dot' },
  { type: GameType.ONE_PIECE, icon: 'fa-anchor' },
  { type: GameType.MAGIC, icon: 'fa-wand-sparkles' },
  { type: GameType.POKEMON, icon: 'fa-bolt' },
  { type: GameType.YU_GI_OH, icon: 'fa-cards' },
  { type: GameType.GUNDAM, icon: 'fa-robot' },
  { type: GameType.RIFTBOUND, icon: 'fa-mountain' },
  { type: GameType.SORCERY, icon: 'fa-hat-wizard' },
];

export const MOCK_CARDS: Card[] = Array.from({ length: 20 }, (_, i) => ({
  id: `op-${i}`,
  code: `EB01-00${i + 5}`,
  name: i % 2 === 0 ? "Just Shut Up and Come with Us!!!!" : "Cavendish",
  imageUrl: `https://picsum.photos/seed/${i + 50}/300/420`,
  game: GameType.ONE_PIECE,
  set: "PREMIUM BOOSTER -ONE PIECE CARD THE BEST vol.2-",
  variants: 1,
  price: Math.floor(Math.random() * 50) + 10,
}));

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Booster Box One Piece OP-05',
    type: ProductType.SEALED,
    price: 450.00,
    imageUrl: 'https://picsum.photos/seed/op05/300/300',
    storeName: 'Matrona TCG',
    storeId: 's2',
    isOfficialPartner: true,
    game: GameType.ONE_PIECE
  },
  {
    id: 'p2',
    name: 'Ingresso: Regional Pokémon 2026',
    type: ProductType.TICKET,
    price: 120.00,
    imageUrl: 'https://picsum.photos/seed/pketicket/300/300',
    storeName: 'Beco da Capivara',
    storeId: 's1',
    isOfficialPartner: false,
    game: GameType.POKEMON
  },
  {
    id: 'p3',
    name: 'Playmat Customizado Cardumy',
    type: ProductType.ACCESSORY,
    price: 89.90,
    originalPrice: 115.00,
    imageUrl: 'https://picsum.photos/seed/playmat/300/300',
    storeName: 'Matrona TCG',
    storeId: 's2',
    isOfficialPartner: true
  },
  {
    id: 'p4',
    name: 'Dragon Shield Sleeves (Black)',
    type: ProductType.ACCESSORY,
    price: 65.00,
    imageUrl: 'https://picsum.photos/seed/sleeves/300/300',
    storeName: 'Beco da Capivara',
    storeId: 's1',
    isOfficialPartner: false
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2026-X1',
    date: '10/01/2026',
    status: 'Enviado',
    total: 515.00,
    items: [
      { name: 'Booster Box One Piece OP-05', quantity: 1, price: 450.00 },
      { name: 'Dragon Shield Sleeves', quantity: 1, price: 65.00 }
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
    isPartner: false,
    whatsapp: '11915121742',
    email: 'becodacapivara@outlook.com',
    schedule: [
      { game: GameType.POKEMON, day: 'Segunda', time: '20:00' },
      { game: GameType.GUNDAM, day: 'Terça', time: '20:00' },
      { game: GameType.ONE_PIECE, day: 'Quinta', time: '20:00' },
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
    ]
  }
];
