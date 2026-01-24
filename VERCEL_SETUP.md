# Vercel 部署配置指南

## 如果部署失败，请在 Vercel 中手动配置以下步骤：

### 1. 访问项目设置
1. 登录 [Vercel 控制台](https://vercel.com/dashboard)
2. 选择 "magic-stone" 项目
3. 进入 **Settings** 标签

### 2. 配置构建环境
1. 点击 **Build & Development Settings**
2. 在 **Package Manager** 下拉菜单中选择 **npm**
3. （或者如果没有这个选项，继续下一步）

### 3. 配置环境变量（如需要）
1. 进入 **Settings** → **Environment Variables**
2. 添加（如果需要）：
   ```
   PNPM_HOME=/app/.pnpm
   ```

### 4. 清除缓存并重新部署
1. 回到 **Deployments**
2. 点击最新的失败部署
3. 点击 **Options** → **Redeploy**
4. 勾选 **"Clear build cache"**
5. 点击 **Redeploy**

### 5. 或者断开并重新连接 GitHub
1. 进入 **Settings** → **Git**
2. 点击 **Disconnect**
3. 重新连接 GitHub 仓库
4. 选择分支 "main"
5. 点击 **Deploy**

## 常见问题

**Q: 为什么还是检测到 pnpm？**
A: 这可能是 Vercel 缓存的问题。请清除构建缓存并重新部署。

**Q: 部署仍然失败？**
A: 可能需要在 Vercel UI 中明确设置 Package Manager 为 npm。在项目设置中找到相关选项。

## 检查部署日志
1. 进入 Deployments 标签
2. 点击部署记录
3. 点击 "Logs" 查看完整日志
4. 搜索 "Installing dependencies" 查看使用的包管理器
