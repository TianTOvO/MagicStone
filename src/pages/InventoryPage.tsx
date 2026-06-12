import { useContext, useState } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { STONE_GRADE_COLORS, STONE_GRADE_NAMES, TOOL_LEVEL_COLORS, TOOL_LEVEL_NAMES, getStoneDisplayName } from '@/types';
import { motion } from 'framer-motion';
import { Empty } from '@/components/Empty';

export default function InventoryPage() {
  const { userData } = useContext(UserDataContext);
  const [activeTab, setActiveTab] = useState<'stones' | 'tools'>('stones');

  const gradeCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  userData.stones.forEach(s => { gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1; });
  const maxGradeCount = Math.max(...Object.values(gradeCounts), 1);

  const levelCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  userData.tools.forEach(t => { levelCounts[t.level] = (levelCounts[t.level] || 0) + 1; });
  const maxLevelCount = Math.max(...Object.values(levelCounts), 1);

  const stoneStats = {
    total: userData.stones.length,
    polishable: userData.stones.filter(s => (s.damage ?? 0) < (s.damageLimit ?? 1)).length,
  };

  const toolStats = {
    total: userData.tools.length,
    usable: userData.tools.filter(t => t.durability > 0).length,
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">📦 我的资产</h1>
        <p className="text-gray-700 text-lg font-medium">管理你的矿石和打磨工具</p>
      </motion.div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-sm rounded-xl p-1 inline-flex border-2 border-purple-300">
        <button
          onClick={() => setActiveTab('stones')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'stones'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-400/50'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <i className="fas fa-gem mr-2"></i> 矿石 ({userData.stones.length})
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'tools'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-400/50'
              : 'text-gray-600 hover:text-green-600'
          }`}
        >
          <i className="fas fa-tools mr-2"></i> 工具 ({userData.tools.length})
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-indigo-300 shadow-lg"
      >
        <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center"><i className="fas fa-chart-bar text-indigo-600 mr-2"></i>等级分布</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {activeTab === 'stones' ? (
            [0, 1, 2, 3].map(grade => (
              <div key={grade} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-300 shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 text-sm font-bold">{STONE_GRADE_NAMES[grade]}</span>
                  <span className="text-gray-800 font-bold">{gradeCounts[grade]}</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full shadow-md ${STONE_GRADE_COLORS[grade]}`}
                    style={{ width: `${(gradeCounts[grade] / maxGradeCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            [0, 1, 2, 3].map(level => (
              <div key={level} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-300 shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 text-sm font-bold">{TOOL_LEVEL_NAMES[level]}</span>
                  <span className="text-gray-800 font-bold">{levelCounts[level]}</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full shadow-md ${TOOL_LEVEL_COLORS[level]}`}
                    style={{ width: `${(levelCounts[level] / maxLevelCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeTab === 'stones' ? (
            <div className="bg-gray-700/50 rounded-lg p-4 flex items-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                <i className="fas fa-sync-alt text-blue-400 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-300 text-sm">可打磨</p>
                <p className="text-2xl font-bold">{stoneStats.polishable} / {stoneStats.total}</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-700/50 rounded-lg p-4 flex items-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
                <i className="fas fa-check-circle text-green-400 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-300 text-sm">可使用</p>
                <p className="text-2xl font-bold">{toolStats.usable} / {toolStats.total}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div>
        <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center">
          <i className={`mr-2 text-2xl ${activeTab === 'stones' ? 'fas fa-gem text-blue-600' : 'fas fa-tools text-green-600'}`}></i>
          {activeTab === 'stones' ? '我的矿石' : '我的工具'}
        </h2>

        {activeTab === 'stones' ? (
          userData.stones.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {userData.stones.map((stone) => (
                <motion.div
                  key={stone.id}
                  className={`rounded-2xl p-6 border-2 shadow-lg hover:scale-105 hover:-translate-y-2 hover:shadow-xl transition-all duration-150 ${
                    ((stone.damage ?? 0) < (stone.damageLimit ?? 1))
                      ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 hover:border-blue-500'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 opacity-60'
                  }`}
                >
                  <div className="relative h-32 flex items-center justify-center mb-4">
                    <div className={`absolute inset-0 rounded-full ${STONE_GRADE_COLORS[stone.grade]} opacity-20 blur-xl`}></div>
                    <i className={`fas fa-gem text-6xl ${((stone.damage ?? 0) < (stone.damageLimit ?? 1)) ? 'text-white' : 'text-gray-500'}`}></i>
                  </div>

                  <h3 className="text-lg font-bold text-center mb-1 text-gray-800">
                    {getStoneDisplayName(stone.grade, stone.subGrade)}
                  </h3>

                  <p className="text-sm text-gray-600 text-center mb-3 font-medium">
                    {stone.mysterious ? '神秘矿石' : '常规矿石'}
                  </p>

                  <div className="w-full bg-gray-300 rounded-full h-2 mb-1">
                    <div
                      className={`h-2 rounded-full ${
                        ((stone.damage ?? 0) < (stone.damageLimit ?? 1)) ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-red-400'
                      }`}
                      style={{ width: `${(stone.damage / stone.damageLimit) * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-700 font-semibold">
                    <span>损耗</span>
                    <span>{stone.damage}/{stone.damageLimit}</span>
                  </div>

                  {!((stone.damage ?? 0) < (stone.damageLimit ?? 1)) && (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mt-3 bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-400 rounded-lg p-2 text-center text-xs text-red-600 font-bold"
                    >
                      <i className="fas fa-exclamation-circle mr-1"></i> 已达损耗上限
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <Empty />
          )
        ) : (
          userData.tools.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {userData.tools.map((tool) => (
                <motion.div
                  key={tool.id}
                  className={`bg-gray-800/70 backdrop-blur-sm rounded-xl p-5 border shadow-lg hover:scale-105 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-150 ${
                    tool.durability > 0
                      ? 'border-green-500/30 hover:border-green-400'
                      : 'border-red-500/30 opacity-70'
                  }`}
                >
                  <div className="relative h-32 flex items-center justify-center mb-4">
                    <div className={`absolute inset-0 rounded-full ${TOOL_LEVEL_COLORS[tool.level]} opacity-20 blur-xl`}></div>
                    <i className={`fas fa-wrench text-6xl ${tool.durability > 0 ? 'text-white' : 'text-gray-500'}`}></i>
                  </div>

                  <h3 className="text-lg font-semibold text-center mb-1">
                    {TOOL_LEVEL_NAMES[tool.level]}工具
                  </h3>

                  <p className="text-sm text-gray-400 text-center mb-3">
                    损耗系数: {tool.lossCoeff}x
                  </p>

                  <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                    <div
                      className={`h-2 rounded-full ${
                        tool.durability > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(tool.durability / tool.durabilityMax) * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-400">
                    <span>耐久</span>
                    <span>{tool.durability}/{tool.durabilityMax}</span>
                  </div>

                  {tool.durability === 0 && (
                    <div className="mt-3 bg-red-900/30 border border-red-500/30 rounded-lg p-2 text-center text-xs text-red-400">
                      <i className="fas fa-exclamation-circle mr-1"></i> 已耗尽耐久
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <Empty />
          )
        )}
      </div>
    </div>
  );
}
