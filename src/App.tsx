import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  Coins, 
  Settings, 
  Wallet, 
  Database,
  ChevronRight,
  Hammer,
  Timer,
  Award,
  Sparkles
} from 'lucide-react';

import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { MiningVisualizer } from './components/ui/mining-visualizer';
import { StatsCard } from './components/ui/stats-card';
import './styles.css';

/* ---------- Type Definitions ---------- */
interface TelegramWebApp {
  WebApp?: {
    initDataUnsafe?: {
      user?: {
        id: number;
        first_name?: string;
        username?: string;
      };
    };
    ready: () => void;
    setBackgroundColor: (color: string) => void;
    setHeaderColor: (color: string) => void;
    HapticFeedback?: {
      impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
    };
  };
}

declare global {
  interface Window {
    Telegram?: TelegramWebApp;
  }
}

/* ---------- Supabase Client mit Custom Headers ---------- */
const createSupabaseClientWithAuth = (customToken?: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Please check your environment variables.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: customToken ? {
        'Authorization': `Bearer ${customToken}`
      } : {}
    }
  });
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '/api';

/* ---------- Preiskalkulation ---------- */
const PRICES = {
  stars: (lvl: number) => 50 + (lvl - 1) * 25,
  usdt:  (lvl: number) => 0.5 + (lvl - 1) * 0.25
};

/* ---------- Level Konfiguration ---------- */
const LEVEL_CONFIG = {
  1: { name: 'Rookie Miner', multiplier: 1, color: 'from-gray-400 to-gray-600' },
  2: { name: 'Bronze Digger', multiplier: 1.5, color: 'from-amber-600 to-orange-700' },
  3: { name: 'Silver Explorer', multiplier: 2, color: 'from-gray-300 to-gray-500' },
  4: { name: 'Gold Prospector', multiplier: 2.5, color: 'from-yellow-400 to-yellow-600' },
  5: { name: 'Platinum Master', multiplier: 3, color: 'from-blue-400 to-purple-600' },
  10: { name: 'Diamond Legend', multiplier: 5, color: 'from-cyan-400 to-blue-600' }
} as const;

/* ---------- Helper Functions ---------- */
const getTelegramId = (): number | null => {
  try {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    return typeof telegramId === 'number' ? telegramId : null;
  } catch (error) {
    console.warn('Failed to get Telegram ID:', error);
    return null;
  }
};

const isWebAppEnvironment = (): boolean => {
  return !!(window.Telegram?.WebApp);
};

