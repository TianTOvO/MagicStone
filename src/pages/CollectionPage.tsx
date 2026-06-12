import { useContext } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { buildCollection, type CollectionEntry } from '@/types';
import { ALL_ORE_COMBINATIONS } from '@/types';
import { motion } from 'framer-motion';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day} ${hour}:${min}`;
}

function DiscoveryProgress({ entries }: { entries: CollectionEntry[] }) {
  const discovered = entries.filter(e => e.discovered).length;
  const total = entries.length;
  const pct = Math.round((discovered / total) * 100);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-300 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <i className="fas fa-book text-indigo-600 mr-2"></i>发现进度
        </h3>
        <span className="text-2xl font-black text-indigo-700">{discovered}<span className="text-base font-normal text-gray-500"> / {total}</span></span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        />
      </div>
      <p className="text-sm text-gray-600 mt-2 font-medium">
        {pct < 30 && '旅程才刚刚开始，继续打磨吧！'}
        {pct >= 30 && pct < 60 && '进展不错，更多珍品等待发现！'}
        {pct >= 60 && pct < 100 && '即将完成图鉴，加油！'}
        {pct === 100 && '🎉 图鉴已全部完成，你是传奇收藏家！'}
      </p>
    </div>
  );
}

function OreCard({ entry, index }: { entry: CollectionEntry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 100 }}
      className="rounded-2xl p-5 border-2 shadow-lg transition-all duration-150 hover:scale-105 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-white to-blue-50 border-blue-300 relative overflow-hidden"
    >
      {/* Corner badge */}
      <div className="absolute top-3 right-3 z-10">
        {entry.discovered ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-full px-2.5 py-0.5">
            <i className="fas fa-check-circle text-xs" /> 已发现
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 border border-gray-300 rounded-full px-2.5 py-0.5">
            <i className="fas fa-question-circle text-xs" /> 未发现
          </span>
        )}
      </div>

      {/* Ore icon */}
      <div className="relative h-28 flex items-center justify-center mb-3">
        <div className={`absolute inset-0 rounded-full opacity-20 blur-xl ${entry.color}`} />
        <i className="fas fa-gem text-5xl text-white drop-shadow-lg relative" />
      </div>

      {/* Name & Label */}
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-gray-800">{entry.name}</h3>
        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 border bg-white/80 text-gray-700 border-gray-300">
          {entry.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-center mb-3 leading-relaxed text-gray-600">
        {entry.description || '——'}
      </p>

      {/* Discovery info */}
      {entry.discovered && (
        <div className="text-center space-y-1">
          <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-0.5">
            <i className="fas fa-cubes text-xs" /> 拥有 ×{entry.count}
          </span>
          {entry.acquiredAt !== undefined && (
            <p className="text-xs text-gray-500">
              <i className="far fa-clock mr-1" />
              {formatTime(entry.acquiredAt)}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

function GradeSection({
  title,
  grade,
  icon,
  entries,
  startIndex,
}: {
  title: string;
  grade: number;
  icon: string;
  entries: CollectionEntry[];
  startIndex: number;
}) {
  const sectionEntries = entries.filter(e => e.grade === grade);
  if (sectionEntries.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <i className={`${icon} text-2xl`} />
        <h2 className="text-xl font-black text-gray-800">{title}</h2>
        <span className="text-sm text-gray-500 font-medium">
          {sectionEntries.filter(e => e.discovered).length}/{sectionEntries.length}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {sectionEntries.map((entry, i) => (
          <OreCard key={`${entry.grade}-${entry.subGrade}`} entry={entry} index={startIndex + i} />
        ))}
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const { userData } = useContext(UserDataContext);
  const collection = buildCollection(userData.stones);
  const discoveredCount = collection.filter(e => e.discovered).length;
  const totalCount = ALL_ORE_COMBINATIONS.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          📖 矿石图鉴
        </h1>
        <p className="text-gray-700 text-lg font-medium">
          探索并收集所有矿石品种 · 已发现 <span className="font-black text-purple-700">{discoveredCount}</span> / {totalCount} 种
        </p>
      </motion.div>

      {/* Progress Bar */}
      <DiscoveryProgress entries={collection} />

      {/* Ore Gallery */}
      <GradeSection
        title="基础矿石"
        grade={0}
        icon="fas fa-circle text-stone-500"
        entries={collection}
        startIndex={0}
      />
      <GradeSection
        title="玛瑙"
        grade={1}
        icon="fas fa-circle text-orange-500"
        entries={collection}
        startIndex={10}
      />
      <GradeSection
        title="翡翠"
        grade={2}
        icon="fas fa-circle text-emerald-500"
        entries={collection}
        startIndex={20}
      />
      <GradeSection
        title="钻石"
        grade={3}
        icon="fas fa-circle text-cyan-400"
        entries={collection}
        startIndex={30}
      />

      {/* Completion banner */}
      {discoveredCount === totalCount && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 rounded-2xl p-8 border-2 border-amber-300 shadow-xl text-center"
        >
          <i className="fas fa-crown text-5xl text-amber-500 mb-3" />
          <h2 className="text-2xl font-black text-amber-700">图鉴完成！</h2>
          <p className="text-amber-600 font-medium mt-1">你已发现所有矿石品种，是真正的传奇收藏家</p>
        </motion.div>
      )}
    </div>
  );
}
