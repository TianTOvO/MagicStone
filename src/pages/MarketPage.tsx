import { useContext, useState } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { useContracts } from '@/hooks/useContracts';
import { STONE_GRADE_COLORS, STONE_GRADE_NAMES, TOOL_LEVEL_COLORS, TOOL_LEVEL_NAMES } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface MarketItem {
  id: number;
  type: 'stone' | 'tool';
  // Stone props
  grade?: number;
  damage?: number;
  damageLimit?: number;
  mysterious?: boolean;
  isPolishable?: boolean;
  // Tool props
  level?: number;
  durability?: number;
  durabilityMax?: number;
  lossCoeff?: number;
  durabilityConsumption?: number;
  price: number;
  seller: string;
}

const mockMarketItems: MarketItem[] = [
  { id: 101, type: 'stone', grade: 1, damage: 20, damageLimit: 120, mysterious: false, isPolishable: true, price: 300, seller: 'player123' },
  { id: 102, type: 'stone', grade: 2, damage: 40, damageLimit: 150, mysterious: false, isPolishable: true, price: 800, seller: 'master_polisher' },
  { id: 103, type: 'tool', level: 1, durability: 80, durabilityMax: 100, lossCoeff: 0.8, durabilityConsumption: 0.8, price: 500, seller: 'tool_master' },
  { id: 104, type: 'stone', grade: 0, damage: 0, damageLimit: 100, mysterious: true, isPolishable: true, price: 200, seller: 'treasure_hunter' },
  { id: 105, type: 'tool', level: 2, durability: 95, durabilityMax: 120, lossCoeff: 0.5, durabilityConsumption: 0.5, price: 1200, seller: 'legendary_craftsman' },
  { id: 106, type: 'stone', grade: 3, damage: 80, damageLimit: 200, mysterious: false, isPolishable: true, price: 2500, seller: 'gem_collector' },
];

