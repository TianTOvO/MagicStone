import { useContext, useState } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { useContracts } from '@/hooks/useContracts';
import { getContractAddresses } from '@/lib/contractAddresses';
import { STONE_GRADE_COLORS, STONE_GRADE_NAMES, TOOL_LEVEL_COLORS, TOOL_LEVEL_NAMES } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function PolishingPage() {
  const { userData } = useContext(UserDataContext);
  const { connected, connectWallet, contracts, polish, approveStone, approveTool } = useContracts();
  const [selectedStone, setSelectedStone] = useState<number | null>(null);
  const [selectedTool, setSelectedTool] = useState<number | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);

  const polishableStones = userData.stones.filter(stone => stone.isPolishable);
  const usableTools = userData.tools.filter(tool => tool.durability > 0);

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

    // Early validation — before any wallet interaction
    const stone = polishableStones.find(s => s.id === selectedStone);
    const tool = usableTools.find(t => t.id === selectedTool);
    if (!stone || !tool) {
      toast.error('选择有误，请重新选择');
      return;
    }
    if (stone.damage >= stone.damageLimit) {
      toast.error('该原石损耗已达上限，无法继续打磨');
      return;
    }
    if (tool.durability <= 0) {
      toast.error('该工具耐久度已耗尽');
      return;
    }

    try {
      setIsPolishing(true);

      const addresses = getContractAddresses();
      const polishingAddress = addresses.polishing;

      toast.loading('正在检查授权...');
      try {
        if (contracts.stoneNFT) {
          toast.loading('正在授权原石...');
          await approveStone(polishingAddress, selectedStone);
          toast.success('原石授权成功');
        }
        if (contracts.toolNFT) {
          toast.loading('正在授权工具...');
          await approveTool(polishingAddress, selectedTool);
          toast.success('工具授权成功');
        }
      } catch {
        console.warn('Approval may have failed or already granted');
      }

      toast.loading('正在执行打磨...');
      await polish(selectedStone, selectedTool);
      toast.success('打磨成功！原石已更新。');

      setTimeout(() => {
        setSelectedStone(null);
        setSelectedTool(null);
        setIsPolishing(false);
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : '打磨失败';
      toast.error(`错误: ${message}`);
      setIsPolishing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } },
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
        {/* Stone selection */}
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
                  onClick={() => setSelectedStone(stone.id)}
                  className={`rounded-xl p-4 cursor-pointer border-2 hover:scale-105 active:scale-95 transition-all duration-150 ${
                    selectedStone === stone.id
                      ? 'bg-gradient-to-br from-blue-400 to-cyan-400 border-blue-600 shadow-lg shadow-blue-500/50 scale-105'
                      : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 hover:border-blue-500'
                  }`}
                >
                  <div className="relative h-24 flex items-center justify-center mb-3">
                    <div className={`absolute inset-0 rounded-full ${STONE_GRADE_COLORS[stone.grade]} ${selectedStone === stone.id ? 'opacity-0' : 'opacity-20'} blur-xl`}></div>
                    <i className={`fas fa-gem text-5xl ${selectedStone === stone.id ? 'text-white' : 'text-blue-600'} relative`}></i>
                  </div>
                  <h4 className={`text-center font-bold text-sm ${selectedStone === stone.id ? 'text-white' : 'text-gray-800'}`}>
                    {STONE_GRADE_NAMES[stone.grade]}原石
                  </h4>
                  <p className={`text-center text-xs mt-1 ${selectedStone === stone.id ? 'text-blue-50' : 'text-gray-700'}`}>
                    {stone.damage}/{stone.damageLimit} 损耗
                  </p>
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

        {/* Polish operation */}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-300">
                <p className="text-sm text-gray-700 font-semibold mb-2">选定的原石</p>
                {selectedStone ? (
                  <>
                    <div className="h-16 flex items-center justify-center relative">
                      {(() => {
                        const s = userData.stones.find(st => st.id === selectedStone);
                        if (s) return (
                          <>
                            <div className={`absolute inset-0 rounded-full ${STONE_GRADE_COLORS[s.grade]} opacity-20 blur-xl`}></div>
                            <i className="fas fa-gem text-3xl text-white relative"></i>
                          </>
                        );
                      })()}
                    </div>
                    <p className="text-sm font-medium mt-2">
                      {(() => { const s = userData.stones.find(st => st.id === selectedStone); return s ? STONE_GRADE_NAMES[s.grade] + '原石' : ''; })()}
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
                        const t = userData.tools.find(tl => tl.id === selectedTool);
                        if (t) return (
                          <>
                            <div className={`absolute inset-0 rounded-full ${TOOL_LEVEL_COLORS[t.level]} opacity-20 blur-xl`}></div>
                            <i className="fas fa-wrench text-3xl text-white relative"></i>
                          </>
                        );
                      })()}
                    </div>
                    <p className="text-sm font-medium mt-2">
                      {(() => { const t = userData.tools.find(tl => tl.id === selectedTool); return t ? TOOL_LEVEL_NAMES[t.level] + '工具' : ''; })()}
                    </p>
                  </>
                ) : (
                  <div className="h-20 flex items-center justify-center">
                    <i className="fas fa-wrench text-3xl text-gray-400"></i>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handlePolish}
              disabled={!selectedStone || !selectedTool || isPolishing || !connected}
              className={`w-full py-4 rounded-xl font-bold text-lg hover:scale-105 active:scale-[0.98] transition-all ${
                (!selectedStone || !selectedTool || isPolishing)
                  ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 cursor-not-allowed shadow-md'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/50 hover:shadow-purple-600/70 hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              {isPolishing ? (
                <div className="flex items-center justify-center">
                  <div className="relative w-6 h-6 mr-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-2 border-t-transparent rounded-full border-white"
                    />
                  </div>
                  打磨中...
                </div>
              ) : !connected ? (
                <div className="flex items-center justify-center">
                  <i className="fas fa-plug mr-2"></i> 请先连接钱包
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="fas fa-wrench mr-2"></i> 开始打磨
                </div>
              )}
            </button>

            {isPolishing && (
              <div className="flex items-center justify-center gap-2 py-2 text-purple-600 font-semibold">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <i className="fas fa-spinner text-lg"></i>
                </motion.div>
                交易确认中...
              </div>
            )}

            {/* Upgrade probability */}
            {selectedStone && selectedTool && (
              (() => {
                const stone = polishableStones.find(s => s.id === selectedStone);
                const tool = usableTools.find(t => t.id === selectedTool);
                if (!stone || !tool) return null;
                const baseArr = [50, 30, 15, 5];
                const base = baseArr[Math.min(stone.grade, 3)] ?? 0;
                const chance = Math.min(base + tool.level * 5, 95);
                return (
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 text-center border-2 border-amber-300 mb-4">
                    <p className="text-sm text-amber-700 font-semibold">本次打磨升级概率</p>
                    <p className="text-3xl font-black text-amber-600">{chance}%</p>
                    <p className="text-xs text-amber-500 mt-1">基础 {base}% + 工具加成 {tool.level * 5}%</p>
                  </div>
                );
              })()
            )}

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

        {/* Tool selection */}
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
                  onClick={() => setSelectedTool(tool.id)}
                  className={`rounded-xl p-4 cursor-pointer border-2 hover:scale-105 active:scale-95 transition-all duration-150 ${
                    selectedTool === tool.id
                      ? 'bg-gradient-to-br from-green-400 to-emerald-400 border-green-600 shadow-lg shadow-green-500/50 scale-105'
                      : 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300 hover:border-green-500'
                  }`}
                >
                  <div className="relative h-24 flex items-center justify-center mb-3">
                    <div className={`absolute inset-0 rounded-full ${TOOL_LEVEL_COLORS[tool.level]} ${selectedTool === tool.id ? 'opacity-0' : 'opacity-20'} blur-xl`}></div>
                    <i className={`fas fa-wrench text-5xl ${selectedTool === tool.id ? 'text-white' : 'text-green-600'} relative`}></i>
                  </div>
                  <h4 className={`text-center font-bold text-sm ${selectedTool === tool.id ? 'text-white' : 'text-gray-800'}`}>
                    {TOOL_LEVEL_NAMES[tool.level]}工具
                  </h4>
                  <p className={`text-center text-xs mt-1 ${selectedTool === tool.id ? 'text-green-50' : 'text-gray-700'}`}>
                    {tool.durability}/{tool.durabilityMax} 耐久
                  </p>
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
