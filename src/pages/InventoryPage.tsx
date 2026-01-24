import { useContext, useState, useEffect } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { usePlayerData } from '@/contexts/playerDataContext';
import { useContracts } from '@/hooks/useContracts';
import { motion } from 'framer-motion';
import { Empty } from '@/components/Empty';

export default function InventoryPage() {
  const { userData } = useContext(UserDataContext);
  const playerData = usePlayerData();
  const { connected, account, connectWallet, getTokenBalance, polish } = useContracts();
  const [activeTab, setActiveTab] = useState<'stones' | 'tools'>('stones');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const getStoneLevelColor = (level: string) => {
    switch (level) {
      case '平凡': return 'bg-gray-500';
      case '奇特': return 'bg-blue-500';
      case '珍稀': return 'bg-purple-500';
      case '璀璨': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getToolLevelColor = (level: string) => {
    switch (level) {
      case '普通': return 'bg-gray-500';
      case '专业': return 'bg-green-500';
      case '顶级': return 'bg-blue-500';
      case '传奇': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // 统计信息
  const stoneStats = {
    total: userData.stones.length,
    平凡: userData.stones.filter(s => s.level === '平凡').length,
    奇特: userData.stones.filter(s => s.level === '奇特').length,
    珍稀: userData.stones.filter(s => s.level === '珍稀').length,
    璀璨: userData.stones.filter(s => s.level === '璀璨').length,
    polishable: userData.stones.filter(s => s.isPolishable).length,
    maxLevel: Math.max(
      userData.stones.filter(s => s.level === '平凡').length,
      userData.stones.filter(s => s.level === '奇特').length,
      userData.stones.filter(s => s.level === '珍稀').length,
      userData.stones.filter(s => s.level === '璀璨').length
    )
  };

  const toolStats = {
    total: userData.tools.length,
    普通: userData.tools.filter(t => t.level === '普通').length,
    专业: userData.tools.filter(t => t.level === '专业').length,
    顶级: userData.tools.filter(t => t.level === '顶级').length,
    传奇: userData.tools.filter(t => t.level === '传奇').length,
    usable: userData.tools.filter(t => t.当前耐久值 > 0).length,
    maxLevel: Math.max(
      userData.tools.filter(t => t.level === '普通').length,
      userData.tools.filter(t => t.level === '专业').length,
      userData.tools.filter(t => t.level === '顶级').length,
      userData.tools.filter(t => t.level === '传奇').length
    )
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
        <p className="text-gray-700 text-lg font-medium">管理你的原石和打磨工具</p>
      </motion.div>

      {/* 选项卡 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-sm rounded-xl p-1 inline-flex border-2 border-purple-300">
        <button
          onClick={() => setActiveTab('stones')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'stones' 
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-400/50' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <i className="fas fa-gem mr-2"></i> 原石 ({userData.stones.length})
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

      {/* 统计图表 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-indigo-300 shadow-lg"
      >
        <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center"><i className="fas fa-chart-bar text-indigo-600 mr-2"></i>等级分布</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {activeTab === 'stones' ? (
            <>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-300 shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 text-sm font-bold">平凡</span>
                  <span className="text-gray-800 font-bold">{stoneStats.平凡}</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-gray-400 to-gray-500 h-3 rounded-full shadow-md" 
                    style={{ width: `${(stoneStats.平凡 / stoneStats.maxLevel) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-300 shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-700 text-sm font-bold">奇特</span>
                  <span className="text-blue-800 font-bold">{stoneStats.奇特}</span>
                </div>
                <div className="w-full bg-blue-300 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full shadow-md" 
                    style={{ width: `${(stoneStats.奇特 / stoneStats.maxLevel) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-300 shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-purple-700 text-sm font-bold">珍稀</span>
                  <span className="text-purple-800 font-bold">{stoneStats.珍稀}</span>
                </div>
                <div className="w-full bg-purple-300 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full shadow-md" 
                    style={{ width: `${(stoneStats.珍稀 / stoneStats.maxLevel) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg p-4 border border-yellow-300 shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-amber-700 text-sm font-bold">璀璨</span>
                  <span className="text-amber-800 font-bold">{stoneStats.璀璨}</span>
                </div>
                <div className="w-full bg-yellow-300 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 h-3 rounded-full shadow-md" 
                    style={{ width: `${(stoneStats.璀璨 / stoneStats.maxLevel) * 100}%` }}
                  ></div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-300 shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 text-sm font-bold">普通</span>
                  <span className="text-gray-800 font-bold">{toolStats.普通}</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-gray-400 to-gray-500 h-3 rounded-full shadow-md" 
                    style={{ width: `${(toolStats.普通 / toolStats.maxLevel) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 border border-green-300 shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-700 text-sm font-bold">专业</span>
                  <span className="text-green-800 font-bold">{toolStats.专业}</span>
                </div>
                <div className="w-full bg-green-300 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full shadow-md" 
                    style={{ width: `${(toolStats.专业 / toolStats.maxLevel) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-300 shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-700 text-sm font-bold">顶级</span>
                  <span className="text-blue-800 font-bold">{toolStats.顶级}</span>
                </div>
                <div className="w-full bg-blue-300 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full shadow-md" 
                    style={{ width: `${(toolStats.顶级 / toolStats.maxLevel) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-300 shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-purple-700 text-sm font-bold">传奇</span>
                  <span className="text-purple-800 font-bold">{toolStats.传奇}</span>
                </div>
                <div className="w-full bg-purple-300 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full shadow-md" 
                    style={{ width: `${(toolStats.传奇 / toolStats.maxLevel) * 100}%` }}
                  ></div>
                </div>
              </div>
            </>
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

      {/* 资产列表 */}
      <div>
        <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center">
          <i className={`mr-2 text-2xl ${activeTab === 'stones' ? 'fas fa-gem text-blue-600' : 'fas fa-tools text-green-600'}`}></i>
          {activeTab === 'stones' ? '我的原石' : '我的工具'}
        </h2>

        {activeTab === 'stones' ? (
          userData.stones.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {userData.stones.map((stone) => (
                <motion.div
                  key={stone.id}
                  whileHover={{ scale: 1.08, y: -8 }}
                  className={`rounded-2xl p-6 border-2 shadow-lg transition-all ${
                    stone.isPolishable 
                      ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 hover:border-blue-500' 
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 opacity-60'
                  }`}
                >
                  <div className="relative h-32 flex items-center justify-center mb-4">
                    <div className={`absolute inset-0 rounded-full ${getStoneLevelColor(stone.level)} opacity-20 blur-xl`}></div>
                    <i className={`fas fa-gem text-6xl ${stone.isPolishable ? 'text-white' : 'text-gray-500'}`}></i>
                  </div>
                  
                  <h3 className="text-lg font-bold text-center mb-1 text-gray-800">
                    {stone.level}原石
                  </h3>
                  
                  <p className="text-sm text-gray-600 text-center mb-3 font-medium">
                    {stone.稀有标识}
                  </p>
                  
                  <div className="w-full bg-gray-300 rounded-full h-2 mb-1">
                    <div 
                      className={`h-2 rounded-full ${
                        stone.isPolishable ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-red-400'
                      }`} 
                      style={{ width: `${(stone.损耗值 / stone.损耗上限) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-700 font-semibold">
                    <span>损耗</span>
                    <span>{stone.损耗值}/{stone.损耗上限}</span>
                  </div>
                  
                  {!stone.isPolishable && (
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
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`bg-gray-800/70 backdrop-blur-sm rounded-xl p-5 border shadow-lg ${
                    tool.当前耐久值 > 0 
                      ? 'border-green-500/30 hover:border-green-400' 
                      : 'border-red-500/30 opacity-70'
                  }`}
                >
                  <div className="relative h-32 flex items-center justify-center mb-4">
                    <div className={`absolute inset-0 rounded-full ${getToolLevelColor(tool.level)} opacity-20 blur-xl`}></div>
                    <i className={`fas fa-wrench text-6xl ${tool.当前耐久值 > 0 ? 'text-white' : 'text-gray-500'}`}></i>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-center mb-1">
                    {tool.level}工具
                  </h3>
                  
                  <p className="text-sm text-gray-400 text-center mb-3">
                    损耗系数: {tool.损耗影响系数}x
                  </p>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                    <div 
                      className={`h-2 rounded-full ${
                        tool.当前耐久值 > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${(tool.当前耐久值 / tool.耐久上限) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>耐久</span>
                    <span>{tool.当前耐久值}/{tool.耐久上限}</span>
                  </div>
                  
                  {tool.当前耐久值 === 0 && (
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