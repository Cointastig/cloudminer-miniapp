import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        // Configure SWC options
        plugins: [],
      }),
    ],
    
    // Path resolution
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@/components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@/utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@/hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
        '@/types': fileURLToPath(new URL('./src/types', import.meta.url)),
        '@/api': fileURLToPath(new URL('./src/api', import.meta.url)),
        '@/styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
        '@/assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      },
    },
    
    // Development server
    server: {
      host: true, // Listen on all addresses
      port: 3000,
      strictPort: false,
      open: false, // Don't auto-open browser
      cors: true,
      proxy: {
        // Proxy API requests to avoid CORS issues in development
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    
    // Preview server (for production preview)
    preview: {
      host: true,
      port: 4173,
      strictPort: false,
      open: false,
      cors: true,
    },
    
    // Build configuration
    build: {
      target: 'es2015', // Better compatibility
      outDir: 'dist',
      assetsDir: 'assets',
      minify: 'esbuild',
      sourcemap: false, // Disable sourcemaps in production
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1600,
      
      // Rollup options
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
        },
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // Vendor chunks
            'vendor-react': ['react', 'react-dom'],
            'vendor-framer': ['framer-motion'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-ton': ['@tonconnect/ui-react'],
            'vendor-telegram': ['@twa-dev/sdk'],
            'vendor-ui': ['clsx', 'lucide-react'],
          },
          
          // Naming pattern for chunks
          chunkFileNames: 'js/[name]-[hash].js',
          
          // Asset naming
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name?.split('.').pop() || '';
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return 'images/[name]-[hash][extname]';
            }
            if (/css/i.test(extType)) {
              return 'css/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          
          // Entry file naming
          entryFileNames: 'js/[name]-[hash].js',
        },
      },
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Asset inlining threshold
      assetsInlineLimit: 4096,
      
      // ESBuild options
      esbuild: {
        legalComments: 'none',
        treeShaking: true,
      },
    },
    
    // CSS configuration
    css: {
      devSourcemap: mode === 'development',
    },
    
    // Environment variables
    envPrefix: ['VITE_'],
    
    // Base path - IMPORTANT: Use '/' for Vercel
    base: '/',
    
    // Public directory
    publicDir: 'public',
    
    // Define global constants
    define: {
      // Global constants available in the app
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV__: mode === 'development',
      __PROD__: mode === 'production',
      // Ensure process.env is defined for libraries that expect it
      'process.env': {},
    },
    
    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'framer-motion',
        '@supabase/supabase-js',
        '@tonconnect/ui-react',
        '@twa-dev/sdk',
        'clsx',
        'lucide-react',
      ],
      exclude: [],
      esbuildOptions: {
        target: 'es2015',
      },
    },
    
    // Worker configuration
    worker: {
      format: 'es',
      plugins: () => [],
    },
    
    // JSON configuration
    json: {
      namedExports: true,
      stringify: false,
    },
    
    // Logging
    logLevel: mode === 'development' ? 'info' : 'warn',
    clearScreen: false,
  };
});
