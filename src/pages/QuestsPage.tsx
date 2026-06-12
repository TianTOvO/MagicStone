import { useContext, useState, useEffect } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { useContracts } from '@/contexts/walletContext';
import { Quest, QUEST_TYPE_INFO } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const mockQuests: Quest[] = [
  { id: 1, type: '日常', title: '打磨5次矿石', description: '使用打磨工具打磨任意矿石5次', progress: 0, target: 5, reward: 100 },
  { id: 2, type: '日常', title: '收集3块玛瑙', description: '通过打磨或购买获得3块玛瑙等级的矿石', progress: 0, target: 3, reward: 200 },
  { id: 3, type: '成就', title: '首次打磨成功', description: '成功将一块原石升级为玛瑙', progress: 0, target: 1, reward: 50 },
  { id: 4, type: '成就', title: '工具大师', description: '拥有3个专业级别的打磨工具', progress: 0, target: 3, reward: 300 },
  { id: 5, type: '寻宝', title: '寻找神秘矿石', description: '解开谜题：什么矿石越打磨越亮，却不会变小？', progress: 0, target: 1, reward: 1000, isPuzzle: true },
  { id: 6, type: '团队', title: '极速研磨', description: '与3名队友一起，在10分钟内完成50次打磨', progress: 0, target: 1, reward: 500 },
];

