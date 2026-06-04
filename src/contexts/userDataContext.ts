import { createContext } from 'react';
import { UserData } from '@/types';

interface UserDataContextType {
  userData: UserData;
  updateUserData: (newData: Partial<UserData>) => void;
}

export const UserDataContext = createContext<UserDataContextType>({
  userData: {
    stones: [],
    tools: [],
    coins: 0,
    quests: [],
  },
  updateUserData: () => {},
});
