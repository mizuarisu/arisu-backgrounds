/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.roblox.com' },
      { protocol: 'https', hostname: 'tr.rbxcdn.com' },
      { protocol: 'https', hostname: 't0.rbxcdn.com' },
      { protocol: 'https', hostname: 't1.rbxcdn.com' },
      { protocol: 'https', hostname: 't2.rbxcdn.com' },
      { protocol: 'https', hostname: 't3.rbxcdn.com' },
      { protocol: 'https', hostname: 't4.rbxcdn.com' },
      { protocol: 'https', hostname: 't5.rbxcdn.com' },
      { protocol: 'https', hostname: 't6.rbxcdn.com' },
      { protocol: 'https', hostname: 't7.rbxcdn.com' },
    ],
  },
}

module.exports = nextConfig
