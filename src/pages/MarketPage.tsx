import { useContext, useState, useEffect, useCallback } from 'react';
import { UserDataContext } from '@/contexts/userDataContext';
import { useContracts } from '@/hooks/useContracts';
import { STONE_GRADE_NAMES, TOOL_LEVEL_NAMES } from '@/types';
import type { MarketListing, MarketOffer } from '@/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ethers, type EventLog } from 'ethers';

export default function MarketPage() {
  const { userData } = useContext(UserDataContext);
  const { connected, connectWallet, contracts, account, buyItem, listItem, delistItem, makeOffer, cancelOffer, acceptOffer } = useContracts();
  const [activeTab, setActiveTab] = useState<'all' | 'stones' | 'tools' | 'myListings' | 'offers'>('all');
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Sell modal
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellItem, setSellItem] = useState<{ isStone: boolean; tokenId: number } | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [selling, setSelling] = useState(false);

  // Buy modal
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
  const [buying, setBuying] = useState(false);

  // Offer modal
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerTarget, setOfferTarget] = useState<{ isStone: boolean; tokenId: number } | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offering, setOffering] = useState(false);

  // Offers state
  const [offers, setOffers] = useState<MarketOffer[]>([]);
  const [offerSubTab, setOfferSubTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [accepting, setAccepting] = useState<string>(''); // key of offer being accepted
  const [cancelling, setCancelling] = useState<string>(''); // key of offer being cancelled

  const loadListings = useCallback(async () => {
    if (!contracts.market) { setLoading(false); return; }
    try {
      setLoading(true);
      const filter = contracts.market.filters.Listed();
      const listedEvents = await contracts.market.queryFilter(filter, -5000);
      const delistedFilter = contracts.market.filters.Delisted();
      const delistedEvents = await contracts.market.queryFilter(delistedFilter, -5000);
      const soldFilter = contracts.market.filters.Sold();
      const soldEvents = await contracts.market.queryFilter(soldFilter, -5000);

      // Deactivated keys
      const deactivated = new Set<string>();
      for (const evt of delistedEvents) {
        const args = (evt as EventLog).args;
        deactivated.add(`${args.isStone}-${args.tokenId}`);
      }
      for (const evt of soldEvents) {
        const args = (evt as EventLog).args;
        deactivated.add(`${args.isStone}-${args.tokenId}`);
      }

      const parsed: MarketListing[] = [];
      const seen = new Set<string>();
      for (const evt of listedEvents.reverse()) {
        const args = (evt as EventLog).args;
        const isStone = args.isStone;
        const tokenId = Number(args.tokenId);
        const key = `${isStone}-${tokenId}`;
        if (seen.has(key) || deactivated.has(key)) continue;
        seen.add(key);

        const listingData = await contracts.market.listings(ethers.keccak256(
          ethers.solidityPacked(['bool', 'uint256'], [isStone, tokenId])
        ));
        if (!listingData.active) continue;

        parsed.push({
          isStone: Boolean(isStone),
          tokenId,
          seller: listingData.seller,
          price: Number(ethers.formatEther(listingData.price)),
        });
      }
      setListings(parsed);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  }, [contracts.market]);

  const loadOffers = useCallback(async () => {
    if (!contracts.market || !account) return;
    try {
      const madeFilter = contracts.market.filters.OfferMade();
      const madeEvents = await contracts.market.queryFilter(madeFilter, -5000);
      const cancelledFilter = contracts.market.filters.OfferCancelled();
      const cancelledEvents = await contracts.market.queryFilter(cancelledFilter, -5000);
      const acceptedFilter = contracts.market.filters.OfferAccepted();
      const acceptedEvents = await contracts.market.queryFilter(acceptedFilter, -5000);

      const deactivated = new Set<string>();
      for (const evt of cancelledEvents) {
        const args = (evt as EventLog).args;
        deactivated.add(`${args.buyer}-${args.isStone}-${args.tokenId}`);
      }
      for (const evt of acceptedEvents) {
        const args = (evt as EventLog).args;
        deactivated.add(`${args.buyer}-${args.isStone}-${args.tokenId}`);
      }

      const parsed: MarketOffer[] = [];
      const seen = new Set<string>();
      for (const evt of madeEvents.reverse()) {
        const args = (evt as EventLog).args;
        const key = `${args.buyer}-${args.isStone}-${args.tokenId}`;
        if (seen.has(key) || deactivated.has(key)) continue;
        seen.add(key);

        const offerData = await contracts.market.getOffer(args.isStone, args.tokenId);
        if (!offerData.active) continue;

        parsed.push({
          isStone: Boolean(args.isStone),
          tokenId: Number(args.tokenId),
          buyer: offerData.buyer,
          price: Number(ethers.formatEther(offerData.price)),
          active: true,
        });
      }
      setOffers(parsed);
    } catch (err) {
      console.error('Failed to load offers:', err);
    }
  }, [contracts.market, account]);

  useEffect(() => {
    if (connected) { loadListings(); loadOffers(); }
  }, [connected, loadListings, loadOffers]);

  // Listen for new events
  useEffect(() => {
    if (!contracts.market) return;
    const market = contracts.market;

    const onListed = (seller: string, isStone: boolean, tokenId: bigint, price: bigint) => {
      setListings(prev => {
        const exists = prev.find(l => l.isStone === isStone && l.tokenId === Number(tokenId));
        if (exists) return prev;
        return [...prev, {
          isStone,
          tokenId: Number(tokenId),
          seller,
          price: Number(ethers.formatEther(price)),
        }];
      });
    };
    const onDelistedOrSold = (...args: any[]) => {
      // args[2] is tokenId (indexed), args[1] is isStone (indexed) for Delisted
      let isStone: boolean, tokenId: number;
      const raw = args as any[];
      // Try to extract indexed params
      if (typeof raw[1] === 'boolean') {
        isStone = raw[1];
        tokenId = Number(raw[2]);
      } else {
        return; // can't parse
      }
      setListings(prev => prev.filter(l => !(l.isStone === isStone && l.tokenId === tokenId)));
    };

    market.on('Listed', onListed);
    market.on('Delisted', onDelistedOrSold);
    market.on('Sold', onDelistedOrSold);
    market.on('OfferMade', (buyer: string, isStone: boolean, tokenId: bigint, price: bigint) => {
      setOffers(prev => {
        const exists = prev.find(o => o.buyer === buyer && o.isStone === isStone && o.tokenId === Number(tokenId));
        if (exists) return prev;
        return [...prev, {
          isStone: Boolean(isStone),
          tokenId: Number(tokenId),
          buyer,
          price: Number(ethers.formatEther(price)),
          active: true,
        }];
      });
    });
    market.on('OfferCancelled', (buyer: string, isStone: boolean, tokenId: bigint) => {
      setOffers(prev => prev.filter(o => !(o.buyer === buyer && o.isStone === isStone && o.tokenId === Number(tokenId))));
    });
    market.on('OfferAccepted', (...args: any[]) => {
      setOffers(prev => prev.filter(o => !(o.buyer === args[0] && o.isStone === args[1] && o.tokenId === Number(args[2]))));
    });

    return () => {
      market.off('Listed', onListed);
      market.off('Delisted', onDelistedOrSold);
      market.off('Sold', onDelistedOrSold);
      market.off('OfferMade', () => {});
      market.off('OfferCancelled', () => {});
      market.off('OfferAccepted', () => {});
    };
  }, [contracts.market]);

  const filteredItems = listings.filter(item => {
    if (activeTab === 'stones' && !item.isStone) return false;
    if (activeTab === 'tools' && item.isStone) return false;
    if (activeTab === 'myListings' && item.seller.toLowerCase() !== account?.toLowerCase()) return false;
    return true;
  });

  const handleSell = useCallback(async () => {
    if (!sellItem || !sellPrice) return;
    try {
      setSelling(true);
      await listItem(sellItem.isStone, sellItem.tokenId, sellPrice);
      toast.success('上架成功');
      setShowSellModal(false);
      setSellItem(null);
      setSellPrice('');
      setTimeout(loadListings, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '上架失败';
      toast.error(msg);
    } finally {
      setSelling(false);
    }
  }, [sellItem, sellPrice, listItem, loadListings]);

  const handleBuy = async () => {
    if (!selectedListing) return;
    try {
      setBuying(true);
      await buyItem(selectedListing.isStone, selectedListing.tokenId);
      setListings(prev => prev.filter(l => !(l.isStone === selectedListing.isStone && l.tokenId === selectedListing.tokenId)));
      toast.success('购买成功');
      setShowBuyModal(false);
      setSelectedListing(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '购买失败';
      toast.error(msg);
    } finally {
      setBuying(false);
    }
  };

  const handleDelist = async (isStone: boolean, tokenId: number) => {
    try {
      await delistItem(isStone, tokenId);
      setListings(prev => prev.filter(l => !(l.isStone === isStone && l.tokenId === tokenId)));
      toast.success('已下架');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '下架失败';
      toast.error(msg);
    }
  };

  const handleMakeOffer = async () => {
    if (!offerTarget || !offerPrice) return;
    try {
      setOffering(true);
      await makeOffer(offerTarget.isStone, offerTarget.tokenId, offerPrice);
      toast.success('出价成功');
      setShowOfferModal(false);
      setOfferTarget(null);
      setOfferPrice('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '出价失败';
      toast.error(msg);
    } finally {
      setOffering(false);
    }
  };

  const handleAcceptOffer = async (isStone: boolean, tokenId: number, buyer: string) => {
    const key = `${buyer}-${isStone}-${tokenId}`;
    try {
      setAccepting(key);
      await acceptOffer(isStone, tokenId, buyer);
      setOffers(prev => prev.filter(o => !(o.buyer === buyer && o.isStone === isStone && o.tokenId === tokenId)));
      toast.success('已接受出价，交易完成');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '接受失败';
      toast.error(msg);
    } finally {
      setAccepting('');
    }
  };

  const handleCancelOffer = async (isStone: boolean, tokenId: number) => {
    const key = `cancel-${isStone}-${tokenId}`;
    try {
      setCancelling(key);
      await cancelOffer(isStone, tokenId);
      setOffers(prev => prev.filter(o => !(o.isStone === isStone && o.tokenId === tokenId)));
      toast.success('出价已撤回');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '撤回失败';
      toast.error(msg);
    } finally {
      setCancelling('');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-cyan-50 via-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 shadow-xl"
      >
        <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600">NFT 交易所</h1>
        <p className="text-gray-700 text-lg font-medium">自由买卖原石和工具 · 挂单、出价、即时成交</p>
      </motion.div>

      {/* Filters & Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-300 shadow-lg">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-1 inline-flex border-2 border-purple-300 shadow">
            {([
              { key: 'all', label: '全部' },
              { key: 'stones', label: '原石' },
              { key: 'tools', label: '工具' },
              { key: 'myListings', label: '我的挂单' },
              { key: 'offers', label: '出价管理' },
            ] as const).map(tab => (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >{tab.label}</button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setOfferTarget({ isStone: true, tokenId: 0 }); setShowOfferModal(true); }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow hover:scale-105 transition-transform"
            >发起出价</button>
            <button onClick={() => {
              if (!connected) { toast.error('请先连接钱包'); connectWallet(); return; }
              setShowSellModal(true);
            }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow hover:scale-105 transition-transform"
            >上架 NFT</button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
          <span className="ml-3 text-lg text-gray-600 font-semibold">加载挂单...</span>
        </div>
      )}

      {/* Listings Grid */}
      {!loading && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-gray-800 flex items-center">
              <i className="fas fa-store text-blue-600 mr-2"></i>
              {activeTab === 'myListings' ? '我的挂单' : '市场挂单'}
            </h2>
            <span className="text-gray-600 text-sm font-semibold bg-blue-50 px-3 py-1 rounded-full border border-blue-300">
              共 {filteredItems.length} 件
            </span>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <motion.div key={`${item.isStone}-${item.tokenId}`}
                  whileHover={{ scale: 1.05, y: -6 }}
                  className="rounded-2xl overflow-hidden border-2 shadow-lg transition-all bg-gradient-to-br from-white to-blue-50 border-blue-300 hover:border-blue-500"
                >
                  <div className={`relative h-40 flex items-center justify-center ${
                    item.isStone
                      ? 'bg-gradient-to-br from-blue-50 to-purple-50'
                      : 'bg-gradient-to-br from-green-50 to-emerald-50'
                  }`}>
                    {item.isStone ? (
                      <>
                        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 blur-xl"></div>
                        <i className="fas fa-gem text-7xl text-white relative drop-shadow-lg"></i>
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 blur-xl"></div>
                        <i className="fas fa-wrench text-7xl text-white relative drop-shadow-lg"></i>
                      </>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-800">
                        {item.isStone ? '原石' : '工具'} #{item.tokenId}
                      </h3>
                      <div className="flex items-center bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-lg px-2 py-1 shadow">
                        <i className="fas fa-coins text-yellow-600 text-xs mr-1"></i>
                        <span className="font-bold text-yellow-700">{item.price}</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-4">
                      <span className="truncate block" title={item.seller}>
                        卖家: {item.seller.slice(0, 6)}...{item.seller.slice(-4)}
                      </span>
                    </div>

                    {activeTab === 'myListings' ? (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => handleDelist(item.isStone, item.tokenId)}
                        className="w-full py-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg text-white font-medium"
                      >下架</motion.button>
                    ) : (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (!connected) { toast.error('请先连接钱包'); connectWallet(); return; }
                          setSelectedListing(item); setShowBuyModal(true);
                        }}
                        disabled={item.seller.toLowerCase() === account?.toLowerCase()}
                        className={`w-full py-2 rounded-lg text-white font-medium transition-all ${
                          item.seller.toLowerCase() === account?.toLowerCase()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg'
                        }`}
                      >{item.seller.toLowerCase() === account?.toLowerCase() ? '自己的挂单' : '立即购买'}</motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 border-2 border-blue-300 flex flex-col items-center justify-center min-h-[300px] shadow-lg">
              <i className="fas fa-store-slash text-5xl text-blue-300 mb-4"></i>
              <h3 className="text-xl font-bold text-gray-700 mb-1">暂无挂单</h3>
              <p className="text-gray-500">成为第一个上架 NFT 的人吧</p>
            </div>
          )}
        </div>
      )}

      {/* Offers Tab */}
      {!loading && activeTab === 'offers' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-gray-800 flex items-center">
              <i className="fas fa-hand-holding-usd text-amber-600 mr-2"></i>
              出价管理
            </h2>
            <div className="bg-amber-100 rounded-xl p-1 inline-flex border-2 border-amber-300">
              {([
                { key: 'incoming' as const, label: '收到的出价' },
                { key: 'outgoing' as const, label: '我的出价' },
              ]).map(tab => (
                <button key={tab.key}
                  onClick={() => setOfferSubTab(tab.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    offerSubTab === tab.key
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow'
                      : 'text-gray-700 hover:text-amber-600'
                  }`}
                >{tab.label}</button>
              ))}
            </div>
          </div>

          {offerSubTab === 'incoming' ? (
            // Incoming offers (all active offers — user can accept if they own the NFT)
            offers.length > 0 ? (
              <div className="space-y-3">
                {offers.map(o => {
                  const key = `${o.buyer}-${o.isStone}-${o.tokenId}`;
                  return (
                    <div key={key} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200 flex items-center justify-between shadow">
                      <div className="flex items-center gap-4">
                        <i className={`fas ${o.isStone ? 'fa-gem text-blue-500' : 'fa-wrench text-green-500'} text-2xl`}></i>
                        <div>
                          <h4 className="font-bold text-gray-800">{o.isStone ? '原石' : '工具'} #{o.tokenId}</h4>
                          <p className="text-sm text-gray-600">买家: {o.buyer.slice(0, 6)}...{o.buyer.slice(-4)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-amber-700 text-lg">
                          <i className="fas fa-coins text-amber-500 mr-1"></i>{o.price} MSTK
                        </span>
                        <button onClick={() => handleAcceptOffer(o.isStone, o.tokenId, o.buyer)}
                          disabled={accepting === key}
                          className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold hover:scale-105 transition-transform disabled:opacity-50 shadow"
                        >{accepting === key ? '处理中...' : '接受出价'}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-12 border-2 border-amber-200 flex flex-col items-center justify-center min-h-[200px] shadow">
                <i className="fas fa-inbox text-4xl text-amber-300 mb-3"></i>
                <h3 className="text-lg font-bold text-gray-700 mb-1">暂无收到出价</h3>
                <p className="text-gray-500 text-sm">当有人对你的 NFT 出价时，这里会显示</p>
              </div>
            )
          ) : (
            // Outgoing offers (my offers)
            (() => {
              const myOffers = offers.filter(o => o.buyer.toLowerCase() === account?.toLowerCase());
              return myOffers.length > 0 ? (
                <div className="space-y-3">
                  {myOffers.map(o => {
                    const key = `cancel-${o.isStone}-${o.tokenId}`;
                    return (
                      <div key={key} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border-2 border-blue-200 flex items-center justify-between shadow">
                        <div className="flex items-center gap-4">
                          <i className={`fas ${o.isStone ? 'fa-gem text-blue-500' : 'fa-wrench text-green-500'} text-2xl`}></i>
                          <div>
                            <h4 className="font-bold text-gray-800">{o.isStone ? '原石' : '工具'} #{o.tokenId}</h4>
                            <p className="text-sm text-gray-500">等待卖家接受</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-blue-700 text-lg">
                            <i className="fas fa-coins text-blue-500 mr-1"></i>{o.price} MSTK
                          </span>
                          <button onClick={() => handleCancelOffer(o.isStone, o.tokenId)}
                            disabled={cancelling === key}
                            className="px-5 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg font-bold hover:scale-105 transition-transform disabled:opacity-50 shadow"
                          >{cancelling === key ? '撤回中...' : '撤退出价'}</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 border-2 border-blue-200 flex flex-col items-center justify-center min-h-[200px] shadow">
                  <i className="fas fa-paper-plane text-4xl text-blue-300 mb-3"></i>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">暂无进行中的出价</h3>
                  <p className="text-gray-500 text-sm">使用「发起出价」按钮对任意 NFT 出价</p>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Buy Modal */}
      {showBuyModal && selectedListing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowBuyModal(false)}
        >
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 max-w-md w-full border-2 border-blue-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">确认购买</h3>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-300">
              <div className="flex items-center gap-4">
                <i className={`fas ${selectedListing.isStone ? 'fa-gem' : 'fa-wrench'} text-3xl`}></i>
                <div>
                  <h4 className="text-lg font-bold text-gray-800">
                    {selectedListing.isStone ? '原石' : '工具'} #{selectedListing.tokenId}
                  </h4>
                  <p className="text-gray-600 text-sm">卖家: {selectedListing.seller.slice(0, 6)}...{selectedListing.seller.slice(-4)}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-lg mb-4">
              <span className="text-gray-700 font-semibold">价格</span>
              <span className="font-bold flex items-center text-yellow-700">
                <i className="fas fa-coins text-yellow-600 mr-1"></i>{selectedListing.price}
              </span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBuyModal(false)}
                className="flex-1 py-3 bg-gray-300 rounded-xl text-gray-800 font-bold hover:bg-gray-400 transition-all"
              >取消</button>
              <button onClick={handleBuy} disabled={buying}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-white font-bold hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50"
              >{buying ? '处理中...' : '确认购买'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Sell Modal */}
      {showSellModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setShowSellModal(false); setSellItem(null); }}
        >
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 max-w-md w-full border-2 border-blue-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">上架 NFT</h3>
            <p className="text-gray-600 mb-4 text-sm font-medium">选择你要出售的原石或工具</p>

            <div className="space-y-3 mb-4">
              <h4 className="font-bold text-gray-700">你的原石:</h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {userData.stones.length === 0 && <span className="text-gray-400 text-sm">暂无原石</span>}
                {userData.stones.map(s => (
                  <button key={s.id} onClick={() => setSellItem({ isStone: true, tokenId: s.id })}
                    className={`px-3 py-1 rounded-lg text-sm font-bold border-2 transition-all ${
                      sellItem?.isStone && sellItem.tokenId === s.id
                        ? 'border-blue-600 bg-blue-100 text-blue-700'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >原石 #{s.id} ({STONE_GRADE_NAMES[s.grade]})</button>
                ))}
              </div>

              <h4 className="font-bold text-gray-700 mt-4">你的工具:</h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {userData.tools.length === 0 && <span className="text-gray-400 text-sm">暂无工具</span>}
                {userData.tools.map(t => (
                  <button key={t.id} onClick={() => setSellItem({ isStone: false, tokenId: t.id })}
                    className={`px-3 py-1 rounded-lg text-sm font-bold border-2 transition-all ${
                      sellItem && !sellItem.isStone && sellItem.tokenId === t.id
                        ? 'border-blue-600 bg-blue-100 text-blue-700'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >工具 #{t.id} ({TOOL_LEVEL_NAMES[t.level]})</button>
                ))}
              </div>
            </div>

            {sellItem && (
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">价格 (MSTK)</label>
                <input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)}
                  placeholder="输入价格" min="1"
                  className="w-full border-2 border-blue-300 rounded-xl px-4 py-2 text-gray-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowSellModal(false); setSellItem(null); }}
                className="flex-1 py-3 bg-gray-300 rounded-xl text-gray-800 font-bold hover:bg-gray-400 transition-all"
              >取消</button>
              <button onClick={handleSell} disabled={!sellItem || !sellPrice || selling}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-white font-bold hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50"
              >{selling ? '上架中...' : '确认上架'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setShowOfferModal(false); setOfferTarget(null); }}
        >
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-gradient-to-br from-white to-amber-50 rounded-2xl p-6 max-w-md w-full border-2 border-amber-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">发起出价</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">类型</label>
                <select value={offerTarget?.isStone ? 'stone' : 'tool'}
                  onChange={e => setOfferTarget({ isStone: e.target.value === 'stone', tokenId: 0 })}
                  className="w-full border-2 border-amber-300 rounded-xl px-4 py-2 text-gray-800 focus:border-amber-500 focus:outline-none"
                >
                  <option value="stone">原石</option>
                  <option value="tool">工具</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Token ID</label>
                <input type="number" value={offerTarget?.tokenId || ''}
                  onChange={e => setOfferTarget(prev => prev ? { ...prev, tokenId: parseInt(e.target.value) || 0 } : { isStone: true, tokenId: parseInt(e.target.value) || 0 })}
                  placeholder="输入 NFT ID" min="1"
                  className="w-full border-2 border-amber-300 rounded-xl px-4 py-2 text-gray-800 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">出价 (MSTK)</label>
                <input type="number" value={offerPrice} onChange={e => setOfferPrice(e.target.value)}
                  placeholder="输入出价" min="1"
                  className="w-full border-2 border-amber-300 rounded-xl px-4 py-2 text-gray-800 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-4 bg-amber-50 p-2 rounded-lg border border-amber-200">
              出价金额将从你的钱包中扣除并托管在合约中。卖家接受后自动成交；你可以随时撤回出价。
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowOfferModal(false); setOfferTarget(null); }}
                className="flex-1 py-3 bg-gray-300 rounded-xl text-gray-800 font-bold hover:bg-gray-400 transition-all"
              >取消</button>
              <button onClick={handleMakeOffer} disabled={!offerTarget?.tokenId || !offerPrice || offering}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50"
              >{offering ? '出价中...' : '确认出价'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