export default function App() {
  /* ---------- React State ---------- */
  const [loading, setLoading] = useState(true);
  const [mining, setMining] = useState(false);
  const [earned, setEarned] = useState(0);
  const [balance, setBalance] = useState(0);
  const [level, setLevel] = useState<keyof typeof LEVEL_CONFIG>(1);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [customToken, setCustomToken] = useState<string>('');
  const [supabaseClient, setSupabaseClient] = useState(() => createSupabaseClientWithAuth());
  const [miningTime, setMiningTime] = useState(0);
  const [showStats, setShowStats] = useState(false);

  /* ---------- Telegram / TON ---------- */
  const telegramId = getTelegramId();
  const address = useTonAddress();
  const [tonUI] = useTonConnectUI();

  // Level-spezifische Konfiguration
  const currentLevelConfig = LEVEL_CONFIG[level] || 
    { name: 'Elite Miner', multiplier: level * 0.5, color: 'from-purple-400 to-pink-600' };

  // Debug helper
  const addDebug = (msg: string) => {
    console.log('[DEBUG]', msg);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  /* ---------- Telegram SDK Ready ---------- */
  useEffect(() => {
    if (isWebAppEnvironment()) {
      try {
        WebApp.ready();
        WebApp.setBackgroundColor('#0f0f23');
        WebApp.setHeaderColor('#0f0f23');
        addDebug(`Telegram WebApp initialized. User ID: ${telegramId || 'Not available'}`);
      } catch (error) {
        addDebug(`Telegram WebApp initialization failed: ${error}`);
      }
    } else {
      addDebug('Running in browser mode (not Telegram WebApp)');
    }
    
    // Validate environment
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setError('Missing Supabase configuration. Please check environment variables.');
      return;
    }
  }, [telegramId]);

  /* ---------- JWT Token holen und Supabase Client neu erstellen ---------- */
  useEffect(() => {
    const initializeAuth = async () => {
      // In development mode or when no Telegram ID is available, use standard client
      if (!telegramId) {
        if (import.meta.env.DEV) {
          addDebug('Development mode: Using standard Supabase client');
          setLoading(false);
          return;
        } else {
          setError('Telegram ID not available. Please open this app from Telegram.');
          setLoading(false);
          return;
        }
      }

      try {
        addDebug('Fetching JWT token...');
        const response = await fetch(`/api/jwt?tid=${telegramId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const token = await response.text();
        addDebug('JWT token received, creating authenticated Supabase client...');
        
        setCustomToken(token);
        
        // Create new Supabase client with custom token
        const newClient = createSupabaseClientWithAuth(token);
        setSupabaseClient(newClient);
        
        addDebug('Supabase client with custom authentication created');
      } catch (err: any) {
        addDebug(`Authentication error: ${err.message}`);
        setError(`Authentication failed: ${err.message}`);
        setLoading(false);
      }
    };

    initializeAuth();
  }, [telegramId]);

  /* ---------- Profil laden / anlegen ---------- */
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!supabaseClient || loading) return;

      const userId = telegramId?.toString() ?? 'dev-local';
      addDebug(`Loading profile for user: ${userId}`);

      try {
        // First, try to load existing user
        addDebug('Sending SELECT query...');
        const { data, error: selectError } = await supabaseClient
          .from('users')
          .select('dtx_balance, miner_level')
          .eq('telegram_id', userId)
          .single();

        if (selectError?.code === 'PGRST116') {
          // User doesn't exist - create new user
          addDebug('User not found, creating new user...');
          const { error: insertError } = await supabaseClient
            .from('users')
            .insert({ telegram_id: parseInt(userId, 10) || 0 });

          if (insertError) {
            throw new Error(`Insert error: ${insertError.message} (Code: ${insertError.code})`);
          }
          addDebug('New user created successfully');
          
          // Set default values for new user
          setBalance(0);
          setLevel(1);
        } else if (selectError) {
          throw new Error(`Select error: ${selectError.message} (Code: ${selectError.code})`);
        } else if (data) {
          addDebug(`Profile loaded: Balance=${data.dtx_balance}, Level=${data.miner_level}`);
          setBalance(data.dtx_balance ?? 0);
          setLevel((data.miner_level ?? 1) as keyof typeof LEVEL_CONFIG);
        }
      } catch (err: any) {
        addDebug(`Profile loading error: ${err.message}`);
        setError(`Database error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (supabaseClient && (telegramId || import.meta.env.DEV)) {
      loadUserProfile();
    }
  }, [supabaseClient, telegramId, loading]);

  /* ---------- Mining-Simulation und Timer ---------- */
  useEffect(() => {
    if (!mining) return;
    
    const interval = setInterval(() => {
      setEarned(e => e + level * currentLevelConfig.multiplier * 0.02);
      setMiningTime(t => t + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [mining, level, currentLevelConfig.multiplier]);

  /* ---------- Server-Methoden ---------- */
  const claim = async () => {
    const userId = telegramId?.toString() ?? 'dev-local';
    const newBalance = balance + earned;
    
    addDebug(`Claiming ${earned.toFixed(3)} DTX (new balance: ${newBalance.toFixed(2)})`);
    
    try {
      const { error } = await supabaseClient
        .from('users')
        .update({ dtx_balance: newBalance })
        .eq('telegram_id', userId);

      if (error) {
        throw new Error(`${error.message} (Code: ${error.code})`);
      }

      setBalance(newBalance);
      setEarned(0);
      setMiningTime(0);
      addDebug('Successfully claimed rewards!');
      
      // Haptic feedback if available
      try {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
        }
      } catch (hapticError) {
        // Ignore haptic feedback errors
      }
    } catch (err: any) {
      addDebug(`Claim error: ${err.message}`);
      setError(`Failed to save rewards: ${err.message}`);
    }
  };

  const upgradeUSDT = async () => {
    if (!address) { 
      tonUI.connectWallet(); 
      return; 
    }
    
    if (!telegramId) {
      setError('Telegram ID not available for upgrade');
      return;
    }
    
    try {
      addDebug('Initiating USDT upgrade...');
      const response = await fetch(`${BACKEND_URL}/upgrade-usdt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          telegramId: telegramId.toString(), 
          level: level + 1, 
          address 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const { payload } = await response.json();
      await tonUI.sendTransaction(payload);
      
      addDebug('Upgrade transaction sent successfully');
    } catch (err: any) {
      addDebug(`Upgrade error: ${err.message}`);
      setError(`Upgrade failed: ${err.message}`);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* ---------- Environment Checks ---------- */
  useEffect(() => {
    // Check if we're in a supported environment
    if (!import.meta.env.DEV && !isWebAppEnvironment()) {
      setError('This application must be opened from Telegram');
      return;
    }

    // Check for required environment variables
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
    
    if (missingVars.length > 0) {
      setError(`Missing environment variables: ${missingVars.join(', ')}`);
      return;
    }
  }, []);

  /* ---------- Ladeanzeige ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="relative mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 mx-auto"
            >
              <Hammer className="w-full h-full text-cyan-400" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
            >
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </motion.div>
          </div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-4"
          >
            DTX CloudMiner
          </motion.h1>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-cyan-300"
          >
            Initializing mining protocols...
          </motion.div>
        </motion.div>

        {debugInfo.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="w-full max-w-md mt-8 text-xs text-left bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-cyan-500/20"
          >
            <div className="font-semibold mb-2 text-cyan-300 flex items-center gap-2">
              <Database className="w-4 h-4" />
              System Status
            </div>
            {debugInfo.map((info, i) => (
              <div key={i} className="mb-1 text-gray-300 font-mono text-xs">{info}</div>
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  /* ---------- Haupt-UI ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative p-6 pb-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: mining ? 360 : 0 }}
              transition={{ duration: 2, repeat: mining ? Infinity : 0, ease: "linear" }}
              className="w-8 h-8"
            >
              <Hammer className="w-full h-full text-cyan-400" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold">DTX CloudMiner</h1>
              <div className="text-xs text-gray-400">
                {currentLevelConfig.name}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="p-2"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 overflow-hidden"
          >
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <StatsCard
                  icon={<Timer />}
                  label="Mining Time"
                  value={formatTime(miningTime)}
                />
                <StatsCard
                  icon={<TrendingUp />}
                  label="Hash Rate"
                  value={`${(level * currentLevelConfig.multiplier * 0.72).toFixed(2)} MH/s`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-6 mb-4"
          >
            <Card className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-red-400 text-sm font-medium">{error}</div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="mt-2 text-red-400 hover:text-red-300"
                  onClick={() => setError('')}
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="px-6 space-y-6">
        {/* Mining Visualizer */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <MiningVisualizer 
            mining={mining} 
            level={level}
            earned={earned}
            levelConfig={currentLevelConfig}
          />
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-black/30 backdrop-blur-sm border-cyan-500/20">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                {/* Balance Display */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-400 flex items-center justify-center gap-2">
                    <Coins className="w-4 h-4" />
                    Total Balance
                  </div>
                  <motion.div 
                    key={balance}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-4xl font-mono font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
                  >
                    {balance.toFixed(2)} DTX
                  </motion.div>
                </div>

                {/* Pending Earnings */}
                {earned > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30"
                  >
                    <div className="text-sm text-yellow-400 mb-1">Pending Mining Rewards</div>
                    <div className="text-2xl font-mono font-bold text-yellow-300">
                      +{earned.toFixed(3)} DTX
                    </div>
                    <div className="text-xs text-yellow-500/70 mt-1">
                      Rate: {(level * currentLevelConfig.multiplier * 0.02).toFixed(3)} DTX/s
                    </div>
                  </motion.div>
                )}

                {/* Level Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Level {level}</span>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span className={`font-semibold bg-gradient-to-r ${currentLevelConfig.color} bg-clip-text text-transparent`}>
                        {currentLevelConfig.multiplier}x Multiplier
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(earned % 1) * 100} 
                    className="h-2"
                    variant="mining"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {/* Main Mining Button */}
          <Button 
            onClick={mining ? claim : () => setMining(true)}
            disabled={mining && earned < 0.001}
            className="w-full py-4 text-lg font-bold relative overflow-hidden"
            variant={mining ? "success" : "primary"}
          >
            <motion.div
              className="flex items-center justify-center gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {mining ? (
                <>
                  <Zap className="w-6 h-6" />
                  {earned >= 0.001 ? 'Claim Rewards' : `Mining... (${earned.toFixed(3)} DTX)`}
                </>
              ) : (
                <>
                  <Hammer className="w-6 h-6" />
                  Start Mining
                </>
              )}
            </motion.div>
            
            {mining && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}
          </Button>

          {/* Upgrade Button */}
          <Button 
            onClick={upgradeUSDT} 
            variant="secondary"
            className="w-full py-3 font-semibold"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span>Upgrade to Level {level + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono">{PRICES.usdt(level + 1).toFixed(2)} USDT</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </Button>

          {/* Connect Wallet Button */}
          {!address && (
            <Button 
              onClick={() => tonUI.connectWallet()}
              variant="outline"
              className="w-full py-3 font-semibold"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect TON Wallet
            </Button>
          )}
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-2 pb-6"
        >
          <div className="text-xs text-gray-500 bg-black/20 backdrop-blur-sm rounded-lg p-3">
            <p className="mb-2">
              🚀 DTX token launches soon. Early miners get premium rewards!
            </p>
            {telegramId && (
              <p className="font-mono text-cyan-400">
                ID: {telegramId}
              </p>
            )}
            {address && (
              <p className="font-mono text-green-400 text-xs break-all">
                Wallet: {address.slice(0, 4)}...{address.slice(-4)}
              </p>
            )}
          </div>
          
          <div className="text-xs text-gray-600">
            @DTX_MINER_BOT
          </div>
        </motion.div>

        {/* Development Debug Panel */}
        {(import.meta.env.DEV && debugInfo.length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-6"
          >
            <Card className="bg-black/40 backdrop-blur-sm border-gray-700">
              <CardContent className="p-4">
                <div className="text-xs text-gray-400">
                  <div className="font-semibold mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Debug Console
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-xs px-2 py-1 h-auto"
                      onClick={() => setDebugInfo([])}
                    >
                      Clear
                    </Button>
                  </div>
                  
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {debugInfo.map((info, i) => (
                      <div key={i} className="text-xs p-2 bg-gray-900/50 rounded border border-gray-700 font-mono">
                        {info}
                      </div>
                    ))}
                  </div>
                  
                  {customToken && (
                    <div className="mt-3 p-2 bg-green-900/30 rounded text-xs border border-green-700">
                      <div className="font-medium text-green-400">✅ JWT Authentication Active</div>
                      <div className="text-green-500 font-mono break-all">
                        {customToken.substring(0, 40)}...
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