export default function QuestsPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const { connected, account, contracts } = useContracts();
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'achievement' | 'treasure' | 'team'>('all');
  const [showPuzzleModal, setShowPuzzleModal] = useState(false);
  const [puzzleAnswer, setPuzzleAnswer] = useState('');
  const [currentPuzzle, setCurrentPuzzle] = useState<Quest | null>(null);
  const [claimingQuestId, setClaimingQuestId] = useState<number | null>(null);
  const [chainQuests, setChainQuests] = useState<Quest[]>([]);
  const [chainProgress, setChainProgress] = useState<Record<number, { progress: number; completed: boolean; claimed: boolean }>>({});

  // Load quests from chain when connected
  useEffect(() => {
    if (!connected || !contracts.quest) return;
    (async () => {
      try {
        const count = Number(await contracts.quest!.getQuestCount());
        const quests: Quest[] = [];
        const progressMap: Record<number, { progress: number; completed: boolean; claimed: boolean }> = {};

        for (let i = 0; i < count; i++) {
          const info = await contracts.quest!.getQuestInfo(i);
          const typeNames = ['日常', '成就', '寻宝', '团队'];
          quests.push({
            id: i,
            type: typeNames[Number(info.questType)] || '日常',
            title: info.description,
            description: info.description,
            progress: 0,
            target: 1,
            reward: Number(info.reward),
            isPuzzle: false,
          });
        }

        if (account) {
          const userQuestIds = await contracts.quest!.getUserQuestIds(account);
          for (const qId of userQuestIds) {
            const prog = await contracts.quest!.userProgress(account, Number(qId));
            progressMap[Number(qId)] = {
              progress: Number(prog.progress),
              completed: prog.completed,
              claimed: prog.claimedAt > 0n,
            };
          }
        }

        setChainQuests(quests);
        setChainProgress(progressMap);
      } catch {
        // Chain not available — use mock data
      }
    })();
  }, [connected, contracts.quest, account]);

  const quests: Quest[] = (connected && chainQuests.length > 0 ? chainQuests : mockQuests).map(quest => {
    const cp = chainProgress[quest.id];
    const uq = userData.quests.find(q => q.id === quest.id);
    if (cp) {
      return { ...quest, ...uq, progress: cp.progress, target: quest.target || 1, claimed: cp.claimed };
    }
    return uq ? { ...quest, ...uq } : quest;
  });

  const filteredQuests = quests.filter(quest => {
    if (activeTab === 'all') return true;
    const typeMap: Record<string, string> = { daily: '日常', achievement: '成就', treasure: '寻宝', team: '团队' };
    return quest.type === typeMap[activeTab];
  });

  const claimReward = async (quest: Quest) => {
    if (!account) {
      toast.error('请先连接钱包');
      return;
    }

    setClaimingQuestId(quest.id);

    try {
      if (connected && contracts.quest) {
        const tx = await contracts.quest.claimReward(quest.id);
        await tx.wait();
      }

      const updatedQuests = userData.quests.map(q => {
        if (q.id === quest.id) return { ...q, claimed: true };
        return q;
      });

      if (!updatedQuests.find(q => q.id === quest.id)) {
        updatedQuests.push({ ...quest, claimed: true });
      }

      updateUserData({ quests: updatedQuests, coins: userData.coins + quest.reward });
      toast.success(`成功领取任务奖励：${quest.reward} 游戏币`);
    } catch (error: any) {
      console.error('领取奖励失败:', error);
      toast.error(error.message || '领取奖励失败，请重试');
    } finally {
      setClaimingQuestId(null);
    }
  };

  const submitPuzzleAnswer = () => {
    if (!currentPuzzle) return;

    const correctAnswers = ['钻石', '砖石', 'diamond', 'Diamond'];

    if (correctAnswers.includes(puzzleAnswer.trim())) {
      const newStone = {
        id: Date.now(),
        grade: 0,
        subGrade: 0,
        damage: 0,
        damageLimit: 150 + Math.floor(Math.random() * 51),
        mysterious: true,
        isPolishable: true,
        acquiredAt: Date.now(),
      };

      updateUserData({
        stones: [...userData.stones, newStone],
        coins: userData.coins + currentPuzzle.reward,
        quests: userData.quests.map(q =>
          q.id === currentPuzzle.id ? { ...q, progress: q.target } : q
        ),
      });

      toast.success(`恭喜！你解开了谜题，获得了${currentPuzzle.reward}游戏币和一块神秘矿石！`);
      setShowPuzzleModal(false);
      setPuzzleAnswer('');
    } else {
      toast.error('答案不正确，请再试一次');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
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

      <div className="bg-gradient-to-r from-green-100 to-emerald-100 backdrop-blur-sm rounded-2xl p-1 inline-flex overflow-x-auto whitespace-nowrap border-2 border-green-300 shadow">
        {([
          { key: 'all' as const, label: '全部任务', icon: undefined as string | undefined },
          { key: 'daily' as const, label: '日常任务', icon: 'calendar-day' as string | undefined },
          { key: 'achievement' as const, label: '成就任务', icon: 'trophy' as string | undefined },
          { key: 'treasure' as const, label: '寻宝任务', icon: 'map-marked-alt' as string | undefined },
          { key: 'team' as const, label: '团队任务', icon: 'users' as string | undefined },
        ]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === key
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'text-gray-700 hover:text-green-600'
            }`}
          >
            {icon && <i className={`fas fa-${icon} mr-1`}></i>}
            {label}
          </button>
        ))}
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
        {filteredQuests.length > 0 ? (
          filteredQuests.map((quest) => {
            const typeInfo = QUEST_TYPE_INFO[quest.type] || { color: 'bg-gray-600', icon: 'clipboard-list' };
            const isCompleted = quest.progress >= quest.target;
            const isClaimed = quest.claimed || false;

            return (
              <motion.div
                key={quest.id} variants={itemVariants}
                className={`rounded-2xl p-5 border-2 shadow-lg transition-all ${
                  isCompleted
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400'
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 border-purple-300'
                }`}
              >
                <div className="flex items-start">
                  <div className={`${typeInfo.color} rounded-lg p-3 mr-4 flex-shrink-0 shadow`}>
                    <i className={`fas fa-${typeInfo.icon} text-white text-lg`}></i>
                  </div>

                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-lg font-bold text-gray-800">{quest.title}</h3>
                      <div className={`${typeInfo.color} bg-opacity-20 rounded-full px-2 py-0.5 text-xs font-bold text-white`}>
                        {quest.type}
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm mb-3 font-medium">{quest.description}</p>

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
                      <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-lg px-3 py-1.5 flex items-center shadow">
                        <i className="fas fa-coins text-yellow-600 mr-1 font-bold"></i>
                        <span className="font-bold text-yellow-700">{quest.reward}</span>
                      </div>

                      {quest.isPuzzle ? (
                        <button
                          onClick={() => { setCurrentPuzzle(quest); setPuzzleAnswer(''); setShowPuzzleModal(true); }}
                          disabled={isCompleted || isClaimed}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95 ${
                            isCompleted || isClaimed ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-500'
                          }`}
                        >
                          {isCompleted || isClaimed ? '已完成' : '解答谜题'}
                        </button>
                      ) : (
                        <button
                          onClick={() => claimReward(quest)}
                          disabled={!isCompleted || isClaimed || claimingQuestId === quest.id}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95 ${
                            !isCompleted ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                              : isClaimed ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-500'
                          }`}
                        >
                          {claimingQuestId === quest.id ? (
                            <><i className="fas fa-spinner fa-spin mr-1"></i>处理中...</>
                          ) : !isCompleted ? '进行中' : isClaimed ? '已领取' : '领取奖励'}
                        </button>
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

      {/* Puzzle modal */}
      {showPuzzleModal && currentPuzzle && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPuzzleModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
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
                  type="text" value={puzzleAnswer}
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
                  <i className="fas fa-coins text-yellow-600 mr-1"></i>
                  {currentPuzzle.reward}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPuzzleModal(false)}
                className="flex-1 py-3 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl text-gray-800 font-bold hover:from-gray-400 hover:to-gray-500 hover:scale-105 active:scale-95 transition-all shadow"
              >取消</button>
              <button
                onClick={submitPuzzleAnswer}
                disabled={puzzleAnswer.trim() === ''}
                className={`flex-1 py-3 rounded-xl text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg ${
                  puzzleAnswer.trim() !== ''
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >提交答案</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
