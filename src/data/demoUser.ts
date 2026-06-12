import { UserData } from '@/types';

// 模拟用户数据（用于开发和演示）
export const mockUserData: UserData = {
  stones: [
    { id: 1, grade: 0, subGrade: 0, damage: 10, damageLimit: 100, mysterious: false, isPolishable: true, acquiredAt: Date.now() - 86400000 * 7 },
    { id: 2, grade: 1, subGrade: 0, damage: 5, damageLimit: 80, mysterious: false, isPolishable: true, acquiredAt: Date.now() - 86400000 * 5 },
    { id: 3, grade: 2, subGrade: 3, damage: 0, damageLimit: 150, mysterious: false, isPolishable: true, acquiredAt: Date.now() - 86400000 * 3 },
    { id: 4, grade: 0, subGrade: 0, damage: 90, damageLimit: 90, mysterious: true, isPolishable: false, acquiredAt: Date.now() - 86400000 * 10 },
    { id: 5, grade: 3, subGrade: 4, damage: 8, damageLimit: 200, mysterious: false, isPolishable: true, acquiredAt: Date.now() - 86400000 },
  ],
  tools: [
    { id: 1, level: 0, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 2, level: 0, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 3, level: 0, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 4, level: 1, durability: 80, durabilityMax: 100, lossCoeff: 0.8, durabilityConsumption: 0.8 },
    { id: 5, level: 1, durability: 100, durabilityMax: 100, lossCoeff: 0.8, durabilityConsumption: 0.8 },
    { id: 6, level: 2, durability: 90, durabilityMax: 100, lossCoeff: 0.5, durabilityConsumption: 0.5 },
    { id: 7, level: 0, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 8, level: 0, durability: 100, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1 },
    { id: 9, level: 3, durability: 140, durabilityMax: 150, lossCoeff: 0.2, durabilityConsumption: 0.2 },
    { id: 10, level: 2, durability: 100, durabilityMax: 100, lossCoeff: 0.5, durabilityConsumption: 0.5 },
  ],
  coins: 1000,
  quests: [
    { id: 1, type: '日常', title: '打磨5次矿石', progress: 0, target: 5, reward: 100 },
    { id: 2, type: '日常', title: '收集3块玛瑙', progress: 0, target: 3, reward: 200 },
    { id: 3, type: '成就', title: '首次打磨成功', progress: 0, target: 1, reward: 50 }
  ]
};
