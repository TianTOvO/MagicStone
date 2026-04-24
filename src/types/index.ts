// 原石数据类型
export interface Stone {
  id: number;
  grade: number;
  damage: number;
  damageLimit: number;
  mysterious: boolean;
  isPolishable?: boolean;
}

// 工具数据类型
export interface Tool {
  id: number;
  level: number;
  durability: number;
  durabilityMax: number;
  lossCoeff: number;
  durabilityConsumption: number;
}

// 任务数据类型
export interface Quest {
  id: number;
  type: string;
  title: string;
  progress: number;
  target: number;
  reward: number;
}

// 用户数据类型
export interface UserData {
  stones: Stone[];
  tools: Tool[];
  coins: number;
  quests: Quest[];
}
