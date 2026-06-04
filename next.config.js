const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.roblox.com' },
      { protocol: 'https', hostname: 'tr.rbxcdn.com' },
      { protocol: 'https', hostname: 't*.rbxcdn.com' },
    ],
  },
}
module.exports = nextConfig
