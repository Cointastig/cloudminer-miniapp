import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

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
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/api': path.resolve(__dirname, './src/api'),
        '@/styles': path.resolve(__dirname, './src/styles'),
        '@/assets': path.resolve(__dirname, './src/assets'),
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
      // Fix for Node.js globals
      global: 'globalThis',
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
