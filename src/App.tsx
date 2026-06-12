import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import InventoryPage from "@/pages/InventoryPage";
import PolishingPage from "@/pages/PolishingPage";
import MarketPage from "@/pages/MarketPage";
import ShopPage from "@/pages/ShopPage";
import QuestsPage from "@/pages/QuestsPage";
import ToolCraftPage from "@/pages/ToolCraftPage";
import CollectionPage from "@/pages/CollectionPage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundEffect from "@/components/BackgroundEffect";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { useState, useEffect } from "react";
import { AuthContext } from '@/contexts/authContext';
import { ThemeProvider } from '@/contexts/themeContext.tsx';
import { UserDataContext } from '@/contexts/userDataContext';
import { WalletProvider } from '@/contexts/walletContext';
import { UserData } from '@/types';
import { mockUserData } from '@/data/demoUser';

const USER_DATA_KEY = 'magic-stone-user-data';

function loadUserData(): UserData {
  try {
    const raw = localStorage.getItem(USER_DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...mockUserData, ...parsed };
    }
  } catch {
    console.warn('Failed to parse saved user data, falling back to mock data.');
  }
  return mockUserData;
}

function saveUserData(data: UserData): void {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
  } catch {
    console.warn('Failed to save user data.');
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // 默认已登录用于演示
  const [userData, setUserData] = useState<UserData>(loadUserData);

  const logout = () => {
    setIsAuthenticated(false);
  };

  // 在实际应用中，这里会从API获取用户数据
  useEffect(() => {
    if (isAuthenticated) {
      setUserData(loadUserData());
    }
  }, [isAuthenticated]);

  const updateUserData = (newData: Partial<UserData>) => {
    setUserData((prev: UserData) => {
      const next = { ...prev, ...newData };
      saveUserData(next);
      return next;
    });
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
          <WalletProvider>
          <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50 text-gray-900 flex flex-col relative">
            <BackgroundEffect />
            <div className="relative z-10 flex flex-col min-h-screen">
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
                <Route path="/collection" element={<CollectionPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
            </div>
          </div>
          </WalletProvider>
        </UserDataContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
