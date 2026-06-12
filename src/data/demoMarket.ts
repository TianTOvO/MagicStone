// Demo data for Market exchange — used when wallet is not connected
// Simulates listings, offers, and auctions for UI demonstration

export interface DemoListing {
  isStone: boolean;
  tokenId: number;
  seller: string;
  price: number;
  grade?: number;   // for stone
  subGrade?: number; // for stone
  level?: number;    // for tool
}

export interface DemoOffer {
  isStone: boolean;
  tokenId: number;
  buyer: string;
  price: number;
}

export interface DemoAuction {
  isStone: boolean;
  tokenId: number;
  seller: string;
  startPrice: number;
  minBidIncrement: number;
  endTime: number;
  highestBidder: string;
  highestBid: number;
  active: boolean;
  grade?: number;
  subGrade?: number;
  level?: number;
}

export function createDemoListings(): DemoListing[] {
  return [
    { isStone: true,  tokenId: 1,  seller: '0xAlice',  price: 300,  grade: 1 },
    { isStone: true,  tokenId: 2,  seller: '0xBob',    price: 800,  grade: 2 },
    { isStone: false, tokenId: 101, seller: '0xCarol',  price: 500,  level: 1 },
    { isStone: true,  tokenId: 3,  seller: '0xDave',   price: 200,  grade: 0 },
    { isStone: false, tokenId: 102, seller: '0xEve',    price: 1200, level: 2 },
    { isStone: true,  tokenId: 4,  seller: '0xFrank',  price: 2500, grade: 3 },
    { isStone: false, tokenId: 103, seller: '0xAlice',  price: 350,  level: 0 },
    { isStone: true,  tokenId: 5,  seller: '0xBob',    price: 1500, grade: 2 },
  ];
}

export function createDemoOffers(): DemoOffer[] {
  return [
    { isStone: true,  tokenId: 6,  buyer: '0xGeorge', price: 600 },
    { isStone: false, tokenId: 104, buyer: '0xGeorge', price: 800 },
    { isStone: true,  tokenId: 7,  buyer: '0xHelen',  price: 1200 },
  ];
}

export function createDemoAuctions(): DemoAuction[] {
  const now = Math.floor(Date.now() / 1000);
  return [
    {
      isStone: true, tokenId: 8, seller: '0xIvan',
      startPrice: 100, minBidIncrement: 25, endTime: now + 7200,
      highestBidder: '0xJack', highestBid: 200, active: true, grade: 2,
    },
    {
      isStone: false, tokenId: 105, seller: '0xKate',
      startPrice: 500, minBidIncrement: 50, endTime: now + 3600,
      highestBidder: '', highestBid: 0, active: true, level: 3,
    },
    {
      isStone: true, tokenId: 9, seller: '0xLeo',
      startPrice: 50, minBidIncrement: 10, endTime: now - 120,
      highestBidder: '0xMia', highestBid: 120, active: true, grade: 1,
    },
  ];
}

// Simulate a user's own inventory (for show in sell/auction modals)
export const DEMO_MY_STONES = [
  { id: 10, grade: 1, subGrade: 0, name: '玛瑙' },
  { id: 11, grade: 0, subGrade: 0, name: '原石' },
  { id: 12, grade: 2, subGrade: 3, name: '玻璃种翡翠' },
];

export const DEMO_MY_TOOLS = [
  { id: 201, level: 1, name: '专业工具' },
  { id: 202, level: 0, name: '普通工具' },
  { id: 203, level: 2, name: '顶级工具' },
];
