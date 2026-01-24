import { useContext, useState } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// 工具等级和合成规则
const toolLevels = ['普通', '专业', '顶级', '传奇'];

const levelColors = {
  '普通': { bg: 'bg-gray-500', light: 'bg-gray-100', border: 'border-gray-300' },
  '专业': { bg: 'bg-green-500', light: 'bg-green-100', border: 'border-green-300' },
  '顶级': { bg: 'bg-blue-500', light: 'bg-blue-100', border: 'border-blue-300' },
  '传奇': { bg: 'bg-purple-500', light: 'bg-purple-100', border: 'border-purple-300' }
};

const getNextLevel = (currentLevel: string): string | null => {
  const index = toolLevels.indexOf(currentLevel);
  return index < toolLevels.length - 1 ? toolLevels[index + 1] : null;
};

export default function ToolCraftPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const [selectedLevel, setSelectedLevel] = useState<string>('普通');
  const [isCrafting, setCrafting] = useState(false);

  // 统计各等级工具数量
  const getToolCountByLevel = (level: string) => {
    return userData.tools.filter(t => t.level === level).length;
  };

  // 执行合成
  const handleCraft = async () => {
    const toolCount = getToolCountByLevel(selectedLevel);
    
    if (toolCount < 3) {
      toast.error(`${selectedLevel}工具不足，需要3个`);
      return;
    }

    const nextLevel = getNextLevel(selectedLevel);
    if (!nextLevel) {
      toast.error('传奇工具已是最高级，无法合成');
      return;
    }

    try {
      setCrafting(true);

      // 找到3个相同等级的工具
      const toolsToRemove: number[] = [];
      for (const tool of userData.tools) {
        if (tool.level === selectedLevel && toolsToRemove.length < 3) {
          toolsToRemove.push(tool.id);
        }
      }

      // 移除3个工具
      const filteredTools = userData.tools.filter(t => !toolsToRemove.includes(t.id));

      // 创建新的高级工具
      const durabilityMap = {
        '普通': 100,
        '专业': 100,
        '顶级': 100,
        '传奇': 150
      };

      const damageCoeffMap = {
        '普通': 1,
        '专业': 0.8,
        '顶级': 0.5,
        '传奇': 0.2
      };

      const durabilityLossMap = {
        '普通': 1,
        '专业': 0.8,
        '顶级': 0.5,
        '传奇': 0.2
      };

      const newTool = {
        id: Date.now(),
        level: nextLevel,
        当前耐久值: durabilityMap[nextLevel as keyof typeof durabilityMap],
        耐久上限: durabilityMap[nextLevel as keyof typeof durabilityMap],
        损耗影响系数: damageCoeffMap[nextLevel as keyof typeof damageCoeffMap],
        耐久消耗系数: durabilityLossMap[nextLevel as keyof typeof durabilityLossMap]
      };

      filteredTools.push(newTool);

      // 更新用户数据
      updateUserData({
        tools: filteredTools
      });

      toast.success(`🎉 成功将3个${selectedLevel}工具合成为1个${nextLevel}工具！`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '合成失败';
      toast.error(`错误: ${message}`);
    } finally {
      setCrafting(false);
    }
  };

  // 动画配置
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-cyan-50 via-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-cyan-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600">
          ⚒️ 工具合成站
        </h1>
        <p className="text-gray-700 text-lg font-medium">将3个相同等级的工具合成成更高一级的工具</p>
      </motion.div>

      {/* 合成规则说明 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {toolLevels.map((level, index) => {
          const nextLevel = getNextLevel(level);
          const colors = levelColors[level as keyof typeof levelColors];
          
          return (
            <motion.div
              key={level}
              variants={itemVariants}
              className={`${colors.light} rounded-xl p-4 border-2 ${colors.border} shadow-md`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">{level}工具</h3>
                {nextLevel && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-gray-600">×3</span>
                    <i className="fas fa-arrow-right text-gray-500"></i>
                    <span className="text-xs font-bold text-gray-600">{nextLevel}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">当前拥有:</span>
                  <span className="ml-2 font-bold text-gray-800">{getToolCountByLevel(level)}</span>
                </p>
                {nextLevel ? (
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">可合成:</span>
                    <span className="ml-2 font-bold text-gray-800">
                      {Math.floor(getToolCountByLevel(level) / 3)}个{nextLevel}工具
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-purple-600 font-semibold">最高等级</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 合成选择区 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border-2 border-blue-300 shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
          <i className="fas fa-hammer text-blue-600 mr-2"></i> 选择要合成的工具
        </h2>

        {/* 工具等级选择 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {toolLevels.map((level) => {
            const colors = levelColors[level as keyof typeof levelColors];
            const count = getToolCountByLevel(level);
            const nextLevel = getNextLevel(level);
            const isDisabled = count < 3 || !nextLevel;

            return (
              <motion.button
                key={level}
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                onClick={() => !isDisabled && setSelectedLevel(level)}
                disabled={isDisabled}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  selectedLevel === level && !isDisabled
                    ? `${colors.bg} text-white shadow-lg shadow-${colors.bg}/50 scale-105`
                    : isDisabled
                    ? `${colors.light} ${colors.border} opacity-50 cursor-not-allowed text-gray-500`
                    : `${colors.light} ${colors.border} hover:${colors.border} text-gray-800`
                }`}
              >
                <div className="font-bold text-lg mb-1">{level}工具</div>
                <div className="text-sm font-semibold">{count}/3</div>
                {isDisabled && (
                  <div className="text-xs mt-1 opacity-75">
                    {count < 3 ? '数量不足' : '最高等级'}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* 详细信息 */}
        {selectedLevel && getNextLevel(selectedLevel) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 mb-6 border-2 border-blue-200"
          >
            <h3 className="font-bold text-lg mb-4 text-gray-800">合成预览</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                      duration: 2,
                      delay: i * 0.2,
                      repeat: Infinity
                    }}
                    className="text-center"
                  >
                    <div className="bg-gray-100 rounded-lg p-4 mb-2">
                      <i className="fas fa-wrench text-2xl text-gray-600"></i>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{selectedLevel}</p>
                  </motion.div>
                ))}
              </div>

              <div className="text-3xl text-blue-600 font-bold">+</div>

              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
                className="text-center"
              >
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg p-6 mb-2 border-2 border-blue-400 shadow-lg">
                  <i className="fas fa-wrench text-3xl text-blue-600"></i>
                </div>
                <p className="text-sm font-bold text-blue-800">{getNextLevel(selectedLevel)}</p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* 合成按钮 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCraft}
          disabled={
            isCrafting ||
            !selectedLevel ||
            getToolCountByLevel(selectedLevel) < 3 ||
            !getNextLevel(selectedLevel)
          }
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            isCrafting ||
            !selectedLevel ||
            getToolCountByLevel(selectedLevel) < 3 ||
            !getNextLevel(selectedLevel)
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/50 hover:shadow-blue-600/70 hover:from-blue-700 hover:to-cyan-700'
          }`}
        >
          {isCrafting ? (
            <div className="flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="mr-2"
              >
                <i className="fas fa-spinner"></i>
              </motion.div>
              合成中...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <i className="fas fa-hammer mr-2"></i>
              开始合成
            </div>
          )}
        </motion.button>
      </motion.div>

      {/* 工具库存 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-300 shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
          <i className="fas fa-tools text-purple-600 mr-2"></i> 工具库存
        </h2>

        {userData.tools.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-box-open text-4xl text-gray-400 mb-3"></i>
            <p className="text-gray-600 font-semibold">还没有工具，去商城购买吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {toolLevels.map((level) => {
              const tools = userData.tools.filter(t => t.level === level);
              const colors = levelColors[level as keyof typeof levelColors];

              if (tools.length === 0) return null;

              return (
                <motion.div
                  key={level}
                  variants={itemVariants}
                  className={`${colors.light} rounded-xl p-4 border-2 ${colors.border}`}
                >
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                    <i className="fas fa-wrench mr-2" style={{ color: colors.bg.split('-')[1] }}></i>
                    {level}工具 ({tools.length}个)
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tools.map((tool) => (
                      <div
                        key={tool.id}
                        className="bg-white bg-opacity-50 rounded-lg p-2 text-sm text-gray-700"
                      >
                        <div className="flex justify-between">
                          <span>耐久: {tool.当前耐久值}/{tool.耐久上限}</span>
                          <span className="text-gray-600">ID: {tool.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