export default function MarketPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const { connected, connectWallet, buyItem } = useContracts();
  const [activeTab, setActiveTab] = useState<'all' | 'stones' | 'tools'>('all');
  const [marketItems, setMarketItems] = useState<MarketItem[]>(mockMarketItems);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [buying, setBuying] = useState(false);
  const [priceFilter, setPriceFilter] = useState<{ min: string; max: string }>({ min: '', max: '' });

  const filteredItems = marketItems.filter(item => {
    if (activeTab === 'stones' && item.type !== 'stone') return false;
    if (activeTab === 'tools' && item.type !== 'tool') return false;
    const minPrice = priceFilter.min ? parseInt(priceFilter.min, 10) : 0;
    const maxPrice = priceFilter.max ? parseInt(priceFilter.max, 10) : Infinity;
    return item.price >= minPrice && item.price <= maxPrice;
  });

  const handleBuyItem = async () => {
    if (!selectedItem) return;

    if (!connected) {
      toast.error('请先连接钱包');
      await connectWallet();
      return;
    }

    try {
      setBuying(true);
      toast.loading('正在处理购买...');

      if (userData.coins < selectedItem.price) {
        toast.error('游戏币不足，无法购买');
        setBuying(false);
        return;
      }

      const isStone = selectedItem.type === 'stone';
      await buyItem(isStone, selectedItem.id);

      if (isStone) {
        updateUserData({
          stones: [...userData.stones, {
            id: Date.now(),
            grade: selectedItem.grade ?? 0,
            damage: selectedItem.damage ?? 0,
            damageLimit: selectedItem.damageLimit ?? 100,
            mysterious: selectedItem.mysterious ?? false,
            isPolishable: selectedItem.isPolishable ?? true,
          }],
          coins: userData.coins - selectedItem.price,
        });
      } else {
        updateUserData({
          tools: [...userData.tools, {
            id: Date.now(),
            level: selectedItem.level ?? 0,
            durability: selectedItem.durability ?? 100,
            durabilityMax: selectedItem.durabilityMax ?? 100,
            lossCoeff: selectedItem.lossCoeff ?? 1,
            durabilityConsumption: selectedItem.durabilityConsumption ?? 1,
          }],
          coins: userData.coins - selectedItem.price,
        });
      }

      setMarketItems(prev => prev.filter(item => item.id !== selectedItem.id));
      toast.success(`成功购买${STONE_GRADE_NAMES[selectedItem.grade ?? selectedItem.level ?? 0]}${selectedItem.type === 'stone' ? '原石' : '工具'}`);
      setShowModal(false);
      setSelectedItem(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '购买失败';
      toast.error(`错误: ${message}`);
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-cyan-50 via-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600">💎 交易市场</h1>
        <p className="text-gray-700 text-lg font-medium">浏览、购买其他玩家出售的原石和工具</p>
      </motion.div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-300 shadow-lg">
        <div className="flex flex-wrap gap-4">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-1 inline-flex border-2 border-purple-300 shadow">
            {(['all', 'stones', 'tools'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {tab === 'all' ? '全部' : tab === 'stones' ? '原石' : '工具'}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-700 font-semibold">价格范围:</span>
            <input
              type="number" placeholder="最低"
              value={priceFilter.min}
              onChange={(e) => setPriceFilter({ ...priceFilter, min: e.target.value })}
              className="bg-white border-2 border-blue-300 rounded-lg px-3 py-1 text-sm w-24 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              min="0"
            />
            <span className="text-gray-700 font-semibold">-</span>
            <input
              type="number" placeholder="最高"
              value={priceFilter.max}
              onChange={(e) => setPriceFilter({ ...priceFilter, max: e.target.value })}
              className="bg-white border-2 border-blue-300 rounded-lg px-3 py-1 text-sm w-24 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              min="0"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-black text-gray-800 flex items-center"><i className="fas fa-shopping-bag text-blue-600 mr-2"></i>可购买物品</h2>
          <span className="text-gray-600 text-sm font-semibold bg-blue-50 px-3 py-1 rounded-full border border-blue-300">共 {filteredItems.length} 件</span>
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.08, y: -8 }}
                className="rounded-2xl overflow-hidden border-2 shadow-lg transition-all bg-gradient-to-br from-white to-blue-50 border-blue-300 hover:border-blue-500"
              >
                <div className="relative h-40 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                  {item.type === 'stone' ? (
                    <>
                      <div className={`absolute inset-0 rounded-full ${STONE_GRADE_COLORS[item.grade ?? 0]} opacity-20 blur-xl`}></div>
                      <i className="fas fa-gem text-7xl text-white relative"></i>
                    </>
                  ) : (
                    <>
                      <div className={`absolute inset-0 rounded-full ${TOOL_LEVEL_COLORS[item.level ?? 0]} opacity-20 blur-xl`}></div>
                      <i className="fas fa-wrench text-7xl text-white relative"></i>
                    </>
                  )}
                  {item.mysterious && (
                    <div className="absolute top-2 right-2 bg-purple-900/80 border border-purple-500/30 rounded-full px-2 py-1 text-xs text-purple-300 flex items-center">
                      <i className="fas fa-star text-yellow-400 mr-1"></i> 神秘
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800">
                      {item.type === 'stone' ? STONE_GRADE_NAMES[item.grade ?? 0] : TOOL_LEVEL_NAMES[item.level ?? 0]}{item.type === 'stone' ? '原石' : '工具'}
                    </h3>
                    <div className="flex items-center bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-lg px-2 py-1 shadow">
                      <i className="fas fa-coins text-yellow-600 text-xs mr-1"></i>
                      <span className="font-bold text-yellow-700">{item.price}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {item.type === 'stone' ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 font-semibold">损耗</span>
                          <span className="text-gray-800 font-bold">{item.damage}/{item.damageLimit}</span>
                        </div>
                        <div className="w-full bg-blue-300 rounded-full h-2">
                          <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-md"
                            style={{ width: `${((item.damage ?? 0) / (item.damageLimit ?? 1)) * 100}%` }}
                          ></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 font-semibold">耐久</span>
                          <span className="text-gray-800 font-bold">{item.durability}/{item.durabilityMax}</span>
                        </div>
                        <div className="w-full bg-green-300 rounded-full h-2">
                          <div className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-md"
                            style={{ width: `${((item.durability ?? 0) / (item.durabilityMax ?? 1)) * 100}%` }}
                          ></div>
                        </div>
                      </>
                    )}
                    <div className="text-sm text-gray-700 font-semibold">
                      <i className="fas fa-user mr-1 text-xs"></i> 卖家: {item.seller}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedItem(item); setShowModal(true); }}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-medium transition-all"
                  >
                    立即购买
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 border-2 border-blue-300 flex flex-col items-center justify-center min-h-[400px] shadow-lg">
            <i className="fas fa-shopping-bag text-6xl text-blue-400 mb-4"></i>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">暂无符合条件的物品</h3>
            <p className="text-gray-700 text-center text-lg">尝试调整筛选条件或稍后再来查看</p>
          </div>
        )}
      </div>

      {/* Buy modal */}
      {showModal && selectedItem && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 max-w-md w-full border-2 border-blue-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">✨ 确认购买</h3>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-blue-300">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  {selectedItem.type === 'stone' ? (
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
                  <h4 className="text-lg font-bold text-gray-800">
                    {selectedItem.type === 'stone'
                      ? STONE_GRADE_NAMES[selectedItem.grade ?? 0] + '原石'
                      : TOOL_LEVEL_NAMES[selectedItem.level ?? 0] + '工具'}
                  </h4>
                  <p className="text-gray-700 text-sm font-medium">卖家: {selectedItem.seller}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-lg">
                <span className="text-gray-700 font-semibold">价格</span>
                <span className="font-bold flex items-center text-yellow-700">
                  <i className="fas fa-coins text-yellow-600 mr-1"></i>{selectedItem.price}
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-700 font-semibold">余额</span>
                <span className="font-bold flex items-center text-yellow-700">
                  <i className="fas fa-coins text-yellow-600 mr-1"></i>{userData.coins}
                </span>
              </div>
              {userData.coins < selectedItem.price && (
                <motion.p animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="text-red-600 text-sm font-bold flex items-center bg-red-100 px-3 py-2 rounded-lg border border-red-400">
                  <i className="fas fa-exclamation-circle mr-1"></i> 余额不足，请先获取更多游戏币
                </motion.p>
              )}
            </div>

            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl text-gray-800 font-bold hover:from-gray-400 hover:to-gray-500 transition-all shadow"
              >取消</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleBuyItem}
                disabled={userData.coins < selectedItem.price || buying}
                className={`flex-1 py-3 rounded-xl text-white font-bold transition-all shadow-lg ${
                  userData.coins >= selectedItem.price && !buying
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >{buying ? '处理中...' : '确认购买'}</motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
