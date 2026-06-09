#!/bin/bash

# 1. 自动定位微信内置 node 路径
NODE_DIR="/Applications/wechatwebdevtools.app/Contents/Frameworks/nwjs Framework.framework/Versions/91.0.4472.114/Helpers/wechatwebdevtools Helper (Renderer).app/Contents/MacOS"

if [ ! -d "$NODE_DIR" ]; then
  echo "❌ 未找到微信开发者工具内置 Node.js，请确认微信开发者工具是否安装在默认的 /Applications 目录下。"
  exit 1
fi

# 2. 临时将微信内置 Node 路径加入 PATH 环境变量，使得后置编译钩子（如 esbuild）可以调用 node
export PATH="$NODE_DIR:$PATH"
echo "✅ 已成功加载微信内置 Node.js"
echo "👉 Node 版本: $(node --version)"

# 3. 定位到项目 admin 目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../admin" || exit 1

# 4. 如果没有下载过 npm 脚本包，则进行下载
if [ ! -f "package/bin/npm-cli.js" ]; then
  echo "📦 正在从官方源下载兼容的 npm 脚本包..."
  curl -L https://registry.npmjs.org/npm/-/npm-8.19.4.tgz -o npm.tgz
  tar -xf npm.tgz
  rm -f npm.tgz
fi

# 5. 安装依赖
echo "🚀 开始安装后台网页依赖，请稍候..."
node package/bin/npm-cli.js install

# 5.5 解除 macOS 对 node_modules 中二进制文件（如 esbuild）的安全隔离拦截
if [ "$(uname)" == "Darwin" ]; then
  echo "🔒 正在自动解除 macOS 对构建依赖的安全隔离限制..."
  xattr -r -d com.apple.quarantine node_modules 2>/dev/null
fi

# 6. 执行打包
echo "🏗️ 开始编译打包后台网页..."
node package/bin/npm-cli.js run build

echo "🎉 编译成功！已在 admin 目录下生成了 dist 文件夹。"
echo "👉 请将 admin/dist/ 目录下的所有文件上传到您的云开发静态网站托管空间中。"
