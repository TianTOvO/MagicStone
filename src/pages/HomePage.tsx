import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserDataContext } from '@/contexts/userDataContext';
import { useContracts } from '@/hooks/useContracts';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { userData } = useContext(UserDataContext);
  const { connected, account, connectWallet } = useContracts();
  const [blockchainStatus, setBlockchainStatus] = useState<'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    setBlockchainStatus(connected ? 'connected' : 'disconnected');
  }, [connected]);

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

  // 提取玩家信息
  const stats = {
    totalStones: userData.stones.length,
    totalTools: userData.tools.length,
    coins: userData.coins,
    activeQuests: userData.quests.filter(q => q.progress < q.target).length,
    completedQuests: userData.quests.filter(q => q.progress >= q.target).length,
    highestStoneLevel: [...userData.stones].sort((a, b) => {
      const levels = { '平凡': 1, '奇特': 2, '珍稀': 3, '璀璨': 4 };
      return levels[b.level as keyof typeof levels] - levels[a.level as keyof typeof levels];
    })[0]?.level || '无',
  };

  return (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 shadow-xl"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              ✨ 欢迎来到 Magic Stone
            </h1>
            <p className="text-gray-700 text-lg font-medium">开始你的链上原石打磨之旅，收集、打磨、交易，成为传奇工匠！</p>
          </div>
          <div className="text-right">
            {blockchainStatus === 'connected' && account ? (
              <motion.div 
                className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-xl px-4 py-3 shadow-md"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <p className="text-sm font-bold text-green-700 mb-1">✓ 区块链已连接</p>
                <p className="text-xs text-green-600 font-mono">{account.slice(0, 6)}...{account.slice(-4)}</p>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectWallet}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-5 py-3 text-sm font-bold transition-all shadow-lg"
              >
                <i className="fas fa-plug mr-2"></i>
                连接区块链
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* 数据概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          whileHover={{ scale: 1.05, boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.3)' }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-700 text-sm font-bold">我的原石</h3>
            <motion.i 
              className="fas fa-gem text-blue-600 text-2xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            ></motion.i>
          </div>
          <p className="text-4xl font-black text-blue-700">{stats.totalStones}</p>
          <p className="text-sm text-blue-600 mt-2 font-semibold">最高等级: {stats.highestStoneLevel}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05, boxShadow: '0 20px 25px -5px rgba(34, 197, 94, 0.3)' }}
          className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border-2 border-green-300 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-700 text-sm font-bold">打磨工具</h3>
            <motion.i 
              className="fas fa-tools text-green-600 text-2xl"
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            ></motion.i>
          </div>
          <p className="text-4xl font-black text-green-700">{stats.totalTools}</p>
          <p className="text-sm text-green-600 mt-2 font-semibold">可用于打磨和合成</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05, boxShadow: '0 20px 25px -5px rgba(234, 179, 8, 0.3)' }}
          className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-2xl p-6 border-2 border-yellow-300 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-700 text-sm font-bold">游戏币</h3>
            <motion.i 
              className="fas fa-coins text-yellow-600 text-2xl"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            ></motion.i>
          </div>
          <p className="text-4xl font-black text-yellow-700">{stats.coins}</p>
          <p className="text-sm text-yellow-600 mt-2 font-semibold">可在商城和市场使用</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05, boxShadow: '0 20px 25px -5px rgba(168, 85, 247, 0.3)' }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-300 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-700 text-sm font-bold">任务进度</h3>
            <motion.i 
              className="fas fa-tasks text-purple-600 text-2xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            ></motion.i>
          </div>
          <p className="text-4xl font-black text-purple-700">{stats.completedQuests}/{userData.quests.length}</p>
          <p className="text-sm text-purple-600 mt-2 font-semibold">待完成: {stats.activeQuests}</p>
        </motion.div>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.3)' }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-300 cursor-pointer shadow-lg"
        >
          <Link to="/polishing" className="h-full flex flex-col justify-between">
            <div>
              <motion.i 
                className="fas fa-wrench text-5xl text-blue-600 mb-4"
                animate={{ rotate: [0, 15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              ></motion.i>
              <h3 className="text-2xl font-black text-gray-800 mb-2">开始打磨</h3>
              <p className="text-gray-700 text-base font-medium">打磨你的原石，提升它们的等级和价值</p>
            </div>
            <motion.div 
              className="mt-4 text-blue-600 text-base font-bold flex items-center"
              whileHover={{ x: 5 }}
            >
              前往打磨站 <i className="fas fa-arrow-right ml-2"></i>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.3)' }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-300 cursor-pointer shadow-lg"
        >
          <Link to="/shop" className="h-full flex flex-col justify-between">
            <div>
              <motion.i 
                className="fas fa-store text-5xl text-purple-600 mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              ></motion.i>
              <h3 className="text-2xl font-black text-gray-800 mb-2">商城购物</h3>
              <p className="text-gray-700 text-base font-medium">购买更多原石和工具，扩展你的收藏</p>
            </div>
            <motion.div 
              className="mt-4 text-purple-600 text-base font-bold flex items-center"
              whileHover={{ x: 5 }}
            >
              前往商城 <i className="fas fa-arrow-right ml-2"></i>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(34, 197, 94, 0.3)' }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-300 cursor-pointer shadow-lg"
        >
          <Link to="/quests" className="h-full flex flex-col justify-between">
            <div>
              <motion.i 
                className="fas fa-clipboard-list text-5xl text-green-600 mb-4"
                animate={{ rotate: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              ></motion.i>
              <h3 className="text-2xl font-black text-gray-800 mb-2">完成任务</h3>
              <p className="text-gray-700 text-base font-medium">完成任务获取奖励，加速你的游戏进程</p>
            </div>
            <motion.div 
              className="mt-4 text-green-600 text-base font-bold flex items-center"
              whileHover={{ x: 5 }}
            >
              查看任务 <i className="fas fa-arrow-right ml-2"></i>
            </motion.div>
          </Link>
        </motion.div>
      </div>

      {/* 最近资产 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-gray-800">最近资产</h2>
          <Link to="/inventory" className="text-blue-600 hover:text-blue-700 font-bold flex items-center text-base transition-colors">
            查看全部 <i className="fas fa-chevron-right ml-2 text-sm"></i>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {/* 显示最近的3个原石 */}
          {userData.stones.slice(0, 3).map((stone) => (
            <motion.div
              key={stone.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.08, rotate: 3 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border-2 border-blue-300 shadow-md"
            >
              <div className="relative h-28 flex items-center justify-center mb-4">
                <motion.div 
                  className={`absolute inset-0 rounded-full ${getStoneLevelColor(stone.level)} opacity-20 blur-xl`}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                ></motion.div>
                <i className="fas fa-gem text-5xl text-blue-600 relative"></i>
              </div>
              <h4 className="text-center font-bold text-gray-800 text-sm">{stone.level}原石</h4>
              <p className="text-center text-gray-600 text-xs mt-2 font-semibold">{stone.损耗值}/{stone.损耗上限}</p>
            </motion.div>
          ))}

          {/* 显示最近的2个工具 */}
          {userData.tools.slice(0, 2).map((tool) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.08, rotate: -3 }}
              className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-5 border-2 border-green-300 shadow-md"
            >
              <div className="relative h-28 flex items-center justify-center mb-4">
                <motion.div 
                  className={`absolute inset-0 rounded-full ${getToolLevelColor(tool.level)} opacity-20 blur-xl`}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                ></motion.div>
                <i className="fas fa-wrench text-5xl text-green-600 relative"></i>
              </div>
              <h4 className="text-center font-bold text-gray-800 text-sm">{tool.level}工具</h4>
              <p className="text-center text-gray-600 text-xs mt-2 font-semibold">{tool.当前耐久值}/{tool.耐久上限}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}