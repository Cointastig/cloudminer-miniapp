import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';                     // 🆕 v8‑Import
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { createClient } from '@supabase/supabase-js';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

/* ---------- Supabase‑Client ---------- */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '/api';

/* Preise für Upgrades */
const PRICES = {
  stars: (lvl: number) => 50 + lvl * 25,              // Level 1 = 75 Stars
  usdt : (lvl: number) => 0.5 + lvl * 0.25            // Level 1 = 0.75 USDT
};

export default function App() {
  /* ---------- State ---------- */
  const [loading,  setLoading]  = useState(true);
  const [mining,   setMining]   = useState(false);
  const [earned,   setEarned]   = useState(0);
  const [balance,  setBalance]  = useState(0);
  const [level,    setLevel]    = useState(1);

  const telegramId = window.Telegram.WebApp.initDataUnsafe?.user?.id;
  const address    = useTonAddress();
  const tonUI      = useTonConnectUI();

  /* ---------- Telegram SDK ready() ---------- */
  useEffect(() => {
    WebApp.ready();                                   // ersetzt initWebApp()
  }, []);

  /* ---------- Profil laden / anlegen ---------- */
  useEffect(() => {
    if (!telegramId) return;

    (async () => {
      const { data, error } = await supabase
        .from('users')
        .select('dtx_balance, miner_level')
        .eq('telegram_id', telegramId)
        .single();

      if (error?.code === 'PGRST116') {
        await supabase.from('users').insert({ telegram_id: telegramId });
      } else if (data) {
        setBalance(data.dtx_balance ?? 0);
        setLevel  (data.miner_level ?? 1);
      }
      setLoading(false);
    })();
  }, [telegramId]);

  /* ---------- Mining‑Simulation ---------- */
  useEffect(() => {
    if (!mining) return;
    const id = setInterval(() => setEarned(e => e + level * 0.02), 1000);
    return () => clearInterval(id);
  }, [mining, level]);

  /* ---------- Aktionen ---------- */
  const claim = async () => {
    const newBal = balance + earned;
    setBalance(newBal);
    setEarned(0);
    await supabase
      .from('users')
      .update({ dtx_balance: newBal })
      .eq('telegram_id', telegramId);
  };

  const upgradeUSDT = async () => {
    if (!address) { tonUI.connectWallet(); return; }
    const res = await fetch(`${BACKEND_URL}/upgrade-usdt`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ telegramId, level: level + 1, address })
    });
    const { payload } = await res.json();
    await tonUI.sendTransaction(payload);
  };

  /* ---------- UI ---------- */
  if (loading) return <div className="p-6 text-center">Lade …</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-fuchsia-100 p-4 gap-4">
      <motion.h1 initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                 className="text-4xl font-extrabold">
        DTX CloudMiner
      </motion.h1>

      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-4">

          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Level {level}</h2>
            <Progress value={(earned % 1) * 100} />
          </div>

          <div className="text-xl font-mono">Saldo {balance.toFixed(2)} DTX</div>
          <div className="text-sm text-gray-500">
            Ungesichert {earned.toFixed(3)} DTX
          </div>

          <Button onClick={mining ? claim : () => setMining(true)}>
            {mining ? 'Erträge sichern' : 'Mining starten'}
          </Button>

          <Button onClick={upgradeUSDT} variant="secondary">
            +1 Level ({PRICES.usdt(level).toFixed(2)} USDT)
          </Button>

          <p className="text-xs text-center text-gray-400">
            Auszahlungen sind verfügbar, sobald DTX offiziell gemintet wurde.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
