import { useContext, useState } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { useContracts } from '@/hooks/useContracts';
import { TOOL_LEVEL_NAMES, TOOL_LEVEL_COLORS } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const TOOL_LEVELS = [0, 1, 2, 3];

const DURABILITY_MAP: Record<number, number> = { 0: 100, 1: 100, 2: 100, 3: 150 };
const LOSS_COEFF_MAP: Record<number, number> = { 0: 1, 1: 0.8, 2: 0.5, 3: 0.2 };
const DURATION_CONSUMPTION_MAP: Record<number, number> = { 0: 1, 1: 0.8, 2: 0.5, 3: 0.2 };

const getNextLevel = (currentLevel: number): number | null => {
  return currentLevel < 3 ? currentLevel + 1 : null;
};

export default function ToolCraftPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const { connected, contracts } = useContracts();
  const [selectedLevel, setSelectedLevel] = useState<number>(0);
  const [isCrafting, setCrafting] = useState(false);

  const getToolCountByLevel = (level: number) => {
    return userData.tools.filter(t => t.level === level).length;
  };

  const handleCraft = async () => {
    const toolCount = getToolCountByLevel(selectedLevel);
    if (toolCount < 3) {
      toast.error(`${TOOL_LEVEL_NAMES[selectedLevel]}工具不足，需要3个`);
      return;
    }

    const nextLevel = getNextLevel(selectedLevel);
    if (nextLevel === null) {
      toast.error('传奇工具已是最高级，无法合成');
      return;
    }

    setCrafting(true);

    const toolsToRemove: number[] = [];
    for (const tool of userData.tools) {
      if (tool.level === selectedLevel && toolsToRemove.length < 3) {
        toolsToRemove.push(tool.id);
      }
    }

    // Try chain crafting when connected
    if (connected && contracts.toolNFT) {
      try {
        await (await contracts.toolNFT.craftTool(
          toolsToRemove[0], toolsToRemove[1], toolsToRemove[2]
        )).wait();
        toast.success(`成功将3个${TOOL_LEVEL_NAMES[selectedLevel]}工具合成为1个${TOOL_LEVEL_NAMES[nextLevel]}工具！`);
        setCrafting(false);
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : '链上合成失败';
        toast.error(msg);
        setCrafting(false);
        return;
      }
    }

    // Local fallback
    const filteredTools = userData.tools.filter(t => !toolsToRemove.includes(t.id));

    const newTool = {
      id: Date.now(),
      level: nextLevel,
      durability: DURABILITY_MAP[nextLevel],
      durabilityMax: DURABILITY_MAP[nextLevel],
      lossCoeff: LOSS_COEFF_MAP[nextLevel],
      durabilityConsumption: DURATION_CONSUMPTION_MAP[nextLevel],
    };

    filteredTools.push(newTool);
    updateUserData({ tools: filteredTools });

    toast.success(`成功将3个${TOOL_LEVEL_NAMES[selectedLevel]}工具合成为1个${TOOL_LEVEL_NAMES[nextLevel]}工具！`);
    setCrafting(false);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } },
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-cyan-50 via-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-cyan-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600">⚒️ 工具合成站</h1>
        <p className="text-gray-700 text-lg font-medium">将3个相同等级的工具合成成更高一级的工具</p>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {TOOL_LEVELS.map((level) => {
          const nextLevel = getNextLevel(level);
          return (
            <motion.div key={level} variants={itemVariants}
              className={`rounded-xl p-4 border-2 shadow-md ${level === 3 ? 'bg-purple-100 border-purple-300' : 'bg-gray-100 border-gray-300'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">{TOOL_LEVEL_NAMES[level]}工具</h3>
                {nextLevel !== null && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-gray-600">×3</span>
                    <i className="fas fa-arrow-right text-gray-500"></i>
                    <span className="text-xs font-bold text-gray-600">{TOOL_LEVEL_NAMES[nextLevel]}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">当前拥有:</span>
                  <span className="ml-2 font-bold text-gray-800">{getToolCountByLevel(level)}</span>
                </p>
                {nextLevel !== null ? (
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">可合成:</span>
                    <span className="ml-2 font-bold text-gray-800">
                      {Math.floor(getToolCountByLevel(level) / 3)}个{TOOL_LEVEL_NAMES[nextLevel]}工具
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border-2 border-blue-300 shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
          <i className="fas fa-hammer text-blue-600 mr-2"></i> 选择要合成的工具
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {TOOL_LEVELS.map((level) => {
            const count = getToolCountByLevel(level);
            const nextLevel = getNextLevel(level);
            const isDisabled = count < 3 || nextLevel === null;

            return (
              <button
                key={level}
                onClick={() => !isDisabled && setSelectedLevel(level)}
                disabled={isDisabled}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  selectedLevel === level && !isDisabled
                    ? `${TOOL_LEVEL_COLORS[level]} text-white shadow-lg scale-105`
                    : isDisabled
                    ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed text-gray-500'
                    : 'bg-gray-100 border-gray-300 hover:border-gray-400 text-gray-800 hover:scale-105 active:scale-95'
                }`}
              >
                <div className="font-bold text-lg mb-1">{TOOL_LEVEL_NAMES[level]}工具</div>
                <div className="text-sm font-semibold">{count}/3</div>
                {isDisabled && (
                  <div className="text-xs mt-1 opacity-75">
                    {count < 3 ? '数量不足' : '最高等级'}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {getNextLevel(selectedLevel) !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 mb-6 border-2 border-blue-200"
          >
            <h3 className="font-bold text-lg mb-4 text-gray-800">合成预览</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {[1, 2, 3].map((i) => (
                  <motion.div key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                    className="text-center"
                  >
                    <div className="bg-gray-100 rounded-lg p-4 mb-2">
                      <i className="fas fa-wrench text-2xl text-gray-600"></i>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{TOOL_LEVEL_NAMES[selectedLevel]}</p>
                  </motion.div>
                ))}
              </div>

              <div className="text-3xl text-blue-600 font-bold">+</div>

              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-center"
              >
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg p-6 mb-2 border-2 border-blue-400 shadow-lg">
                  <i className="fas fa-wrench text-3xl text-blue-600"></i>
                </div>
                <p className="text-sm font-bold text-blue-800">{TOOL_LEVEL_NAMES[getNextLevel(selectedLevel)!]}</p>
              </motion.div>
            </div>
          </motion.div>
        )}

        <button
          onClick={handleCraft}
          disabled={isCrafting || getToolCountByLevel(selectedLevel) < 3 || getNextLevel(selectedLevel) === null}
          className={`w-full py-4 rounded-xl font-bold text-lg hover:scale-105 active:scale-95 transition-all ${
            isCrafting || getToolCountByLevel(selectedLevel) < 3 || getNextLevel(selectedLevel) === null
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/50 hover:shadow-blue-600/70 hover:from-blue-700 hover:to-cyan-700'
          }`}
        >
          {isCrafting ? (
            <div className="flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="mr-2">
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
        </button>
      </motion.div>

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
            {TOOL_LEVELS.map((level) => {
              const tools = userData.tools.filter(t => t.level === level);
              if (tools.length === 0) return null;

              return (
                <motion.div key={level} variants={itemVariants}
                  className="bg-gray-100 rounded-xl p-4 border-2 border-gray-300"
                >
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                    <i className="fas fa-wrench mr-2"></i>
                    {TOOL_LEVEL_NAMES[level]}工具 ({tools.length}个)
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tools.map((tool) => (
                      <div key={tool.id} className="bg-white bg-opacity-50 rounded-lg p-2 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>耐久: {tool.durability}/{tool.durabilityMax}</span>
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
