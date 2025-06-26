// 确保从这里复制，以避免不可见字符问题
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 启用静态导出以便在Hugging Face Space上部署
  output: 'export',
  // 关闭 eslint 和 typescript 检查可以加速构建，尤其是在调试时
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig