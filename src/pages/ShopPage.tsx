import { useContext, useState, useEffect } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { useContracts } from '@/hooks/useContracts';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// 商城物品数据
const shopItems = [
  {
    id: 'stone-basic',
    name: '平凡原石',
    description: '看起来像路边捡的，但谁知道里面有没有惊喜？',
    price: 100,
    image: 'gem',
    category: 'stone',
    stats: {
      level: '平凡',
      损耗上限: '80-120 (随机)',
      稀有标识: '普通原石'
    }
  },
  {
    id: 'tool-basic',
    name: '普通工具',
    description: '能用就行',
    price: 50,
    image: 'wrench',
    category: 'tool',
    stats: {
      level: '普通',
      耐久上限: 100,
      损耗影响系数: 1,
      耐久消耗系数: 1
    }
  },
  {
    id: 'stone-mystery',
    name: '神秘原石',
    description: '蕴含神秘力量的特殊原石，有更高的升级潜力',
    price: 500,
    image: 'gem',
    category: 'stone',
    isSpecial: true,
    stats: {
      level: '平凡',
      损耗上限: '120-180 (随机)',
      稀有标识: '神秘原石'
    }
  },
  {
    id: 'tool-pro',
    name: '专业工具',
    description: '“这个就叫专业~”',
    price: 300,
    image: 'wrench',
    category: 'tool',
    stats: {
      level: '专业',
      耐久上限: 100,
      损耗影响系数: 0.8,
      耐久消耗系数: 0.8
    }  },
  {
    id: 'stone-exotic',
    name: '奇特原石',
    description: '一块与众不同的...石头',
    price: 800,
    image: 'gem',
    category: 'stone',
    stats: {
      level: '奇特',
      损耗上限: '150-200 (随机)',
      稀有标识: '奇特原石'
    }
  },
  {
    id: 'stone-rare',
    name: '珍稀原石',
    description: '稀世珍宝~~',
    price: 1500,
    image: 'gem',
    category: 'stone',
    isSpecial: true,
    stats: {
      level: '珍稀',
      损耗上限: '180-250 (随机)',
      稀有标识: '珍稀原石'
    }
  },
  {
    id: 'stone-brilliant',
    name: '璀璨原石',
    description: '光是躺在那儿，就已经在疯狂暗示它的身价了。',
    price: 3000,
    image: 'gem',
    category: 'stone',
    isSpecial: true,
    stats: {
      level: '璀璨',
      损耗上限: '250-350 (随机)',
      稀有标识: '璀璨原石'
    }
  },
  {
    id: 'tool-elite',
    name: '顶级工具',
    description: '每一次打磨都显得格外自信。',
    price: 1200,
    image: 'wrench',
    category: 'tool',
    stats: {
      level: '顶级',
      耐久上限: 100,
      损耗影响系数: 0.5,
      耐久消耗系数: 0.5
    }
  },
  {
    id: 'tool-legendary',
    name: '传奇工具',
    description: '由传奇工匠打造传说中，它磨的不是石头，是命运。',
    price: 2500,
    image: 'wrench',
    category: 'tool',
    stats: {
      level: '传奇',
      耐久上限: 150,
      损耗影响系数: 0.2,
      耐久消耗系数: 0.2
    }  }
];

