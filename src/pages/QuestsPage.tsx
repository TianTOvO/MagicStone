import { useContext, useState, useEffect } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { useContracts } from '@/hooks/useContracts';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// 模拟更多任务数据
const mockQuests = [
  {
    id: 1,
    type: "日常",
    title: "打磨5次原石",
    description: "使用打磨工具打磨任意原石5次",
    progress: 0,
    target: 5,
    reward: 100,
    icon: "wrench"
  },
  {
    id: 2,
    type: "日常",
    title: "收集3块奇特原石",
    description: "通过打磨或购买获得3块奇特等级的原石",
    progress: 0,
    target: 3,
    reward: 200,
    icon: "gem"
  },
  {
    id: 3,
    type: "成就",
    title: "首次打磨成功",
    description: "成功将一块原石从平凡升级到奇特",
    progress: 0,
    target: 1,
    reward: 50,
    icon: "star"
  },
  {
    id: 4,
    type: "成就",
    title: "工具大师",
    description: "拥有3个专业级别的打磨工具",
    progress: 0,
    target: 3,
    reward: 300,
    icon: "tools"
  },
  {
    id: 5,
    type: "寻宝",
    title: "寻找神秘原石",
    description: "解开谜题：什么石头越打磨越亮，却不会变小？",
    progress: 0,
    target: 1,
    reward: 1000,
    icon: "map",
    isPuzzle: true
  },
  {
    id: 6,
    type: "团队",
    title: "极速研磨",
    description: "与3名队友一起，在10分钟内完成50次打磨",
    progress: 0,
    target: 1,
    reward: 500,
    icon: "users"
  }
];

