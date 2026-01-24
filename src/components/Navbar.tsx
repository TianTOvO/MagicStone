import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { ThemeContext } from '@/contexts/themeContext';
import { UserDataContext } from '@/contexts/userDataContext';
import { useContracts } from '@/hooks/useContracts';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { logout } = useContext(AuthContext);
  const { toggleTheme, isDark } = useContext(ThemeContext);
  const { userData } = useContext(UserDataContext);
  const { connected, account, connectWallet, disconnectWallet } = useContracts();
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: 'home', label: '首页', color: 'from-blue-500 to-blue-400' },
    { path: '/inventory', icon: 'gem', label: '我的资产', color: 'from-rose-500 to-pink-400' },
    { path: '/polishing', icon: 'wrench', label: '打磨站', color: 'from-amber-500 to-orange-400' },
    { path: '/toolcraft', icon: 'hammer', label: '合成站', color: 'from-cyan-500 to-blue-400' },
    { path: '/market', icon: 'shopping-bag', label: '市场', color: 'from-cyan-500 to-blue-400' },
    { path: '/shop', icon: 'store', label: '商城', color: 'from-green-500 to-emerald-400' },
    { path: '/quests', icon: 'tasks', label: '任务', color: 'from-purple-500 to-pink-400' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <motion.div 
            className="flex"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex-shrink-0 flex items-center">
              <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-lg transition-all cursor-pointer">
                ✨ Magic Stone
              </span>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    location.pathname === item.path
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-purple-300`
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <i className={`fas fa-${item.icon}`}></i>
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* 游戏币显示 */}
            <motion.div 
              className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-full px-4 py-2 text-sm font-bold flex items-center border-2 border-yellow-300 shadow-md"
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(250, 204, 21, 0.5)' }}
            >
              <i className="fas fa-coins text-yellow-500 mr-2 text-lg"></i>
              <span className="text-yellow-700">{userData.coins}</span>
            </motion.div>

            {/* 钱包连接 */}
            {connected && account ? (
              <motion.div 
                className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-4 py-2 text-sm font-bold border-2 border-green-300 shadow-md"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.i 
                  className="fas fa-wallet text-green-600"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity }}
                ></motion.i>
                <span className="text-green-700">{account.slice(0, 6)}...{account.slice(-4)}</span>
                <motion.button
                  onClick={disconnectWallet}
                  className="text-red-500 hover:text-red-700 ml-1 font-bold"
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  title="Disconnect wallet"
                >
                  ✕
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                onClick={connectWallet}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full px-4 py-2 text-sm font-bold transition-all shadow-lg"
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-wallet mr-2"></i>
                连接钱包
              </motion.button>
            )}
            
            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 transition-all shadow-md"
              whileHover={{ scale: 1.1, rotate: 20 }}
              whileTap={{ scale: 0.9 }}
              aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
            >
              <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
            </motion.button>
            
            <motion.button
              onClick={logout}
              className="p-2 rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 transition-all shadow-md"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="退出登录"
            >
              <i className="fas fa-sign-out-alt"></i>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </nav>
  );
}