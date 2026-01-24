import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-50 via-white to-purple-50 border-t-2 border-purple-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <motion.div 
            className="mb-6 md:mb-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              © 2026 原石狂磨 - Magic Stone ✨
            </span>
          </motion.div>
          <motion.div 
            className="flex space-x-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.a 
              href="#" 
              className="text-gray-600 hover:text-blue-600 transition-colors text-xl font-bold"
              whileHover={{ scale: 1.2, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <i className="fab fa-twitter"></i>
            </motion.a>
            <motion.a 
              href="#" 
              className="text-gray-600 hover:text-purple-600 transition-colors text-xl font-bold"
              whileHover={{ scale: 1.2, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <i className="fab fa-discord"></i>
            </motion.a>
            <motion.a 
              href="#" 
              className="text-gray-600 hover:text-cyan-600 transition-colors text-xl font-bold"
              whileHover={{ scale: 1.2, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <i className="fab fa-telegram"></i>
            </motion.a>
            <motion.a 
              href="#" 
              className="text-gray-600 hover:text-gray-900 transition-colors text-xl font-bold"
              whileHover={{ scale: 1.2, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <i className="fab fa-github"></i>
            </motion.a>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}