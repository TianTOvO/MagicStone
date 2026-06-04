import { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '@/contexts/themeContext';
import { UserDataContext } from '@/contexts/userDataContext';
import { useContracts } from '@/hooks/useContracts';
import { AuthContext } from '@/contexts/authContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { userData } = useContext(UserDataContext);
  const { connected, account, connectWallet, disconnectWallet } = useContracts();
  const { logout } = useContext(AuthContext);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const linkClass = (path: string) =>
    `flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
      isActive(path)
        ? 'text-blue-600 bg-blue-50'
        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b-2 border-purple-200 bg-white/80 backdrop-blur-md shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <i className="fas fa-gem text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"></i>
            </motion.div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hidden sm:block">
              Magic Stone
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {[
              { to: '/', icon: 'fa-home', label: '首页' },
              { to: '/inventory', icon: 'fa-box-open', label: '背包' },
              { to: '/polishing', icon: 'fa-wrench', label: '打磨' },
              { to: '/shop', icon: 'fa-store', label: '商城' },
              { to: '/toolcraft', icon: 'fa-layer-group', label: '合成' },
              { to: '/market', icon: 'fa-shopping-bag', label: '交易所' },
              { to: '/quests', icon: 'fa-clipboard-list', label: '任务' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={linkClass(item.to)}
              >
                <i className={`fas ${item.icon}`}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-full px-4 py-2 text-sm font-bold flex items-center border-2 border-yellow-300 shadow-md hover:scale-105 transition-transform duration-150">
              <i className="fas fa-coins text-yellow-500 mr-2 text-lg"></i>
              <span className="text-yellow-700">{userData.coins}</span>
            </div>

            {connected && account ? (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-4 py-2 text-sm font-bold border-2 border-green-300 shadow-md hover:scale-105 transition-transform duration-150">
                <motion.i
                  className="fas fa-wallet text-green-600"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity }}
                ></motion.i>
                <span className="text-green-700">{account.slice(0, 6)}...{account.slice(-4)}</span>
                <button
                  onClick={disconnectWallet}
                  className="text-red-500 hover:text-red-700 ml-1 font-bold hover:scale-125 hover:rotate-90 active:scale-90 transition-transform duration-150"
                  title="Disconnect wallet"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full px-4 py-2 text-sm font-bold transition-all duration-150 shadow-lg hover:scale-105 active:scale-95"
              >
                <i className="fas fa-wallet mr-2"></i>
                连接钱包
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 transition-all duration-150 shadow-md hover:scale-110 hover:rotate-[20deg] active:scale-90"
              aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
            >
              <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 transition-all duration-150 shadow-md hover:scale-110 active:scale-90"
              aria-label="退出登录"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-full px-3 py-1 text-xs font-bold flex items-center border-2 border-yellow-300 shadow-md">
              <i className="fas fa-coins text-yellow-500 mr-1"></i>
              <span className="text-yellow-700">{userData.coins}</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl text-gray-700`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t-2 border-purple-200 bg-white overflow-hidden"
          >
            <div className="px-4 py-3 space-y-2">
              {[
                { to: '/', icon: 'fa-home', label: '首页' },
                { to: '/inventory', icon: 'fa-box-open', label: '背包' },
                { to: '/polishing', icon: 'fa-wrench', label: '打磨' },
                { to: '/shop', icon: 'fa-store', label: '商城' },
                { to: '/toolcraft', icon: 'fa-layer-group', label: '合成' },
                { to: '/market', icon: 'fa-shopping-bag', label: '交易所' },
                { to: '/quests', icon: 'fa-clipboard-list', label: '任务' },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={linkClass(item.to)}
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
