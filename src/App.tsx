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
import LoginPage from "@/components/LoginPage";
import { useState, useEffect } from "react";
import { AuthContext } from '@/contexts/authContext';
import { ThemeProvider } from '@/contexts/themeContext.tsx';
import { UserDataContext } from '@/contexts/userDataContext';
import { PlayerDataProvider } from '@/contexts/playerDataContext';
import { UserData } from '@/types';
import { mockUserData } from '@/data/mockData';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // 默认已登录用于演示
  const [userData, setUserData] = useState<UserData>(mockUserData);

  const logout = () => {
    setIsAuthenticated(false);
  };

  // 在实际应用中，这里会从API获取用户数据
  useEffect(() => {
    if (isAuthenticated) {
      setUserData(mockUserData);
    }
  }, [isAuthenticated]);

  const updateUserData = (newData: Partial<UserData>) => {
    setUserData((prev: UserData) => ({ ...prev, ...newData }));
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
