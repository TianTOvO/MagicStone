import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="text-9xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
          404
        </div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">页面未找到</h2>
        <p className="text-gray-500 mb-8">你访问的页面不存在或已被移除</p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-all duration-150 shadow-lg"
        >
          <i className="fas fa-home mr-2"></i>返回首页
        </Link>
      </motion.div>
    </div>
  );
}
