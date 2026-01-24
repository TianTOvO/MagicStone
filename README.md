
# 原石狂磨 (Magic Stone) - 完整项目说明文档

## 📖 项目概述

**原石狂磨**是一个基于 Web3 的链上游戏平台，融合了 NFT 游戏机制、DeFi 经济系统和 Monad 区块链技术。玩家可以收集、打磨和交易数字资产，体验完整的 GameFi 生态。

**项目状态**: ✅ 已部署到 Monad 测试网
**部署日期**: 2026年1月24日
**网络**: Monad Testnet (Chain ID: 10143)

---

## 🚀 核心功能

### 1. **打磨站** (PolishingPage)
- 选择原石和工具进行打磨
- 使用工具耐久度进行战斗
- 成功打磨后原石品质升级
- 实时显示打磨进度和效果

### 2. **商城** (ShopPage)
- 购买多个等级的原石（平凡→神秘→奇特→珍稀→璀璨）
- 购买多个等级的工具（普通→专业→顶级→传奇）
- 使用游戏币进行交易
- 管理员功能：直接增加游戏币

### 3. **工具合成站** (ToolCraftPage)
- 3:1 合成机制：3个相同等级工具合成1个更高等级工具
- 工具等级进阶：普通 → 专业 → 顶级 → 传奇
- 实时库存管理
- 合成预览和效果展示

### 4. **任务系统** (QuestsPage)
- 完成多个难度的谜题任务
- 获得原石和游戏币奖励
- 任务进度追踪
- 动态难度系统

### 5. **市场** (MarketPage)
- NFT 交易平台
- 出售和购买原石与工具
- 价格浮动机制
- 交易历史记录

### 6. **背包** (InventoryPage)
- 查看所有持有的 NFT
- 展示原石属性（品质、耐久度等）
- 展示工具效率系数
- 资产统计信息

### 7. **主页** (HomePage)
- 游戏概览和新闻
- 快速导航
- 用户统计
- 社区推荐

---

## 🏆 智能合约部署信息

### 部署网络
- **网络名称**: Monad Testnet
- **Chain ID**: 10143
- **RPC**: https://testnet-rpc.monad.xyz/
- **浏览器**: https://testnet-explorer.monad.xyz/

### 合约地址

| 合约名称 | 功能 | 地址 |
|---------|------|------|
| **GameToken** | ERC20 游戏币 | `0xb5AE1693d73de6cA78c6E5e767BDfE510B703Dd5` |
| **StoneNFT** | ERC721 原石 NFT | `0x719Be548a3499A9eB719C84F8720123f819bA43F` |
| **ToolNFT** | ERC721 工具 NFT | `0xf3007729f70233d29f8c5Cb38975a6c329945211` |
| **Market** | NFT 交易市场 | `0xFD333504a7850457f625516FD028E1747fEa5C6F` |
| **Polishing** | 打磨游戏逻辑 | `0xe9830C45f22Fc383c1C58A8a9cC38B6FD0De5e14` |
| **Quest** | 任务系统 | `0x4549C7a1D9A941570b3D7be5fE95Ec509eA2230a` |

### 部署部署信息

```
MagicStoneModule#GameToken - 0xb5AE1693d73de6cA78c6E5e767BDfE510B703Dd5
MagicStoneModule#StoneNFT - 0x719Be548a3499A9eB719C84F8720123f819bA43F
MagicStoneModule#ToolNFT - 0xf3007729f70233d29f8c5Cb38975a6c329945211
MagicStoneModule#Market - 0xFD333504a7850457f625516FD028E1747fEa5C6F
MagicStoneModule#Polishing - 0xe9830C45f22Fc383c1C58A8a9cC38B6FD0De5e14
MagicStoneModule#Quest - 0x4549C7a1D9A941570b3D7be5fE95Ec509eA2230a
```

---

## 📊 游戏经济系统

### 原石品质等级
| 品质 | 名称 | 购买价格 | 升级难度 | 特殊属性 |
|------|------|---------|--------|---------|
| 1 | 平凡 | 100 币 | ⭐ | 基础原石 |
| 2 | 神秘 | 500 币 | ⭐⭐ | 稍显神秘 |
| 3 | 奇特 | 800 币 | ⭐⭐⭐ | 独特效应 |
| 4 | 珍稀 | 1500 币 | ⭐⭐⭐⭐ | 稀有属性 |
| 5 | 璀璨 | 3000 币 | ⭐⭐⭐⭐⭐ | 极稀有 |

### 工具等级系统
| 等级 | 名称 | 购买价格 | 耐久上限 | 损耗系数 | 耐久消耗 |
|------|------|---------|---------|---------|---------|
| 1 | 普通 | 50 币 | 100 | 1.0 | 0.5 |
| 2 | 专业 | 300 币 | 120 | 0.8 | 0.4 |
| 3 | 顶级 | 1200 币 | 150 | 0.5 | 0.3 |
| 4 | 传奇 | 2500 币 | 200 | 0.2 | 0.2 |

