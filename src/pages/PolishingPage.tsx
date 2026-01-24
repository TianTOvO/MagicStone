import { useContext, useState, useEffect } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { useContracts } from '@/hooks/useContracts';
import { getContractAddresses } from '@/lib/contractAddresses';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function PolishingPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const { connected, account, connectWallet, contracts, polish, approveStone, approveTool } = useContracts();
  const [selectedStone, setSelectedStone] = useState<number | null>(null);
  const [selectedTool, setSelectedTool] = useState<number | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishingProgress, setPolishingProgress] = useState(0);

  // 筛选可打磨的原石和可用的工具
  const polishableStones = userData.stones.filter(stone => stone.isPolishable);
  const usableTools = userData.tools.filter(tool => tool.当前耐久值 > 0);

  // 打磨概率配置
  const polishingChances = {
    '平凡': 0.4,     // 40% 概率升级到奇特
    '奇特': 0.2,     // 20% 概率升级到珍稀
    '珍稀': 0.1,     // 10% 概率升级到璀璨
    '璀璨': 0        // 璀璨已是最高等级
  };

  // 工具损耗配置
  const toolDurabilityCost = {
    '普通': 10,
    '专业': 5,
    '顶级': 3,
    '传奇': 1
  };

  // 等级提升配置
  const levelUpgrades = {
    '平凡': '奇特',
    '奇特': '珍稀',
    '珍稀': '璀璨',
    '璀璨': '璀璨'
  };

  // 获取等级对应的颜色
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

  // 执行打磨操作 - 区块链版本
  const handlePolish = async () => {
    if (!selectedStone || !selectedTool) {
      toast.error('请选择原石和工具');
      return;
    }

    if (!connected) {
      toast.error('请先连接钱包');
      await connectWallet();
      return;
    }

    if (isPolishing) return;

    try {
      setIsPolishing(true);
      setPolishingProgress(0);

      const addresses = getContractAddresses();
      const polishingAddress = addresses.polishing;

      // 检查并进行授权
      toast.loading('正在检查授权...');
      
      try {
        // 授权原石给Polishing合约
        if (contracts.stoneNFT) {
          toast.loading('正在授权原石...');
          const approveStoneTx = await approveStone(polishingAddress, selectedStone);
          toast.success('原石授权成功');
        }

        // 授权工具给Polishing合约
        if (contracts.toolNFT) {
          toast.loading('正在授权工具...');
          const approveToolTx = await approveTool(polishingAddress, selectedTool);
          toast.success('工具授权成功');
        }
      } catch (approvalError) {
        // 授权可能失败或已被批准，继续尝试执行打磨
        console.warn('授权提示:', approvalError);
      }

      // 模拟打磨动画
      const interval = setInterval(() => {
        setPolishingProgress(prev => {
          if (prev >= 80) {
            clearInterval(interval);
            return 80;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      // 调用打磨合约
      toast.loading('正在执行打磨...');
      const tx = await polish(selectedStone, selectedTool);
      
      clearInterval(interval);
      setPolishingProgress(100);

      // 打磨成功
      toast.success('打磨成功！原石已更新。');
      
      // 重置选择
      setTimeout(() => {
        setSelectedStone(null);
        setSelectedTool(null);
        setIsPolishing(false);
        setPolishingProgress(0);
      }, 1500);

    } catch (error) {
      const message = error instanceof Error ? error.message : '打磨失败';
      toast.error(`错误: ${message}`);
      setIsPolishing(false);
      setPolishingProgress(0);
    }
  };

  // 完成打磨并计算结果 (本地)
  const completePolishing = (stone: any, tool: any) => {
    // 计算升级概率
    const upgradeChance = polishingChances[stone.level as keyof typeof polishingChances];
    const isUpgradeSuccessful = Math.random() < upgradeChance;
    
    // 计算原石损耗增加 (10-20之间的随机值，乘以工具的损耗影响系数)
    const baseDamage = 10 + Math.floor(Math.random() * 11);
    const damageIncrease = Math.floor(baseDamage * tool.损耗影响系数);
    
    // 计算工具耐久消耗
    const durabilityCost = toolDurabilityCost[tool.level as keyof typeof toolDurabilityCost];
    
    // 更新数据
    const updatedStones = userData.stones.map(s => {
      if (s.id === stone.id) {
        const newDamage = s.损耗值 + damageIncrease;
        const newLevel = isUpgradeSuccessful ? levelUpgrades[s.level as keyof typeof levelUpgrades] : s.level;
        const isStillPolishable = newDamage < s.损耗上限;
        
        return {
          ...s,
          损耗值: newDamage,
          level: newLevel,
          isPolishable: isStillPolishable
        };
      }
      return s;
    });
    
    const updatedTools = userData.tools.map(t => {
      if (t.id === tool.id) {
        return {
          ...t,
          当前耐久值: Math.max(0, t.当前耐久值 - durabilityCost)
        };
      }
      return t;
    });
    
    // 更新用户数据
    updateUserData({
      stones: updatedStones,
      tools: updatedTools
    });
    
    // 更新任务进度
    updateQuestProgress('打磨5次原石', 1);
    
    // 显示结果
    setTimeout(() => {
      if (isUpgradeSuccessful) {
        toast.success(`恭喜！你的${stone.level}原石升级为${levelUpgrades[stone.level as keyof typeof levelUpgrades]}原石！`);
        // 完成首次打磨成就
        if (userData.quests.some(q => q.title === '首次打磨成功' && q.progress === 0)) {
          updateQuestProgress('首次打磨成功', 1);
          toast.success('解锁成就：首次打磨成功，获得奖励！');
        }
      } else {
        toast.info(`打磨完成，但未能升级。继续努力！`);
      }
      
      if (!updatedStones.find(s => s.id === stone.id)?.isPolishable) {
        toast.warning('这块原石已达到损耗上限，无法继续打磨。');
      }
      
      setIsPolishing(false);
      setSelectedStone(null);
      setSelectedTool(null);
    }, 500);
  };

  // 更新任务进度
  const updateQuestProgress = (questTitle: string, increment: number) => {
    const updatedQuests = userData.quests.map(q => {
      if (q.title === questTitle && q.progress < q.target) {
        return {
          ...q,
          progress: Math.min(q.progress + increment, q.target)
        };
      }
      return q;
    });
    
    updateUserData({
      quests: updatedQuests
    });
  };

  // 动画配置
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 rounded-2xl p-8 border-2 border-orange-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-600 to-red-600">✨ 打磨站</h1>
        <p className="text-gray-700 text-lg font-medium">选择你的原石和工具，开始打磨之旅</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 原石选择区 */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300 shadow-lg"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
            <i className="fas fa-gem text-blue-600 mr-2"></i> 选择原石
          </h2>
          
          {polishableStones.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {polishableStones.map((stone) => (
                <motion.div
                  key={stone.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedStone(stone.id)}
                  className={`rounded-xl p-4 cursor-pointer border-2 transition-all ${
                    selectedStone === stone.id 
                      ? 'bg-gradient-to-br from-blue-400 to-cyan-400 border-blue-600 shadow-lg shadow-blue-500/50 scale-105' 
                      : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 hover:border-blue-500'
                  }`}
                >
                  <div className="relative h-24 flex items-center justify-center mb-3">
                    <div className={`absolute inset-0 rounded-full ${getStoneLevelColor(stone.level)} ${selectedStone === stone.id ? 'opacity-0' : 'opacity-20'} blur-xl`}></div>
                    <i className={`fas fa-gem text-5xl ${selectedStone === stone.id ? 'text-white' : 'text-blue-600'} relative`}></i>
                  </div>
                  <h4 className={`text-center font-bold text-sm ${selectedStone === stone.id ? 'text-white' : 'text-gray-800'}`}>{stone.level}原石</h4>
                  <p className={`text-center text-xs mt-1 ${selectedStone === stone.id ? 'text-blue-50' : 'text-gray-700'}`}>{stone.损耗值}/{stone.损耗上限} 损耗</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-300">
              <i className="fas fa-gem text-4xl text-blue-500 mb-3"></i>
              <p className="text-gray-800 text-center font-semibold">没有可打磨的原石</p>
              <p className="text-gray-700 text-sm text-center mt-2">去商城购买更多原石吧！</p>
            </div>
          )}
        </motion.div>

        {/* 打磨操作区 */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-300 shadow-lg"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
            <i className="fas fa-wrench text-purple-600 mr-2"></i> 打磨操作
          </h2>
          
          <div className="space-y-6">
            {/* 选定的物品展示 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-300">
                <p className="text-sm text-gray-700 font-semibold mb-2">选定的原石</p>
                {selectedStone ? (
                  <>
                    <div className="h-16 flex items-center justify-center relative">
                      {(() => {
                        const stone = userData.stones.find(s => s.id === selectedStone);
                        if (stone) {
                          return (
                            <>
                              <div className={`absolute inset-0 rounded-full ${getStoneLevelColor(stone.level)} opacity-20 blur-xl`}></div>
                              <i className="fas fa-gem text-3xl text-white relative"></i>
                            </>
                          );
                        }
                      })()}
                    </div>
                    <p className="text-sm font-medium mt-2">
                      {userData.stones.find(s => s.id === selectedStone)?.level}原石
                    </p>
                  </>
                ) : (
                  <div className="h-20 flex items-center justify-center">
                    <i className="fas fa-gem text-3xl text-gray-400"></i>
                  </div>
                )}
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border border-green-300">
                <p className="text-sm text-gray-700 font-semibold mb-2">选定的工具</p>
                {selectedTool ? (
                  <>
                    <div className="h-16 flex items-center justify-center relative">
                      {(() => {
                        const tool = userData.tools.find(t => t.id === selectedTool);
                        if (tool) {
                          return (
                            <>
                              <div className={`absolute inset-0 rounded-full ${getToolLevelColor(tool.level)} opacity-20 blur-xl`}></div>
                              <i className="fas fa-wrench text-3xl text-white relative"></i>
                            </>
                          );
                        }
                      })()}
                    </div>
                    <p className="text-sm font-medium mt-2">
                      {userData.tools.find(t => t.id === selectedTool)?.level}工具
                    </p>
                  </>
                ) : (
                  <div className="h-20 flex items-center justify-center">
                    <i className="fas fa-wrench text-3xl text-gray-400"></i>
                  </div>
                )}
              </div>
            </div>
            
            {/* 打磨按钮 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePolish}
              disabled={!selectedStone || !selectedTool || isPolishing}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                (!selectedStone || !selectedTool || isPolishing) 
                  ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 cursor-not-allowed shadow-md' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/50 hover:shadow-purple-600/70 hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              {isPolishing ? (
                <div className="flex items-center justify-center">
                  <div className="relative w-6 h-6 mr-2">
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="absolute inset-0 border-2 border-t-transparent rounded-full border-white"
                    />
                  </div>
                  打磨中...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="fas fa-wrench mr-2"></i> 开始打磨
                </div>
              )}
            </motion.button>
            
            {/* 进度条 */}
            {isPolishing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600 font-semibold">打磨进度</span>
                  <span className="text-purple-700 font-bold">{polishingProgress}%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-3 border border-purple-300">
                  <motion.div 
                    className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${polishingProgress}%` }}
                    transition={{ duration: 0.1 }}
                  ></motion.div>
                </div>
              </div>
            )}
            
            {/* 打磨说明 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-sm border-2 border-purple-300">
              <h3 className="font-bold text-purple-700 mb-2">打磨说明</h3>
              <ul className="space-y-1 list-disc list-inside text-gray-700">
                <li>每次打磨都会增加原石损耗</li>
                <li>等级越高，升级概率越低</li>
                <li>高级工具减少损耗和耐久消耗</li>
                <li>损耗值达到上限后无法继续打磨</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* 工具选择区 */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border-2 border-green-300 shadow-lg"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
            <i className="fas fa-tools text-green-600 mr-2"></i> 选择工具
          </h2>
          
          {usableTools.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {usableTools.map((tool) => (
                <motion.div
                  key={tool.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`rounded-xl p-4 cursor-pointer border-2 transition-all ${
                    selectedTool === tool.id 
                      ? 'bg-gradient-to-br from-green-400 to-emerald-400 border-green-600 shadow-lg shadow-green-500/50 scale-105': 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300 hover:border-green-500'
                  }`}
                >
                  <div className="relative h-24 flex items-center justify-center mb-3">
                    <div className={`absolute inset-0 rounded-full ${getToolLevelColor(tool.level)} ${selectedTool === tool.id ? 'opacity-0' : 'opacity-20'} blur-xl`}></div>
                    <i className={`fas fa-wrench text-5xl ${selectedTool === tool.id ? 'text-white' : 'text-green-600'} relative`}></i>
                  </div>
                  <h4 className={`text-center font-bold text-sm ${selectedTool === tool.id ? 'text-white' : 'text-gray-800'}`}>{tool.level}工具</h4>
                  <p className={`text-center text-xs mt-1 ${selectedTool === tool.id ? 'text-green-50' : 'text-gray-700'}`}>{tool.当前耐久值}/{tool.耐久上限} 耐久</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-300">
              <i className="fas fa-tools text-4xl text-green-500 mb-3"></i>
              <p className="text-gray-800 text-center font-semibold">没有可用的工具</p>
              <p className="text-gray-700 text-sm text-center mt-2">去商城购买更多工具吧！</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}