short_name: 'ZeroSei',
    description: 'App per ordinare pizza d\'asporto da ZeroSei',
        theme_color: '#E74C3C',
            background_color: '#FFFFFF',
                display: 'standalone',
                    icons: [
                        {
                            src: 'icons/icon-192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: 'icons/icon-512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        }
                    ]
            },
workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'firebase-images-cache',
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                    }
                }
            }
        ]
}
        })
    ],
})
