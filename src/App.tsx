import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/* ---------- Supabase Client mit Custom Headers ---------- */
const createSupabaseClientWithAuth = (customToken?: string) => {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: customToken ? {
          'Authorization': `Bearer ${customToken}`
        } : {}
      }
    }
  );
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '/api';

/* ---------- Preiskalkulation ---------- */
const PRICES = {
  stars: (lvl: number) => 50 + lvl * 25,
  usdt:  (lvl: number) => 0.5 + lvl * 0.25
};

export default function App() {
  /* ---------- React State ---------- */
  const [loading,         setLoading]         = useState(true);
  const [mining,          setMining]          = useState(false);
  const [earned,          setEarned]          = useState(0);
  const [balance,         setBalance]         = useState(0);
  const [level,           setLevel]           = useState(1);
  const [debugInfo,       setDebugInfo]       = useState<string[]>([]);
  const [error,           setError]           = useState<string>('');
  const [customToken,     setCustomToken]     = useState<string>('');
  const [supabaseClient,  setSupabaseClient]  = useState(createSupabaseClientWithAuth());

  /* ---------- Telegram / TON ---------- */
  const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  const address    = useTonAddress();
  const [tonUI]    = useTonConnectUI();

  // Debug helper
  const addDebug = (msg: string) => {
    console.log('[DEBUG]', msg);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  /* ---------- Telegram SDK Ready ---------- */
  useEffect(() => {
    WebApp.ready();
    addDebug(`Telegram ID: ${telegramId || 'Nicht verfügbar (lokal)'}`);
  }, []);

  /* ---------- JWT Token holen und Supabase Client neu erstellen ---------- */
  useEffect(() => {
    if (!telegramId) {
      addDebug('Kein Telegram ID - verwende Standard-Client');
      return;
    }

    addDebug('Hole JWT Token...');
    fetch(`/api/jwt?tid=${telegramId}`)
      .then(async r => {
        if (!r.ok) {
          const errorText = await r.text();
          throw new Error(`HTTP ${r.status}: ${errorText}`);
        }
        return r.text();
      })
      .then(token => {
        addDebug('JWT Token erhalten, erstelle neuen Supabase Client...');
        setCustomToken(token);
        
        // Neuen Supabase Client mit Custom Token erstellen
        const newClient = createSupabaseClientWithAuth(token);
        setSupabaseClient(newClient);
        
        addDebug('Supabase Client mit Custom Auth erstellt');
      })
      .catch(err => {
        addDebug(`JWT Fehler: ${err.message}`);
        setError(`Auth-Fehler: ${err.message}`);
      });
  }, [telegramId]);

  /* ---------- Profil laden / anlegen ---------- */
  useEffect(() => {
    if (!supabaseClient) return;

    const tid = telegramId ?? 'dev-local';
    addDebug(`Lade Profil für: ${tid}`);

    (async () => {
      try {
        // Erst versuchen zu laden
        addDebug('Sende SELECT Query...');
        const { data, error: selectError } = await supabaseClient
          .from('users')
          .select('dtx_balance, miner_level')
          .eq('telegram_id', tid)
          .single();

        if (selectError?.code === 'PGRST116') {
          // User existiert nicht - erstellen
          addDebug('User nicht gefunden, erstelle neuen...');
          const { error: insertError } = await supabaseClient
            .from('users')
            .insert({ telegram_id: tid });

          if (insertError) {
            throw new Error(`Insert-Fehler: ${insertError.message} (Code: ${insertError.code})`);
          }
          addDebug('Neuer User erstellt');
        } else if (selectError) {
          throw new Error(`Select-Fehler: ${selectError.message} (Code: ${selectError.code})`);
        } else if (data) {
          addDebug(`Profil geladen: Balance=${data.dtx_balance}, Level=${data.miner_level}`);
          setBalance(data.dtx_balance ?? 0);
          setLevel(data.miner_level ?? 1);
        }
      } catch (err: any) {
        addDebug(`Profil-Fehler: ${err.message}`);
        setError(`Datenbank-Fehler: ${err.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [supabaseClient, telegramId]);

  /* ---------- Mining-Simulation ---------- */
  useEffect(() => {
    if (!mining) return;
    const id = setInterval(() => setEarned(e => e + level * 0.02), 1000);
    return () => clearInterval(id);
  }, [mining, level]);

  /* ---------- Server-Methoden ---------- */
  const claim = async () => {
    const tid = telegramId ?? 'dev-local';
    const newBal = balance + earned;
    
    addDebug(`Sichere ${earned.toFixed(3)} DTX (neue Balance: ${newBal.toFixed(2)})`);
    
    try {
      const { error } = await supabaseClient
        .from('users')
        .update({ dtx_balance: newBal })
        .eq('telegram_id', tid);

      if (error) {
        throw new Error(`${error.message} (Code: ${error.code})`);
      }

      setBalance(newBal);
      setEarned(0);
      addDebug('Erfolgreich gesichert!');
    } catch (err: any) {
      addDebug(`Claim-Fehler: ${err.message}`);
      setError(`Speicher-Fehler: ${err.message}`);
    }
  };

  const upgradeUSDT = async () => {
    if (!address) { 
      tonUI.connectWallet(); 
      return; 
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/upgrade-usdt`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ telegramId, level: level + 1, address })
      });
      const { payload } = await res.json();
      await tonUI.sendTransaction(payload);
    } catch (err: any) {
      addDebug(`Upgrade-Fehler: ${err.message}`);
      setError(`Upgrade-Fehler: ${err.message}`);
    }
  };

  /* ---------- Ladeanzeige ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-fuchsia-100 p-6">
        <div className="text-lg mb-4">Lade...</div>
        {debugInfo.length > 0 && (
          <div className="w-full max-w-md mt-4 text-xs text-left bg-gray-100 p-3 rounded-lg">
            <div className="font-semibold mb-2">Debug Info:</div>
            {debugInfo.map((info, i) => (
              <div key={i} className="mb-1">{info}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-fuchsia-100 p-4 gap-4">
      <motion.h1 
        initial={{ y: -40, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
      >
        DTX CloudMiner
      </motion.h1>

      {/* Error-Anzeige */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="w-full max-w-md border-red-200 bg-red-50">
            <CardContent>
              <div className="text-red-600 text-sm font-medium">{error}</div>
              <Button 
                variant="outline" 
                className="mt-2 text-xs"
                onClick={() => setError('')}
              >
                Schließen
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Haupt-Mining-Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="flex flex-col gap-4">
            
            {/* Level und Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Level {level}</h2>
                <div className="text-sm text-gray-500">
                  {mining ? '⚡ Mining aktiv' : '💤 Bereit'}
                </div>
              </div>
              <Progress value={(earned % 1) * 100} className="h-2" />
              <div className="text-xs text-gray-400 text-center">
                Mining Rate: {(level * 0.02).toFixed(3)} DTX/s
              </div>
            </div>

            {/* Balance-Anzeige */}
            <div className="text-center space-y-1">
              <div className="text-2xl font-mono font-bold text-indigo-600">
                {balance.toFixed(2)} DTX
              </div>
              <div className="text-sm text-gray-500">
                Ungesichert: <span className="font-medium text-orange-600">
                  {earned.toFixed(3)} DTX
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={mining ? claim : () => setMining(true)}
                className="w-full py-3 text-lg font-semibold"
                disabled={mining && earned < 0.001}
              >
                {mining ? (
                  earned >= 0.001 ? 'Erträge sichern' : `Warte... (${earned.toFixed(3)} DTX)`
                ) : (
                  'Mining starten'
                )}
              </Button>

              <Button 
                onClick={upgradeUSDT} 
                variant="secondary"
                className="w-full"
              >
                🚀 Level upgrade ({PRICES.usdt(level).toFixed(2)} USDT)
              </Button>
            </div>

            {/* Info-Text */}
            <div className="text-xs text-center text-gray-400 bg-gray-50 p-3 rounded-lg">
              <p>
                💡 Auszahlungen sind verfügbar, sobald DTX offiziell gemintet wurde.
              </p>
              {telegramId && (
                <p className="mt-1">
                  👤 Telegram ID: {telegramId}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Debug Panel - nur in Development */}
      {(import.meta.env.DEV && debugInfo.length > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="w-full max-w-md bg-gray-50 border-gray-200">
            <CardContent>
              <div className="text-xs text-gray-600">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  🔧 Debug Info
                  <Button 
                    variant="outline" 
                    className="text-xs px-2 py-1 h-auto"
                    onClick={() => setDebugInfo([])}
                  >
                    Clear
                  </Button>
                </div>
                
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {debugInfo.map((info, i) => (
                    <div key={i} className="text-xs p-1 bg-white rounded border">
                      {info}
                    </div>
                  ))}
                </div>
                
                {customToken && (
                  <div className="mt-3 p-2 bg-green-100 rounded text-xs">
                    <div className="font-medium text-green-800">✅ JWT Token aktiv</div>
                    <div className="text-green-600 font-mono">
                      {customToken.substring(0, 30)}...
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-400 text-center mt-4">
        <p>DTX CloudMiner v1.0 | Powered by Supabase & TON</p>
      </div>
    </div>
  );
}
