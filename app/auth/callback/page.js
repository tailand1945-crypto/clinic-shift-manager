'use client';

import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    if (supabase) {
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          window.location.href = '/';
        }
      });
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1B2A4A 0%, #263B5E 50%, #1E3250 100%)',
      fontFamily: "'Outfit', 'Noto Sans JP', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>ログイン処理中...</div>
        <div style={{ fontSize: 14, opacity: 0.6 }}>しばらくお待ちください</div>
      </div>
    </div>
  );
}
