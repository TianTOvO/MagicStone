// ============================================================
// Canonical type definitions for Magic Stone
// Property names match the smart contract interfaces
// ============================================================

// Stone types — matches StoneNFT.sol
export interface Stone {
  id: number;
  grade: number;       // 0: 平凡, 1: 奇特, 2: 珍稀, 3: 璀璨
  damage: number;
  damageLimit: number;
  mysterious: boolean;
  isPolishable?: boolean;
}

// Tool types — matches ToolNFT.sol
export interface Tool {
  id: number;
  level: number;       // 0: 普通, 1: 专业, 2: 顶级, 3: 传奇
  durability: number;
  durabilityMax: number;
  lossCoeff: number;           // 损耗影响系数
  durabilityConsumption: number; // 耐久消耗系数
}

// Quest types — matches Quest.sol
export interface Quest {
  id: number;
  type: string;         // '日常' | '成就' | '寻宝' | '团队'
  title: string;
  description?: string;
  progress: number;
  target: number;
  reward: number;
  claimed?: boolean;
  isPuzzle?: boolean;
}

// User data aggregate
export interface UserData {
  stones: Stone[];
  tools: Tool[];
  coins: number;
  quests: Quest[];
}

// Market types — matches Market.sol
export interface MarketListing {
  isStone: boolean;
  tokenId: number;
  seller: string;
  price: number;
}

export interface MarketOffer {
  isStone: boolean;
  tokenId: number;
  buyer: string;
  price: number;
  active: boolean;
}

// ============================================================
// Display name mappings
// ============================================================

export const STONE_GRADE_NAMES: Record<number, string> = {
  0: '平凡',
  1: '奇特',
  2: '珍稀',
  3: '璀璨',
};

export const TOOL_LEVEL_NAMES: Record<number, string> = {
  0: '普通',
  1: '专业',
  2: '顶级',
  3: '传奇',
};

export const STONE_GRADE_COLORS: Record<number, string> = {
  0: 'bg-gray-500',
  1: 'bg-blue-500',
  2: 'bg-purple-500',
  3: 'bg-amber-500',
};

export const TOOL_LEVEL_COLORS: Record<number, string> = {
  0: 'bg-gray-500',
  1: 'bg-green-500',
  2: 'bg-blue-500',
  3: 'bg-purple-500',
};

export const QUEST_TYPE_INFO: Record<string, { color: string; icon: string }> = {
  '日常':   { color: 'bg-blue-600',   icon: 'calendar-day' },
  '成就':   { color: 'bg-amber-600',  icon: 'trophy' },
  '寻宝':   { color: 'bg-purple-600', icon: 'map-marked-alt' },
  '团队':   { color: 'bg-green-600',  icon: 'users' },
};
