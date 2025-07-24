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
    const tid = telegramId ?? 'dev-local';
    
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
      <div className="p-6 text-center">
        <div>Lade...</div>
        {debugInfo.length > 0 && (
          <div className="mt-4 text-xs text-left bg-gray-100 p-2 rounded">
            {debugInfo.map((info, i) => <div key={i}>{info}</div>)}
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
        className="text-4xl font-extrabold"
      >
        DTX CloudMiner
      </motion.h1>

      {error && (
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent>
            <div className="text-red-600 text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Level {level}</h2>
            <Progress value={(earned % 1) * 100} />
          </div>

          <div className="text-xl font-mono">Saldo {balance.toFixed(2)} DTX</div>
          <div className="text-sm text-gray-500">
            Ungesichert {earned.toFixed(3)} DTX
          </div>

          <Button onClick={mining ? claim : () => setMining(true)}>
            {mining ? 'Erträge sichern' : 'Mining starten'}
          </Button>

          <Button onClick={upgradeUSDT} variant="secondary">
            +1 Level ({PRICES.usdt(level).toFixed(2)} USDT)
          </Button>

          <p className="text-xs text-center text-gray-400">
            Auszahlungen sind verfügbar, sobald DTX offiziell gemintet wurde.
          </p>
        </CardContent>
      </Card>

      {/* Debug Panel */}
      {debugInfo.length > 0 && (
        <Card className="w-full max-w-md">
          <CardContent>
            <div className="text-xs text-gray-600">
              <div className="font-semibold mb-2">Debug Info:</div>
              {debugInfo.map((info, i) => (
                <div key={i} className="mb-1">{info}</div>
              ))}
              {customToken && (
                <div className="mt-2 p-2 bg-green-100 rounded">
                  ✅ Custom Token gesetzt: {customToken.substring(0, 20)}...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
