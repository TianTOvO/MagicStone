import { createContext, ReactNode } from 'react';

// 定义数据类型
export interface Stone {
  id: number;
  level: string;
  损耗值: number;
  损耗上限: number;
  稀有标识: string;
  isPolishable: boolean;
}

export interface Tool {
  id: number;
  level: string;
  当前耐久值: number;
  耐久上限: number;
  损耗影响系数: number;
  耐久消耗系数: number;
}

export interface Quest {
  id: number;
  type: string;
  title: string;
  progress: number;
  target: number;
  reward: number;
}

export interface UserData {
  stones: Stone[];
  tools: Tool[];
  coins: number;
  quests: Quest[];
}

interface UserDataContextType {
  userData: UserData;
  updateUserData: (newData: Partial<UserData>) => void;
}

export const UserDataContext = createContext<UserDataContextType>({
  userData: {
    stones: [],
    tools: [],
    coins: 0,
    quests: []
  },
  updateUserData: () => {}
});