import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Stone {
  id: number;
  grade: number; // 0-3
  damage: number;
  damageLimit: number;
  mysterious: boolean;
}

export interface Tool {
  id: number;
  level: number; // 0-3
  durability: number;
  durabilityMax: number;
}

export interface PlayerDataContextType {
  stones: Stone[];
  tools: Tool[];
  tokenBalance: string;
  
  addStone: (stone: Stone) => void;
  removeStone: (stoneId: number) => void;
  updateStone: (stoneId: number, updates: Partial<Stone>) => void;
  
  addTool: (tool: Tool) => void;
  removeTool: (toolId: number) => void;
  updateTool: (toolId: number, updates: Partial<Tool>) => void;
  
  setTokenBalance: (balance: string) => void;
}

const PlayerDataContext = createContext<PlayerDataContextType | undefined>(undefined);

export function PlayerDataProvider({ children }: { children: React.ReactNode }) {
  const [stones, setStones] = useState<Stone[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [tokenBalance, setTokenBalance] = useState('0');

  const addStone = useCallback((stone: Stone) => {
    setStones((prev) => [...prev, stone]);
  }, []);

  const removeStone = useCallback((stoneId: number) => {
    setStones((prev) => prev.filter((s) => s.id !== stoneId));
  }, []);

  const updateStone = useCallback((stoneId: number, updates: Partial<Stone>) => {
    setStones((prev) =>
      prev.map((s) => (s.id === stoneId ? { ...s, ...updates } : s))
    );
  }, []);

  const addTool = useCallback((tool: Tool) => {
    setTools((prev) => [...prev, tool]);
  }, []);

  const removeTool = useCallback((toolId: number) => {
    setTools((prev) => prev.filter((t) => t.id !== toolId));
  }, []);

  const updateTool = useCallback((toolId: number, updates: Partial<Tool>) => {
    setTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, ...updates } : t))
    );
  }, []);

  const value: PlayerDataContextType = {
    stones,
    tools,
    tokenBalance,
    addStone,
    removeStone,
    updateStone,
    addTool,
    removeTool,
    updateTool,
    setTokenBalance,
  };

  return (
    <PlayerDataContext.Provider value={value}>
      {children}
    </PlayerDataContext.Provider>
  );
}

export function usePlayerData() {
  const context = useContext(PlayerDataContext);
  if (!context) {
    throw new Error('usePlayerData must be used within PlayerDataProvider');
  }
  return context;
}