export default function ShopPage() {
  const { userData, updateUserData } = useContext(UserDataContext);
  const { connected, connectWallet } = useContracts();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);

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

  // 购买物品
  const buyItem = async () => {
    if (!selectedItem) return;

    try {
      setBuying(true);
      const totalPrice = selectedItem.price * quantity;
      
      // 检查余额是否足够
      if (userData.coins < totalPrice) {
        toast.error('游戏币不足，无法购买');
        setBuying(false);
        return;
      }

      // 如果未连接钱包，提示连接
      if (!connected) {
        toast.info('建议连接区块链钱包以保存数据');
      }

      // 生成新物品并更新用户数据
      const newStones = [...userData.stones];
      const newTools = [...userData.tools];
      
      for (let i = 0; i < quantity; i++) {
        if (selectedItem.category === 'stone') {
          // 生成随机损耗上限
          const minDurability = selectedItem.id === 'stone-mystery' ? 120 : 80;
          const maxDurability = selectedItem.id === 'stone-mystery' ? 180 : 120;
          const durability = Math.floor(Math.random() * (maxDurability - minDurability + 1)) + minDurability;
          
          const newStone = {
            id: Date.now() + i, // 生成唯一ID
            level: selectedItem.stats.level,
            损耗值: 0,
            损耗上限: durability,
            稀有标识: selectedItem.stats.稀有标识,
            isPolishable: true
          };
          
          newStones.push(newStone);
        } else if (selectedItem.category === 'tool') {
          const newTool = {
            id: Date.now() + i, // 生成唯一ID
            level: selectedItem.stats.level,
            当前耐久值: selectedItem.stats.耐久上限,
            耐久上限: selectedItem.stats.耐久上限,
            损耗影响系数: selectedItem.stats.损耗影响系数,
            耐久消耗系数: selectedItem.stats.耐久消耗系数
          };
          
          newTools.push(newTool);
        }
      }

      // 一次性更新所有数据
      updateUserData({
        stones: selectedItem.category === 'stone' ? newStones : userData.stones,
        tools: selectedItem.category === 'tool' ? newTools : userData.tools,
        coins: userData.coins - totalPrice
      });

      // 显示成功消息
      toast.success(`成功购买${quantity}个${selectedItem.name}`);
      
      // 重置
      setShowModal(false);
      setSelectedItem(null);
      setQuantity(1);

    } catch (error) {
      const message = error instanceof Error ? error.message : '购买失败';
      toast.error(`错误: ${message}`);
    } finally {
      setBuying(false);
    }
  };

  // 打开购买模态框
  const openBuyModal = (item: any) => {
    setSelectedItem(item);
    setQuantity(1);
    setShowModal(true);
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
        className="bg-gradient-to-r from-pink-50 via-rose-50 to-red-50 rounded-2xl p-8 border-2 border-pink-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-rose-600 to-red-600\">🛍️ 商城</h1>
        <p className="text-gray-700 text-lg font-medium">购买新的原石和打磨工具</p>
      </motion.div>

      {/* 余额显示 */}
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
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            updateUserData({
              coins: userData.coins + 1000
            });
            toast.success('管理员：添加了1000游戏币');
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-purple-600/50 transition-all flex items-center gap-2"
        >
          <i className="fas fa-wand-magic-sparkles"></i>
          增加游戏币
        </motion.button>
      </motion.div>

      {/* 商城物品列表 */}
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
            whileHover={{ scale: 1.05, y: -8 }}
            className={`rounded-2xl overflow-hidden border-2 shadow-lg transition-all ${
              item.isSpecial 
                ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-400' 
                : 'bg-gradient-to-br from-white to-blue-50 border-blue-300'
            }`}
          >
            <div className="flex flex-col md:flex-row">
              {/* 物品图片 */}
              <div className="relative w-full md:w-1/3 h-40 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 border-b-2 md:border-b-0 md:border-r-2 border-gray-300">
                {item.category === 'stone' ? (
                  <>
                    <div className={`absolute inset-0 rounded-full ${getStoneLevelColor(item.stats.level)} opacity-20 blur-xl`}></div>
                    <i className="fas fa-gem text-7xl text-blue-600 relative"></i>
                  </>
                ) : (
                  <>
                    <div className={`absolute inset-0 rounded-full ${getToolLevelColor(item.stats.level)} opacity-20 blur-xl`}></div>
                    <i className="fas fa-wrench text-7xl text-green-600 relative"></i>
                  </>
                )}
                
                {/* 特殊标识 */}
                {item.isSpecial && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-600 border-2 border-purple-400 rounded-full px-3 py-1 text-xs text-white flex items-center font-bold shadow-lg">
                    <i className="fas fa-star text-yellow-300 mr-1"></i> 特殊
                  </div>
                )}
              </div>
              
              {/* 物品信息 */}
              <div className="p-5 w-full md:w-2/3">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{item.name}</h3>
                <p className="text-gray-700 text-sm mb-4 font-medium">{item.description}</p>
                
                <div className="space-y-2 mb-4">
                  {Object.entries(item.stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-700 font-semibold">{key}</span>
                      <span className="text-gray-800 font-bold">{value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-lg px-3 py-1.5 flex items-center shadow">
                    <i className="fas fa-coins text-yellow-600 mr-1 font-bold"></i>
                    <span className="font-bold text-yellow-700">{item.price}</span>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openBuyModal(item)}
                    className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg text-white font-bold transition-all shadow-lg"
                  >
                    购买
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* 购买确认模态框 */}
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
                      <div className={`absolute inset-0 rounded-full ${getStoneLevelColor(selectedItem.stats.level)} opacity-20 blur-xl`}></div>
                      <i className="fas fa-gem text-3xl text-white relative"></i>
                    </>
                  ) : (
                    <>
                      <div className={`absolute inset-0 rounded-full ${getToolLevelColor(selectedItem.stats.level)} opacity-20 blur-xl`}></div>
                      <i className="fas fa-wrench text-3xl text-white relative"></i>
                    </>
                  )}
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-gray-800">{selectedItem.name}</h4>
                  <p className="text-gray-700 text-sm font-medium">{selectedItem.description}</p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                {Object.entries(selectedItem.stats).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-700 font-semibold">{key}</span>
                    <span className="text-gray-800 font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 数量选择 */}
            <div className="mb-6">
              <p className="text-gray-800 font-semibold mb-2">数量</p>
              <div className="flex items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all text-white w-10 h-10 rounded-l-lg flex items-center justify-center font-bold shadow"
                >
                  <i className="fas fa-minus"></i>
                </motion.button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const num = parseInt(e.target.value, 10);
                    setQuantity(isNaN(num) ? 1 : Math.max(1, num));
                  }}
                  className="bg-gradient-to-r from-pink-50 to-rose-50 border-t-2 border-b-2 border-pink-300 w-16 h-10 text-center text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-pink-500"
                  min="1"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all text-white w-10 h-10 rounded-r-lg flex items-center justify-center font-bold shadow"
                >
                  <i className="fas fa-plus"></i>
                </motion.button>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-lg">
                <span className="text-gray-700 font-semibold">单价</span>
                <span className="font-bold flex items-center text-yellow-700">
                  <i className="fas fa-coins text-yellow-600 mr-1"></i>
                  {selectedItem.price}
                </span>
              </div>
              
              <div className="flex justify-between text-lg border-t-2 border-pink-300 pt-3">
                <span className="text-gray-800 font-bold">总价</span>
                <span className="font-bold flex items-center text-yellow-700">
                  <i className="fas fa-coins text-yellow-600 mr-1"></i>
                  {selectedItem.price * quantity}
                </span>
              </div>
              
              <div className="flex justify-between text-lg">
                <span className="text-gray-400">余额</span>
                <span className="font-bold flex items-center">
                  <i className="fas fa-coins text-yellow-400 mr-1"></i>
                  {userData.coins}
                </span>
              </div>
              
              <div className={`w-full h-1 mt-2 rounded-full ${
                userData.coins >= selectedItem.price * quantity ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                <div 
                  className={`h-full rounded-full ${
                    userData.coins >= selectedItem.price * quantity ? 'bg-green-500' : 'bg-red-500'
                  }`} 
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
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-gray-700 rounded-xl text-white font-medium hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={buyItem}
                disabled={userData.coins < selectedItem.price * quantity}
                className={`flex-1 py-3 rounded-xl text-white font-medium transition-all ${
                  userData.coins >= selectedItem.price * quantity 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                确认购买
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}