<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#0f0f23" />
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <title>DTX CloudMiner</title>
  <style>
    /* Prevent flash of unstyled content */
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
      font-family: system-ui, -apple-system, sans-serif;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Loading animation */
    .loading-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(99, 102, 241, 0.3);
      border-top: 3px solid #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Hide root until React is loaded */
    #root {
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    #root.loaded {
      opacity: 1;
    }
  </style>
</head>
<body class="min-h-screen">
  <div id="loading" class="loading-screen">
    <div class="loading-spinner"></div>
  </div>
  <div id="root"></div>
  <script type="module" src="/src/index.tsx"></script>
  <script>
    // Initialize Telegram WebApp immediately
    if (window.Telegram && window.Telegram.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      } catch (e) {
        console.warn('Telegram WebApp initialization error:', e);
      }
    }
    
    // Hide loading screen when React app loads
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const loading = document.getElementById('loading');
        const root = document.getElementById('root');
        if (loading && root) {
          loading.style.opacity = '0';
          loading.style.transition = 'opacity 0.3s ease';
          root.classList.add('loaded');
          setTimeout(() => loading.remove(), 300);
        }
      }, 100);
    });
    
    // Error handler
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      // Don't hide loading screen on error so user sees something
    });
  </script>
</body>
</html>
