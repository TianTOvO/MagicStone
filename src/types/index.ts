// ============================================================
// Canonical type definitions for Magic Stone
// Property names match the smart contract interfaces
// ============================================================

// Stone types — matches StoneNFT.sol
export interface Stone {
  id: number;
  grade: number;       // 0: 原石, 1: 玛瑙, 2: 翡翠, 3: 钻石
  subGrade: number;    // 0: none, 1-4: 子等级（仅 grade>=2 有效）
  damage: number;
  damageLimit: number;
  mysterious: boolean;
  isPolishable?: boolean;
  acquiredAt?: number; // Unix timestamp of when this stone was obtained
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

export interface AuctionInfo {
  isStone: boolean;
  tokenId: number;
  seller: string;
  startPrice: number;
  minBidIncrement: number;
  endTime: number;
  highestBidder: string;
  highestBid: number;
  active: boolean;
}

// ============================================================
// Display name mappings
// ============================================================

/** 大等级名称 */
export const STONE_GRADE_NAMES: Record<number, string> = {
  0: '原石',
  1: '玛瑙',
  2: '翡翠',
  3: '钻石',
};

/** 子等级名称（key 为大等级） */
export const STONE_SUBGRADE_NAMES: Record<number, Record<number, string>> = {
  2: {
    1: '糯种翡翠',
    2: '冰种翡翠',
    3: '玻璃种翡翠',
    4: '帝王绿翡翠',
  },
  3: {
    1: '普通钻石',
    2: '蓝钻',
    3: '粉钻',
    4: '非洲之心',
  },
};

/** 等级颜色 */
export const STONE_GRADE_COLORS: Record<number, string> = {
  0: 'bg-stone-500',
  1: 'bg-orange-500',
  2: 'bg-emerald-500',
  3: 'bg-cyan-400',
};

/** 等级文字颜色（用于标签等） */
export const STONE_GRADE_TEXT_COLORS: Record<number, string> = {
  0: 'text-stone-600',
  1: 'text-orange-600',
  2: 'text-emerald-600',
  3: 'text-cyan-600',
};

/** 等级边框颜色 */
export const STONE_GRADE_BORDER_COLORS: Record<number, string> = {
  0: 'border-stone-400',
  1: 'border-orange-400',
  2: 'border-emerald-400',
  3: 'border-cyan-400',
};

/** 矿石描述 */
export const STONE_DESCRIPTIONS: Record<number, Record<number, string>> = {
  0: {
    0: '未经打磨的原始矿石，一切奇迹的起点',
  },
  1: {
    0: '纹理温润的半宝石，打磨初见成效',
  },
  2: {
    1: '质地温润如糯米汤，半透明，入门级翡翠',
    2: '透明度高如冰块，清亮水头足',
    3: '完全透明如玻璃，极为纯净',
    4: '浓郁正阳绿，翡翠之王，拍卖级珍品',
  },
  3: {
    1: '标准无色钻石，璀璨夺目',
    2: '含硼元素呈蓝色，极度稀有',
    3: '阿盖尔矿传奇，粉色钻石中的梦幻之选',
    4: '库里南一号，530克拉，英国皇室权杖，钻石终极象征',
  },
};

/** 获取矿石完整显示名称 */
export function getStoneDisplayName(grade: number, subGrade: number): string {
  if (grade < 2 && subGrade === 0) {
    return STONE_GRADE_NAMES[grade];
  }
  if (subGrade > 0 && STONE_SUBGRADE_NAMES[grade]?.[subGrade]) {
    return STONE_SUBGRADE_NAMES[grade][subGrade];
  }
  return STONE_GRADE_NAMES[grade] ?? '未知';
}

/** 获取等级编码（如 "2-3级"） */
export function getStoneGradeLabel(grade: number, subGrade: number): string {
  if (grade < 2) {
    return `${grade}级`;
  }
  return `${grade}-${subGrade}级`;
}

/** 获取矿石描述 */
export function getStoneDescription(grade: number, subGrade: number): string {
  return STONE_DESCRIPTIONS[grade]?.[subGrade] ?? '';
}

// ============================================================
// Collection (图鉴) helpers
// ============================================================

/** 图鉴中每个矿石条目的完整信息 */
export interface CollectionEntry {
  grade: number;
  subGrade: number;
  name: string;
  label: string;
  description: string;
  color: string;
  discovered: boolean;
  acquiredAt?: number; // timestamp of earliest discovery
  count: number;       // how many of this type the player owns
}

/** 所有可能存在子等级的矿石组合 */
export const ALL_ORE_COMBINATIONS: { grade: number; subGrade: number }[] = [
  { grade: 0, subGrade: 0 },
  { grade: 1, subGrade: 0 },
  { grade: 2, subGrade: 1 },
  { grade: 2, subGrade: 2 },
  { grade: 2, subGrade: 3 },
  { grade: 2, subGrade: 4 },
  { grade: 3, subGrade: 1 },
  { grade: 3, subGrade: 2 },
  { grade: 3, subGrade: 3 },
  { grade: 3, subGrade: 4 },
];

/** 根据用户拥有的矿石列表构建图鉴数据 */
export function buildCollection(stones: Stone[]): CollectionEntry[] {
  // Group stones by grade+subGrade, track earliest acquisition
  const groups: Record<string, { count: number; earliestAt?: number }> = {};
  for (const s of stones) {
    const key = `${s.grade}-${s.subGrade}`;
    if (!groups[key]) {
      groups[key] = { count: 0, earliestAt: undefined };
    }
    groups[key].count++;
    if (s.acquiredAt !== undefined) {
      if (groups[key].earliestAt === undefined || s.acquiredAt < groups[key].earliestAt!) {
        groups[key].earliestAt = s.acquiredAt;
      }
    }
  }

  return ALL_ORE_COMBINATIONS.map(({ grade, subGrade }) => {
    const key = `${grade}-${subGrade}`;
    const group = groups[key];
    return {
      grade,
      subGrade,
      name: getStoneDisplayName(grade, subGrade),
      label: getStoneGradeLabel(grade, subGrade),
      description: getStoneDescription(grade, subGrade),
      color: STONE_GRADE_COLORS[grade],
      discovered: group !== undefined,
      acquiredAt: group?.earliestAt,
      count: group?.count ?? 0,
    };
  });
}

/** 判断矿石是否可打磨 */
export function isStonePolishable(stone: Stone): boolean {
  return stone.damage < stone.damageLimit && stone.grade < 3;
}

// ============================================================
// Sub-grade probability (shared between contract & frontend)
// ============================================================

export const SUBGRADE_PROBABILITIES: { subGrade: number; chance: number; label: string }[] = [
  { subGrade: 1, chance: 43, label: '43%' },
  { subGrade: 2, chance: 30, label: '30%' },
  { subGrade: 3, chance: 20, label: '20%' },
  { subGrade: 4, chance: 7, label: '7%' },
];

/** 前端模拟子等级随机（与合约 _rollSubGrade 逻辑一致） */
export function rollSubGrade(grade: number): number {
  if (grade < 2) return 0;
  const rand = Math.random() * 100;
  if (rand < 43) return 1;
  if (rand < 73) return 2;
  if (rand < 93) return 3;
  return 4;
}

export const TOOL_LEVEL_NAMES: Record<number, string> = {
  0: '普通',
  1: '专业',
  2: '顶级',
  3: '传奇',
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