export default function QuestsPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const { connected, account, contracts } = useContracts();
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'achievement' | 'treasure' | 'team'>('all');
  const [showPuzzleModal, setShowPuzzleModal] = useState(false);
  const [puzzleAnswer, setPuzzleAnswer] = useState('');
  const [currentPuzzle, setCurrentPuzzle] = useState<any>(null);
  const [claimingQuestId, setClaimingQuestId] = useState<number | null>(null);

  // 合并用户数据中的任务和模拟任务数据
  const quests = mockQuests.map(quest => {
    const userQuest = userData.quests.find(q => q.id === quest.id);
    return userQuest ? userQuest : quest;
  });

  // 筛选任务
  const filteredQuests = quests.filter(quest => {
    if (activeTab === 'all') return true;
    
    switch (activeTab) {
      case 'daily':
        return quest.type === '日常';
      case 'achievement':
        return quest.type === '成就';
      case 'treasure':
        return quest.type === '寻宝';
      case 'team':
        return quest.type === '团队';
      default:
        return true;
    }
  });

  // 获取任务类型对应的颜色和图标
  const getQuestTypeInfo = (type: string) => {
    switch (type) {
      case '日常':
        return { color: 'bg-blue-600', icon: 'calendar-day' };
      case '成就':
        return { color: 'bg-amber-600', icon: 'trophy' };
      case '寻宝':
        return { color: 'bg-purple-600', icon: 'map-marked-alt' };
      case '团队':
        return { color: 'bg-green-600', icon: 'users' };
      default:
        return { color: 'bg-gray-600', icon: 'clipboard-list' };
    }
  };

  // 领取奖励
  const claimReward = async (quest: any) => {
    if (!account) {
      toast.error('请先连接钱包');
      return;
    }

    setClaimingQuestId(quest.id);
    
    try {
      // 如果已连接到区块链，则通过合约记录奖励
      if (connected && contracts.quest) {
        // 向链上提交任务完成记录
        const tx = await contracts.quest.completeQuest(quest.id);
        await tx.wait();
      }
      
      // 更新任务状态为已完成
      const updatedQuests = userData.quests.map(q => {
        if (q.id === quest.id) {
          return { ...q, claimed: true };
        }
        return q;
      });
      
      // 添加新任务（如果没有）
      if (!updatedQuests.find(q => q.id === quest.id)) {
        updatedQuests.push({ ...quest, claimed: true });
      }
      
      // 更新用户数据
      updateUserData({
        quests: updatedQuests,
        coins: userData.coins + quest.reward
      });
      
      // 显示成功消息
      toast.success(`成功领取任务奖励：${quest.reward} 游戏币`);
    } catch (error: any) {
      console.error('领取奖励失败:', error);
      toast.error(error.message || '领取奖励失败，请重试');
    } finally {
      setClaimingQuestId(null);
    }
  };

  // 提交谜题答案
  const submitPuzzleAnswer = () => {
    if (!currentPuzzle) return;
    
    // 简化的答案校验（实际游戏中可能更复杂）
    const correctAnswers = ['钻石', '砖石', 'diamond', 'Diamond'];
    
    if (correctAnswers.includes(puzzleAnswer.trim())) {
      // 奖励神秘原石
      const newStone = {
        id: Date.now(), // 生成唯一ID
        level: '平凡',
        损耗值: 0,
        损耗上限: 150 + Math.floor(Math.random() * 51), // 150-200之间的随机值
        稀有标识: '神秘原石',
        isPolishable: true
      };
      
      // 更新用户数据
      updateUserData({
        stones: [...userData.stones, newStone],
        coins: userData.coins + currentPuzzle.reward,
        quests: userData.quests.map(q => 
          q.id === currentPuzzle.id ? { ...q, progress: q.target } : q
        )
      });
      
      toast.success(`恭喜！你解开了谜题，获得了${currentPuzzle.reward}游戏币和一块神秘原石！`);
      setShowPuzzleModal(false);
      setPuzzleAnswer('');
    } else {
      toast.error('答案不正确，请再试一次');
    }
  };

  // 打开谜题模态框
  const openPuzzleModal = (quest: any) => {
    setCurrentPuzzle(quest);
    setPuzzleAnswer('');
    setShowPuzzleModal(true);
  };

  // 动画配置
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-green-50 via-emerald-50 to-cyan-50 rounded-2xl p-8 border-2 border-green-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-emerald-600 to-cyan-600">📋 任务中心</h1>
        <p className="text-gray-700 text-lg font-medium">完成各类任务赚取奖励和成就</p>
      </motion.div>

      {/* 任务选项卡 */}
      <div className="bg-gradient-to-r from-green-100 to-emerald-100 backdrop-blur-sm rounded-2xl p-1 inline-flex overflow-x-auto whitespace-nowrap border-2 border-green-300 shadow">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'all' 
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
              : 'text-gray-700 hover:text-green-600'
          }`}
        >
          全部任务
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'daily' 
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
              : 'text-gray-700 hover:text-green-600'
          }`}
        >
          <i className="fas fa-calendar-day mr-1"></i> 日常任务
        </button>
        <button
          onClick={() => setActiveTab('achievement')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'achievement' 
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg' 
              : 'text-gray-700 hover:text-amber-600'
          }`}
        >
          <i className="fas fa-trophy mr-1"></i> 成就任务
        </button>
        <button
          onClick={() => setActiveTab('treasure')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'treasure' 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
              : 'text-gray-700 hover:text-purple-600'
          }`}
        >
          <i className="fas fa-map-marked-alt mr-1"></i> 寻宝任务
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'team' 
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
              : 'text-gray-700 hover:text-blue-600'
          }`}
        >
          <i className="fas fa-users mr-1"></i> 团队任务
        </button>
      </div>

      {/* 任务列表 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {filteredQuests.length > 0 ? (
          filteredQuests.map((quest) => {
            const typeInfo = getQuestTypeInfo(quest.type);
            const isCompleted = quest.progress >= quest.target;
            const isClaimed = quest.claimed || false;
            
            return (
              <motion.div
                key={quest.id}
                variants={itemVariants}
                className={`rounded-2xl p-5 border-2 shadow-lg transition-all ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 border-purple-300'
                }`}
              >
                <div className="flex items-start">
                  {/* 任务图标 */}
                  <div className={`${typeInfo.color} rounded-lg p-3 mr-4 flex-shrink-0 shadow`}>
                    <i className={`fas fa-${typeInfo.icon} text-white text-lg`}></i>
                  </div>
                  
                  {/* 任务信息 */}
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-lg font-bold text-gray-800">{quest.title}</h3>
                      <div className={`${typeInfo.color} bg-opacity-20 rounded-full px-2 py-0.5 text-xs font-bold text-white`}>
                        {quest.type}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-3 font-medium">{quest.description}</p>
                    
                    {/* 进度条 */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-semibold">进度</span>
                        <span className={isCompleted ? 'text-green-600 font-bold' : 'text-gray-800 font-bold'}>
                          {quest.progress}/{quest.target}
                        </span>
                      </div>
                      <div className={`${isCompleted ? 'bg-green-300' : 'bg-blue-300'} rounded-full h-2`}>
                        <div 
                          className={`h-2 rounded-full ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'} shadow-md`} 
                          style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      {/* 奖励 */}
                      <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-lg px-3 py-1.5 flex items-center shadow">
                        <i className="fas fa-coins text-yellow-600 mr-1 font-bold"></i>
                        <span className="font-bold text-yellow-700">{quest.reward}</span>
                      </div>
                      
                      {/* 操作按钮 */}
                      {quest.isPuzzle ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openPuzzleModal(quest)}
                          disabled={isCompleted || isClaimed}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            isCompleted || isClaimed
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                              : 'bg-purple-600 text-white hover:bg-purple-500'
                          }`}
                        >
                          {isCompleted || isClaimed ? '已完成' : '解答谜题'}
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => claimReward(quest)}
                          disabled={!isCompleted || isClaimed || claimingQuestId === quest.id}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            !isCompleted 
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                              : isClaimed
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-500'
                          }`}
                        >
                          {claimingQuestId === quest.id ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-1"></i>
                              处理中...
                            </>
                          ) : !isCompleted ? '进行中' : isClaimed ? '已领取' : '领取奖励'}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-8 border border-blue-500/20 flex flex-col items-center justify-center min-h-[400px]">
            <i className="fas fa-tasks text-5xl text-gray-600 mb-4"></i>
            <h3 className="text-xl font-medium mb-2">暂无任务</h3>
            <p className="text-gray-400 text-center">请稍后再来查看新任务</p>
          </div>
        )}
      </motion.div>

      {/* 谜题模态框 */}
      {showPuzzleModal && currentPuzzle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPuzzleModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 max-w-md w-full border-2 border-purple-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-2">🎯 寻宝谜题</h3>
            <p className="text-gray-700 mb-6 font-medium">解开谜题，赢取丰厚奖励！</p>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 mb-6 border-2 border-purple-300">
              <p className="text-xl text-center mb-4 font-bold text-gray-800">{currentPuzzle.title}</p>
              <p className="text-gray-700 text-center mb-6 font-medium">{currentPuzzle.description}</p>
              
              <div className="mb-4">
                <input
                  type="text"
                  value={puzzleAnswer}
                  onChange={(e) => setPuzzleAnswer(e.target.value)}
                  placeholder="输入你的答案..."
                  className="w-full bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                />
              </div>
              
              <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg p-3 flex items-center justify-between border-2 border-yellow-400 shadow">
                <div className="flex items-center">
                  <i className="fas fa-gift text-yellow-600 mr-2 font-bold"></i>
                  <span className="text-gray-800 font-semibold">完成奖励</span>
                </div>
                <div className="flex items-center font-bold text-yellow-700">
                  <i className="fas fa-coins text-yellow-600 mr-1\"></i>
                  {currentPuzzle.reward}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPuzzleModal(false)}
                className="flex-1 py-3 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl text-gray-800 font-bold hover:from-gray-400 hover:to-gray-500 transition-all shadow"
              >
                取消
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={submitPuzzleAnswer}
                disabled={puzzleAnswer.trim() === ''}
                className={`flex-1 py-3 rounded-xl text-white font-bold transition-all shadow-lg ${
                  puzzleAnswer.trim() !== '' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                提交答案
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}