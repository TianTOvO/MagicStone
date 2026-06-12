import { useContext, useState } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { useContracts } from '@/contexts/walletContext';
import { Stone, Tool, STONE_GRADE_COLORS, TOOL_LEVEL_COLORS } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'stone' | 'tool';
  isSpecial?: boolean;
  // Stone params
  grade?: number;
  subGrade?: number;
  mysterious?: boolean;
  damageLimitMin?: number;
  damageLimitMax?: number;
  // Tool params
  level?: number;
  durabilityMax?: number;
  lossCoeff?: number;
  durabilityConsumption?: number;
}

const shopItems: ShopItem[] = [
  {
    id: 'stone-0', name: '原石', description: '未经打磨的原始矿石，一切奇迹的起点',
    price: 100, category: 'stone', grade: 0, subGrade: 0, mysterious: false, damageLimitMin: 80, damageLimitMax: 120,
  },
  {
    id: 'tool-0', name: '普通工具', description: '能用就行',
    price: 50, category: 'tool', level: 0, durabilityMax: 100, lossCoeff: 1, durabilityConsumption: 1,
  },
  {
    id: 'stone-mystery', name: '神秘原石', description: '蕴含神秘力量的特殊矿石，有更高的升级潜力',
    price: 500, category: 'stone', grade: 0, subGrade: 0, mysterious: true, damageLimitMin: 120, damageLimitMax: 180,
    isSpecial: true,
  },
  {
    id: 'tool-1', name: '专业工具', description: '"这个就叫专业~"',
    price: 300, category: 'tool', level: 1, durabilityMax: 100, lossCoeff: 0.8, durabilityConsumption: 0.8,
  },
  {
    id: 'stone-1', name: '玛瑙', description: '纹理温润的半宝石，打磨初见成效',
    price: 800, category: 'stone', grade: 1, subGrade: 0, mysterious: false, damageLimitMin: 150, damageLimitMax: 200,
  },
  {
    id: 'stone-2', name: '冰种翡翠', description: '透明度高如冰块，清亮水头足',
    price: 1500, category: 'stone', grade: 2, subGrade: 2, mysterious: false, damageLimitMin: 180, damageLimitMax: 250,
    isSpecial: true,
  },
  {
    id: 'stone-3', name: '蓝钻', description: '含硼元素呈蓝色，极度稀有',
    price: 3000, category: 'stone', grade: 3, subGrade: 2, mysterious: false, damageLimitMin: 250, damageLimitMax: 350,
    isSpecial: true,
  },
  {
    id: 'tool-2', name: '顶级工具', description: '每一次打磨都显得格外自信。',
    price: 1200, category: 'tool', level: 2, durabilityMax: 100, lossCoeff: 0.5, durabilityConsumption: 0.5,
  },
  {
    id: 'tool-3', name: '传奇工具', description: '由传奇工匠打造传说中，它磨的不是石头，是命运。',
    price: 2500, category: 'tool', level: 3, durabilityMax: 150, lossCoeff: 0.2, durabilityConsumption: 0.2,
  },
];