### 工具合成规则
```
3x 普通工具 → 1x 专业工具
3x 专业工具 → 1x 顶级工具
3x 顶级工具 → 1x 传奇工具
⚠️ 传奇工具为最高等级，无法继续合成
```

---

## 💻 技术栈

### 前端框架
- **React** 18 - UI 框架
- **TypeScript** - 类型安全
- **Vite** 6.4.1 - 构建工具
- **Tailwind CSS** 3.4.17 - 样式系统
- **Framer Motion** - 动画库
- **ethers.js** v6 - Web3 交互

### 智能合约
- **Solidity** 0.8.28 - 合约语言
- **OpenZeppelin** - 标准库
- **Hardhat** - 开发框架
- **Ignition** - 部署工具

### 区块链网络
- **Monad Testnet** - 测试网络

---

## 🎨 设计系统

### 主题颜色
- **原色**: 琥珀色 (#FBBF24)、橙色 (#FB923C)、红色 (#EF4444)
- **辅助色**: 粉色 (#EC4899)、玫瑰色 (#F43F5E)
- **背景**: 纯白色 (#FFFFFF)
- **文字**: 深灰色 (#1F2937)

### 视觉效果
- ✨ 渐变色背景和边框
- 🎬 流畅的 Framer Motion 动画
- 🌟 Glassmorphism 玻璃态效果
- 📱 完全响应式设计
- ♿ 无障碍访问支持

---

## 📁 项目结构

```
project-root/
├── contracts/              # 智能合约源码
│   └── Lock.sol
├── ignition/              # 部署脚本
│   └── modules/
│       └── MagicStone.js   # 主部署模块
├── src/                   # 前端源代码
│   ├── App.tsx            # 主应用路由
│   ├── main.tsx           # 应用入口
│   ├── index.css          # 全局样式
│   ├── components/        # 可复用组件
│   │   ├── Navbar.tsx     # 导航栏
│   │   ├── Footer.tsx     # 页脚
│   │   └── Empty.tsx      # 空状态
│   ├── contexts/          # React Context
│   │   ├── authContext.ts         # 认证上下文
│   │   ├── themeContext.tsx       # 主题上下文
│   │   └── userDataContext.ts     # 用户数据上下文
│   ├── hooks/             # 自定义 Hooks
│   │   ├── useTheme.ts           # 主题 Hook
│   │   └── useContracts.ts       # 合约交互 Hook
│   ├── lib/               # 工具函数
│   │   ├── utils.ts              # 通用工具
│   │   └── contractAddresses.ts  # 合约地址配置
│   └── pages/             # 页面组件
│       ├── HomePage.tsx          # 主页
│       ├── PolishingPage.tsx      # 打磨站
│       ├── ToolCraftPage.tsx      # 工具合成站
│       ├── ShopPage.tsx           # 商城
│       ├── QuestsPage.tsx         # 任务系统
│       ├── MarketPage.tsx         # 市场
│       └── InventoryPage.tsx      # 背包
├── test/                  # 测试文件
│   └── Lock.js
├── hardhat.config.cjs     # Hardhat 配置
├── vite.config.ts         # Vite 构建配置
├── tsconfig.json          # TypeScript 配置
├── tailwind.config.js     # Tailwind CSS 配置
├── package.json           # 项目依赖
└── .env                   # 环境变量（本地）
```

---

## 🔧 快速开始

### 前置要求
- Node.js >= 16.0.0
- npm 或 pnpm
- MetaMask 或其他 Web3 钱包

### 环境配置

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd 328219954434
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或
   pnpm install
   ```

3. **配置 .env 文件**
   ```bash
   # 复制 .env.example 到 .env
   cp .env.example .env
   
   # 编辑 .env，添加你的私钥
   MONAD_RPC_URL=https://testnet-rpc.monad.xyz/
   PRIVATE_KEY=your_private_key_here
   ```

### 本地开发

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 构建生产版本

```bash
npm run build

# 预览生产构建
npm run preview
```

### 智能合约操作

```bash
# 编译合约
npx hardhat compile

# 部署到 Monad 测试网
npx hardhat ignition deploy ignition/modules/MagicStone.js --network monad

# 本地测试
npx hardhat test
```

---

## 🌐 网络配置

### MetaMask 添加 Monad 测试网

1. 打开 MetaMask
2. 点击网络下拉菜单 → "添加网络"
3. 填写以下信息：
   - **网络名称**: Monad Testnet
   - **RPC URL**: https://testnet-rpc.monad.xyz/
   - **Chain ID**: 10143
   - **货币符号**: MON
   - **区块浏览器**: https://testnet-explorer.monad.xyz/

### 获取测试币

1. 访问 [Monad 水龙头](https://testnet-faucet.monad.xyz/)
2. 连接你的钱包
3. 点击"Claim"获取测试 MON

---

## 📋 合约交互指南

### GameToken (ERC20)
```typescript
// 获取余额
const balance = await gameToken.balanceOf(userAddress);

// 转账
await gameToken.transfer(recipientAddress, amount);

// 批准额度
await gameToken.approve(spenderAddress, amount);
```

### StoneNFT (ERC721)
```typescript
// 铸造原石
await stoneNFT.mint(userAddress, grade, damage, durability);

// 获取原石属性
const stone = await stoneNFT.stones(tokenId);

// 升级品质
await stoneNFT.setGrade(tokenId, newGrade);

// 增加损伤
await stoneNFT.increaseDamage(tokenId, damageAmount);
```

### ToolNFT (ERC721)
```typescript
// 铸造工具
await toolNFT.mint(userAddress, level, durability, lossCoeff);

// 减少耐久度
await toolNFT.decreaseDurability(tokenId, amount);
```

### Polishing
```typescript
// 打磨原石
await polishing.polish(stoneTokenId, toolTokenId);

// 查看打磨进度
const progress = await polishing.polishingProgress(stoneTokenId);
```

### Market
```typescript
// 上架 NFT
await market.listNFT(nftAddress, tokenId, price);

// 购买 NFT
await market.buyNFT(listingId, { value: price });

// 取消上架
await market.cancelListing(listingId);
```

### Quest
```typescript
// 完成任务
await quest.completePuzzle(questId, answer);

// 领取奖励
await quest.claimReward(questId);
```

---

## 🔒 安全考虑

### 私钥管理
- ⚠️ **绝不**将私钥提交到版本控制
- ✅ 使用 `.env` 文件管理敏感信息
- ✅ `.env` 文件已添加到 `.gitignore`
- ✅ 仅在本地环境中保存私钥

### 合约审计
- 所有合约均使用 OpenZeppelin 标准库
- ERC20、ERC721 符合国际标准
- 访问控制使用 Ownable 模式
- 重要操作具有事件日志

### 用户资产保护
- Web3 钱包集成（MetaMask）
- 用户签名验证
- 链上所有权证明
- 智能合约 Audit 就绪

---

## 📞 故障排除

### 部署错误

#### 错误: "Invalid params"
**原因**: `.env` 文件未正确配置或私钥格式错误
**解决方案**:
1. 检查 `.env` 文件是否存在
2. 确保 `PRIVATE_KEY` 是 64 位十六进制数（无 0x 前缀）
3. 确保 `MONAD_RPC_URL` 正确

#### 错误: "Insufficient funds"
**原因**: 钱包中 MON 余额不足
**解决方案**:
1. 访问 [Monad 水龙头](https://testnet-faucet.monad.xyz/)
2. 确认钱包地址正确
3. 等待交易确认

### 连接错误

#### 网络连接失败
**原因**: MetaMask 未正确配置
**解决方案**:
1. 检查 MetaMask 中的网络配置
2. 确认 RPC URL 为 https://testnet-rpc.monad.xyz/
3. 切换到其他 RPC 端点重试

### 交易失败

#### 交易被拒绝
**原因**: 通常是合约调用参数错误
**解决方案**:
1. 检查参数类型和值
2. 确认钱包中有足够的 MON 和游戏币
3. 查看浏览器控制台的详细错误信息

---

## 📈 性能指标

### 构建信息
- **总大小**: 727.59 KB JavaScript
- **压缩大小**: 233.29 KB (gzipped)
- **模块数**: 604 个
- **构建时间**: < 5 秒

### 游戏性能
- ✅ 60 FPS 动画
- ✅ < 100ms 交互响应
- ✅ < 1s 页面加载
- ✅ 完全离线缓存支持

---

## 🔄 更新日志

### v1.0.0 (2026-01-24)
- ✅ 初始发布
- ✅ 6 个核心合约部署
- ✅ 7 个游戏页面完成
- ✅ 完整的 GameFi 生态
- ✅ Monad 测试网支持

---

## 📚 文档参考

- [Hardhat 文档](https://hardhat.org/)
- [ethers.js 文档](https://docs.ethers.org/v6/)
- [OpenZeppelin 合约](https://docs.openzeppelin.com/contracts/)
- [Monad 官方文档](https://docs.monad.xyz/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React 文档](https://react.dev/)

---

## 📧 联系方式

- **邮箱**: support@magicstone.game
- **Discord**: [加入社区](https://discord.gg/magicstone)
- **Twitter**: [@MagicStoneGame](https://twitter.com/magicstone)

---

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

感谢以下项目和社区的支持：
- OpenZeppelin 团队
- Hardhat 开发团队
- Monad 生态
- 所有贡献者

---

**项目部署时间**: 2026年1月24日  
**最后更新**: 2026年1月24日

祝你玩得愉快！🎮✨
