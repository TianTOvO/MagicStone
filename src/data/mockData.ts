import { UserData } from '@/types';

// 模拟用户数据（用于开发和演示）
export const mockUserData: UserData = {
  stones: [
    { id: 1, grade: 1, damage: 10, damageLimit: 100, mysterious: false, isPolishable: true },
    { id: 2, grade: 1, damage: 5, damageLimit: 80, mysterious: false, isPolishable: true },
    { id: 3, grade: 1, damage: 0, damageLimit: 120, mysterious: false, isPolishable: true },
    { id: 4, grade: 1, damage: 15, damageLimit: 90, mysterious: false, isPolishable: true },
    { id: 5, grade: 1, damage: 8, damageLimit: 110, mysterious: false, isPolishable: true }
  ],
  tools: [
    { id: 1, level: 1, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 2, level: 1, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 3, level: 1, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 4, level: 1, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 5, level: 1, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 6, level: 1, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 7, level: 1, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 8, level: 1, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 9, level: 1, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 10, level: 1, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 }
  ],
  coins: 1000,
  quests: [
    { id: 1, type: '日常', title: '打磨5次原石', progress: 0, target: 5, reward: 100 },
    { id: 2, type: '日常', title: '收集3块奇特原石', progress: 0, target: 3, reward: 200 },
    { id: 3, type: '成就', title: '首次打磨成功', progress: 0, target: 1, reward: 50 }
  ]
};