export default function ShopPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const { connected, contracts, account } = useContracts();
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);

  const buyItem = async () => {
    if (!selectedItem) return;
    setIsBuying(true);
    const totalPrice = selectedItem.price * quantity;

    if (userData.coins < totalPrice) {
      toast.error('游戏币不足，无法购买');
      setIsBuying(false);
      return;
    }

    // Try chain minting when connected (requires owner access)
    let chainMinted = false;
    if (connected && contracts.stoneNFT && contracts.toolNFT) {
      try {
        const toAddr = account!;
        for (let i = 0; i < quantity; i++) {
          if (selectedItem.category === 'stone') {
            await (await contracts.stoneNFT.mintStone(
              toAddr,
              selectedItem.grade ?? 0,
              selectedItem.damageLimitMin ?? 100,
              selectedItem.mysterious ?? false
            )).wait();
          } else {
            await (await contracts.toolNFT.mintTool(
              toAddr,
              selectedItem.level ?? 0,
              selectedItem.durabilityMax ?? 100
            )).wait();
          }
        }
        chainMinted = true;
      } catch {
        // Not owner or chain error — fall back to local state
      }
    }

    if (!connected && !chainMinted) {
      toast.info('建议连接区块链钱包以保存数据');
    }

    const newStones: Stone[] = [...userData.stones];
    const newTools: Tool[] = [...userData.tools];

    for (let i = 0; i < quantity; i++) {
      if (selectedItem.category === 'stone') {
        const minD = selectedItem.damageLimitMin ?? 80;
        const maxD = selectedItem.damageLimitMax ?? 120;
        const damageLimit = Math.floor(Math.random() * (maxD - minD + 1)) + minD;

        newStones.push({
          id: Date.now() + i,
          grade: selectedItem.grade ?? 0,
          subGrade: selectedItem.subGrade ?? 0,
          damage: 0,
          damageLimit,
          mysterious: selectedItem.mysterious ?? false,
          isPolishable: true,
          acquiredAt: Date.now(),
        });
      } else {
        newTools.push({
          id: Date.now() + i,
          level: selectedItem.level ?? 0,
          durability: selectedItem.durabilityMax ?? 100,
          durabilityMax: selectedItem.durabilityMax ?? 100,
          lossCoeff: selectedItem.lossCoeff ?? 1,
          durabilityConsumption: selectedItem.durabilityConsumption ?? 1,
        });
      }
    }

    updateUserData({
      stones: selectedItem.category === 'stone' ? newStones : userData.stones,
      tools: selectedItem.category === 'tool' ? newTools : userData.tools,
      coins: userData.coins - totalPrice,
    });

    toast.success(`成功购买${quantity}个${selectedItem.name}`);
    setShowModal(false);
    setSelectedItem(null);
    setQuantity(1);
    setIsBuying(false);
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
        className="bg-gradient-to-r from-pink-50 via-rose-50 to-red-50 rounded-2xl p-8 border-2 border-pink-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-red-600">🛍️ 商城</h1>
        <p className="text-gray-700 text-lg font-medium">购买新的矿石和打磨工具</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-yellow-100 to-amber-100 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-400 flex items-center justify-between shadow-lg"
      >
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-yellow-300 to-amber-300 rounded-full p-3 mr-4 shadow">
            <i className="fas fa-coins text-white text-2xl"></i>
          </div>
          <div>
            <p className="text-gray-700 text-sm font-semibold">我的余额</p>
            <p className="text-3xl font-black flex items-center text-gray-900">
              <i className="fas fa-coins text-yellow-600 mr-2"></i>
              {userData.coins}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            updateUserData({ coins: userData.coins + 1000 });
            toast.success('管理员：添加了1000游戏币');
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-purple-600/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <i className="fas fa-wand-magic-sparkles"></i>
          增加游戏币
        </button>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {shopItems.map((item) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            className={`rounded-2xl overflow-hidden border-2 shadow-lg hover:scale-105 hover:-translate-y-2 hover:shadow-xl transition-all duration-150 ${
              item.isSpecial
                ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-400'
                : 'bg-gradient-to-br from-white to-blue-50 border-blue-300'
            }`}
          >
            <div className="flex flex-col md:flex-row">
              <div className="relative w-full md:w-1/3 h-40 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 border-b-2 md:border-b-0 md:border-r-2 border-gray-300">
                {item.category === 'stone' ? (
                  <>
                    <div className={`absolute inset-0 rounded-full ${STONE_GRADE_COLORS[item.grade ?? 0]} opacity-20 blur-xl`}></div>
                    <i className="fas fa-gem text-7xl text-blue-600 relative"></i>
                  </>
                ) : (
                  <>
                    <div className={`absolute inset-0 rounded-full ${TOOL_LEVEL_COLORS[item.level ?? 0]} opacity-20 blur-xl`}></div>
                    <i className="fas fa-wrench text-7xl text-green-600 relative"></i>
                  </>
                )}

                {item.isSpecial && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-600 border-2 border-purple-400 rounded-full px-3 py-1 text-xs text-white flex items-center font-bold shadow-lg">
                    <i className="fas fa-star text-yellow-300 mr-1"></i> 特殊
                  </div>
                )}
              </div>

              <div className="p-5 w-full md:w-2/3">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{item.name}</h3>
                <p className="text-gray-700 text-sm mb-4 font-medium">{item.description}</p>

                <div className="space-y-2 mb-4">
                  {item.category === 'stone' ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-semibold">损耗上限</span>
                        <span className="text-gray-800 font-bold">{item.damageLimitMin}-{item.damageLimitMax} (随机)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-semibold">稀有标识</span>
                        <span className="text-gray-800 font-bold">{item.mysterious ? '神秘矿石' : '常规矿石'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-semibold">耐久上限</span>
                        <span className="text-gray-800 font-bold">{item.durabilityMax}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-semibold">损耗系数</span>
                        <span className="text-gray-800 font-bold">{item.lossCoeff}x</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-lg px-3 py-1.5 flex items-center shadow">
                    <i className="fas fa-coins text-yellow-600 mr-1 font-bold"></i>
                    <span className="font-bold text-yellow-700">{item.price}</span>
                  </div>

                  <button
                    onClick={() => { setSelectedItem(item); setQuantity(1); setShowModal(true); }}
                    className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    购买
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Buy modal */}
      {showModal && selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-white to-pink-50 rounded-2xl p-6 max-w-md w-full border-2 border-pink-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">✨ 确认购买</h3>

            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 mb-6 border-2 border-pink-300">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  {selectedItem.category === 'stone' ? (
                    <>
                      <div className={`absolute inset-0 rounded-full ${STONE_GRADE_COLORS[selectedItem.grade ?? 0]} opacity-20 blur-xl`}></div>
                      <i className="fas fa-gem text-3xl text-white relative"></i>
                    </>
                  ) : (
                    <>
                      <div className={`absolute inset-0 rounded-full ${TOOL_LEVEL_COLORS[selectedItem.level ?? 0]} opacity-20 blur-xl`}></div>
                      <i className="fas fa-wrench text-3xl text-white relative"></i>
                    </>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-800">{selectedItem.name}</h4>
                  <p className="text-gray-700 text-sm font-medium">{selectedItem.description}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-800 font-semibold mb-2">数量</p>
              <div className="flex items-center">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 hover:scale-105 active:scale-95 transition-all text-white w-10 h-10 rounded-l-lg flex items-center justify-center font-bold shadow"
                >
                  <i className="fas fa-minus"></i>
                </button>
                <input
                  type="number" value={quantity}
                  onChange={(e) => { const num = parseInt(e.target.value, 10); setQuantity(isNaN(num) ? 1 : Math.max(1, num)); }}
                  className="bg-gradient-to-r from-pink-50 to-rose-50 border-t-2 border-b-2 border-pink-300 w-16 h-10 text-center text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-pink-500"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 hover:scale-105 active:scale-95 transition-all text-white w-10 h-10 rounded-r-lg flex items-center justify-center font-bold shadow"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-lg">
                <span className="text-gray-700 font-semibold">单价</span>
                <span className="font-bold flex items-center text-yellow-700">
                  <i className="fas fa-coins text-yellow-600 mr-1"></i>{selectedItem.price}
                </span>
              </div>
              <div className="flex justify-between text-lg border-t-2 border-pink-300 pt-3">
                <span className="text-gray-800 font-bold">总价</span>
                <span className="font-bold flex items-center text-yellow-700">
                  <i className="fas fa-coins text-yellow-600 mr-1"></i>{selectedItem.price * quantity}
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-400">余额</span>
                <span className="font-bold flex items-center">
                  <i className="fas fa-coins text-yellow-400 mr-1"></i>{userData.coins}
                </span>
              </div>
              <div className={`w-full h-1 mt-2 rounded-full ${userData.coins >= selectedItem.price * quantity ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <div
                  className={`h-full rounded-full ${userData.coins >= selectedItem.price * quantity ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min((userData.coins / (selectedItem.price * quantity)) * 100, 100)}%` }}
                ></div>
              </div>
              {userData.coins < selectedItem.price * quantity && (
                <p className="text-red-400 text-sm flex items-center">
                  <i className="fas fa-exclamation-circle mr-1"></i> 余额不足，请先获取更多游戏币
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-700 rounded-xl text-white font-medium hover:bg-gray-600 transition-colors">
                取消
              </button>
              <button
                onClick={buyItem}
                disabled={userData.coins < selectedItem.price * quantity || isBuying}
                className={`flex-1 py-3 rounded-xl text-white font-medium hover:scale-105 active:scale-95 transition-all ${
                  userData.coins >= selectedItem.price * quantity && !isBuying
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                确认购买
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
