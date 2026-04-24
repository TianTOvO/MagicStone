interface LoginPageProps {
  setIsAuthenticated: (value: boolean) => void;
}

export default function LoginPage({ setIsAuthenticated }: LoginPageProps) {
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
