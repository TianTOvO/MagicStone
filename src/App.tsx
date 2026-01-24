import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import InventoryPage from "@/pages/InventoryPage";
import PolishingPage from "@/pages/PolishingPage";
import MarketPage from "@/pages/MarketPage";
import ShopPage from "@/pages/ShopPage";
import QuestsPage from "@/pages/QuestsPage";
import ToolCraftPage from "@/pages/ToolCraftPage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { AuthContext } from '@/contexts/authContext';
import { ThemeProvider } from '@/contexts/themeContext.tsx';
import { UserDataContext } from '@/contexts/userDataContext';
import { PlayerDataProvider } from '@/contexts/playerDataContext';

// 简单的登录页面组件
function LoginPage({ setIsAuthenticated }: { setIsAuthenticated: (value: boolean) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border-2 border-purple-200">
        <h2 className="text-4xl font-black mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          ✨ Magic Stone
        </h2>
        <p className="text-center text-gray-700 mb-8 font-semibold">不知道叫什么名字的石头游戏</p>
        
        <button 
          onClick={() => setIsAuthenticated(true)}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl text-white font-bold hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-300/50 text-lg"
        >
          开始游戏 🎮
        </button>
        
        <div className="mt-8 text-center text-gray-600 text-sm font-medium">
          点击"开始游戏"即表示您同意我们的服务条款
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // 默认已登录用于演示
  const [userData, setUserData] = useState({
    stones: [],
    tools: [],
    coins: 1000,
    quests: []
  });

  const logout = () => {
    setIsAuthenticated(false);
  };

  // 在实际应用中，这里会从API获取用户数据
  useEffect(() => {
    if (isAuthenticated) {
      // 模拟加载用户数据
      const mockUserData = {
        stones: [
          { id: 1, level: "平凡",损耗值: 10, 损耗上限: 100, 稀有标识: "普通原石", isPolishable: true },
          { id: 2, level: "平凡",损耗值: 5, 损耗上限: 80, 稀有标识: "普通原石", isPolishable: true },
          { id: 3, level: "平凡",损耗值: 0, 损耗上限: 120, 稀有标识: "普通原石", isPolishable: true },
          { id: 4, level: "平凡",损耗值: 15, 损耗上限: 90, 稀有标识: "普通原石", isPolishable: true },
          { id: 5, level: "平凡",损耗值: 8, 损耗上限: 110, 稀有标识: "普通原石", isPolishable: true }
        ],
        tools: [
          { id: 1, level: "普通", 当前耐久值: 100, 耐久上限: 100, 损耗影响系数: 1, 耐久消耗系数: 1 },
          { id: 2, level: "普通", 当前耐久值: 100, 耐久上限: 100, 损耗影响系数: 1, 耐久消耗系数: 1 },
          { id: 3, level: "普通", 当前耐久值: 100, 耐久上限: 100, 损耗影响系数: 1, 耐久消耗系数: 1 },
          { id: 4, level: "普通", 当前耐久值: 100, 耐久上限: 100, 损耗影响系数: 1, 耐久消耗系数: 1 },
          { id: 5, level: "普通", 当前耐久值: 100, 耐久上限: 100, 损耗影响系数: 1, 耐久消耗系数: 1 },
          { id: 6, level: "普通", 当前耐久值: 100, 耐久上限: 100, 损耗影响系数: 1, 耐久消耗系数: 1 },
          { id: 7, level: "普通", 当前耐久值: 100, 耐久上限: 100, 损耗影响系数: 1, 耐久消耗系数: 1 },
          { id: 8, level: "普通", 当前耐久值: 100, 耐久上限: 100, 损耗影响系数: 1, 耐久消耗系数: 1 },
          { id: 9, level: "普通", 当前耐久值: 100, 耐久上限: 100, 损耗影响系数: 1, 耐久消耗系数: 1 },
          { id: 10, level: "普通", 当前耐久值: 100, 耐久上限: 100, 损耗影响系数: 1, 耐久消耗系数: 1 }
        ],
        coins: 1000,
        quests: [
          { id: 1, type: "日常", title: "打磨5次原石", progress: 0, target: 5, reward: 100 },
          { id: 2, type: "日常", title: "收集3块奇特原石", progress: 0, target: 3, reward: 200 },
          { id: 3, type: "成就", title: "首次打磨成功", progress: 0, target: 1, reward: 50 }
        ]
      };
      setUserData(mockUserData);
    }
  }, [isAuthenticated]);

  const updateUserData = (newData: any) => {
    setUserData(prev => ({ ...prev, ...newData }));
  };

  if (!isAuthenticated) {
    return <LoginPage setIsAuthenticated={setIsAuthenticated} />;
  }

  return (
    <ThemeProvider>
      <AuthContext.Provider
        value={{ isAuthenticated, setIsAuthenticated, logout }}
      >
        <UserDataContext.Provider value={{ userData, updateUserData }}>
          <PlayerDataProvider>
            <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50 text-gray-900 flex flex-col">
              <Navbar />
              <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/polishing" element={<PolishingPage />} />
                  <Route path="/market" element={<MarketPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/quests" element={<QuestsPage />} />
                  <Route path="/toolcraft" element={<ToolCraftPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </PlayerDataProvider>
        </UserDataContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
