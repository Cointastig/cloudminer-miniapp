import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  TrendingUp,
  Coins,
  Wallet,
  Database,
  ChevronRight,
  Hammer,
  Timer,
  Award,
  Sparkles,
  Activity,
  HardDrive,
  Fan,
  Server
} from 'lucide-react';

import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { MiningVisualizer } from './components/ui/mining-visualizer';
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

/* ---------- Supabase Client with Custom Headers ---------- */
const createSupabaseClientWithAuth = (customToken?: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Please check your environment variables.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: customToken
        ? {
            Authorization: `Bearer ${customToken}`
          }
        : {}
    }
  });
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '/api';

/* ---------- Pricing Calculation ---------- */
const PRICES = {
  stars: (lvl: number) => 50 + (lvl - 1) * 25,
  usdt: (lvl: number) => 0.5 + (lvl - 1) * 0.25
};

/* ---------- Level Configuration ---------- */
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
  return !!window.Telegram?.WebApp;
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

  // Level-specific configuration
  const currentLevelConfig = LEVEL_CONFIG[level] || { name: 'Elite Miner', multiplier: level * 0.5, color: 'from-purple-400 to-pink-600' };

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

  /* ---------- Fetch JWT Token and Create Supabase Client ---------- */
  useEffect(() => {
    const initializeAuth = async () => {
      // In development or when no Telegram ID, use standard client
      if (!telegramId) {
        if (import.meta.env.DEV) {
          addDebug('Development mode: Using standard Supabase client');
          setLoading(false);
          return;
        } else {
          setError('Telegram ID not available. Please open this app from Telegram.');
          return;
        }
      }

      try {
        addDebug('Fetching JWT token...');
        const response = await fetch(`${BACKEND_URL}/jwt?tid=${telegramId}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const token = await response.text();
        addDebug('JWT token received, creating authenticated Supabase client...');
        setCustomToken(token);
        const newClient = createSupabaseClientWithAuth(token);
        setSupabaseClient(newClient);
        addDebug('Supabase client with custom authentication created');
        setLoading(false);
      } catch (error: any) {
        addDebug(`Authentication error: ${error.message || error}`);
        setError(`Authentication error: ${error.message || error}`);
        setLoading(false);
      }
    };
    initializeAuth();
  }, [telegramId]);

  /* ---------- Load User Profile ---------- */
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!supabaseClient || loading) return;
      if (!telegramId) return;
      try {
        addDebug(`Loading profile for user: ${telegramId}`);
        const { data, error: supabaseError } = await supabaseClient
          .from('users')
          .select('balance, level')
          .eq('telegram_id', telegramId)
          .single();
        if (supabaseError) throw supabaseError;
        if (data) {
          setBalance(data.balance ?? 0);
          setLevel(data.level ?? 1);
          addDebug(`Profile loaded: Balance=${data.balance}, Level=${data.level}`);
        }
      } catch (error: any) {
        addDebug(`Profile load error: ${error.message || error}`);
        setError(`Failed to load profile: ${error.message || error}`);
      }
    };
    loadUserProfile();
  }, [supabaseClient, telegramId, loading]);

  /* ---------- Mining Timer ---------- */
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (mining) {
      const startTime = Date.now() - miningTime;
      interval = setInterval(() => {
        setMiningTime(Date.now() - startTime);
        setEarned((prev) => prev + currentLevelConfig.multiplier * 0.02);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mining, level, currentLevelConfig.multiplier]);

  /* ---------- Claim Rewards ---------- */
  const claim = async () => {
    if (!supabaseClient || earned <= 0) return;
    try {
      const newBalance = balance + earned;
      setBalance(newBalance);
      setEarned(0);
      setMining(false);
      setMiningTime(0);
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ balance: newBalance })
        .eq('telegram_id', telegramId);
      if (updateError) throw updateError;
      addDebug(`Rewards claimed. New balance: ${newBalance}`);
    } catch (err: any) {
      addDebug(`Claim error: ${err.message || err}`);
      setError(`Failed to claim rewards: ${err.message || err}`);
    }
  };

  /* ---------- Upgrade Level ---------- */
  const upgradeUSDT = async () => {
    try {
      const targetLevel = level + 1;
      const response = await fetch(`${BACKEND_URL}/upgrade-usdt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ telegramId: telegramId?.toString(), level: targetLevel, address })
      });
      const result = await response.json();
      if (result.success) {
        addDebug(`Upgrade to level ${targetLevel} prepared.`);
        // tonUI.sendTransaction
        await tonUI.sendTransaction(result.payload);
      } else {
        throw new Error(result.message || 'Upgrade failed');
      }
    } catch (err: any) {
      addDebug(`Upgrade error: ${err.message || err}`);
      setError(`Upgrade error: ${err.message || err}`);
    }
  };

  /* ---------- Render ---------- */
  // Show loading/initializing screen
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
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
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
              <div key={i} className="mb-1 text-gray-300 font-mono text-xs">
                {info}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  // Main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Hero Section with Icons and Progress */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="px-6 pt-8 text-center space-y-4"
      >
        {/* Larger headline and subtitle for a more premium look */}
        <h1 className="text-4xl font-extrabold holographic tracking-tight">DTX CloudMiner</h1>
        <p className="text-base text-gray-400">Your personal mining dashboard</p>
        <div className="text-sm text-gray-500 font-medium">{currentLevelConfig.name}</div>
        {/* Neon icon trio with larger icons */}
        <div className="flex justify-center items-center gap-10 mt-6">
          <div className="text-6xl bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent flex items-center justify-center">
            <Fan className="w-10 h-10" />
          </div>
          <div className="text-6xl bg-gradient-to-r from-pink-400 to-yellow-500 bg-clip-text text-transparent flex items-center justify-center">
            <Server className="w-10 h-10" />
          </div>
          <div className="text-6xl bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent flex items-center justify-center">
            <Hammer className="w-10 h-10" />
          </div>
        </div>
        {/* Mining progress bar: thicker for better visibility */}
        <div className="mt-8">
          <Progress value={(earned % 1) * 100} variant="mining" className="h-3 rounded-full" />
        </div>
      </motion.div>
      {/* Stats Row */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-6 mt-6"
      >
        <div className="grid grid-cols-3 gap-4">
          {/* Mining Speed Card */}
          <Card className="bg-black/30 backdrop-blur-sm border-cyan-500/20">
            <CardContent className="p-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                <Activity className="w-4 h-4 text-cyan-400" />
                Mining Speed
              </div>
              <div className="text-lg font-mono font-bold">
                {(level * currentLevelConfig.multiplier * 0.72).toFixed(1)} MH/s
              </div>
            </CardContent>
          </Card>
          {/* Energy Usage Card */}
          <Card className="bg-black/30 backdrop-blur-sm border-yellow-500/20">
            <CardContent className="p-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                <Zap className="w-4 h-4 text-yellow-400" />
                Energy Usage
              </div>
              <div className="text-lg font-mono font-bold">
                {mining ? `${(level * 45).toFixed(0)}W` : '0W'}
              </div>
            </CardContent>
          </Card>
          {/* Temperature Card */}
          <Card className="bg-black/30 backdrop-blur-sm border-red-500/20">
            <CardContent className="p-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                <HardDrive className="w-4 h-4 text-red-400" />
                Temperature
              </div>
              <div className="text-lg font-mono font-bold">
                {mining ? `${(65 + level * 2).toFixed(0)}°C` : '25°C'}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
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
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
          <MiningVisualizer mining={mining} level={level} earned={earned} levelConfig={currentLevelConfig} />
        </motion.div>
        {/* Balance Card */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}>
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
                    <div className="text-2xl font-mono font-bold text-yellow-300">+{earned.toFixed(3)} DTX</div>
                    <div className="text-xs text-yellow-500/70 mt-1">Rate: {(level * currentLevelConfig.multiplier * 0.02).toFixed(3)} DTX/s</div>
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
                  <Progress value={(earned % 1) * 100} className="h-2" variant="mining" />
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
            variant={mining ? 'success' : 'primary'}
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
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </Button>
          {/* Upgrade Button */}
          <Button onClick={upgradeUSDT} variant="secondary" className="w-full py-3 font-semibold">
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
            <Button onClick={() => tonUI.connectWallet()} variant="outline" className="w-full py-3 font-semibold">
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
            <p className="mb-2">DTX token launches soon. Early miners get premium rewards!</p>
            {telegramId && <p className="font-mono text-cyan-400">ID: {telegramId}</p>}
            {address && <p className="font-mono text-green-400 text-xs break-all">Wallet: {address.slice(0, 4)}...{address.slice(-4)}</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
