'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session && session.user) {
          setSessionReady(true);
          const name = session.user.user_metadata && session.user.user_metadata.staff_name;
          if (name) setStaffName(name);
        }
      }
    );
    supabase.auth.getSession().then(function(res) {
      var session = res.data.session;
      if (session && session.user) {
        setSessionReady(true);
        var name = session.user.user_metadata && session.user.user_metadata.staff_name;
        if (name) setStaffName(name);
      }
    });
    return function() { subscription.unsubscribe(); };
  }, []);

  function getStrength(pw) {
    var score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  var strength = getStrength(password);
  var strengthLabel = ['', '弱い', '普通', 'まあ良い', '良い', '強い'][strength] || '';
  var strengthColor = ['#e5e7eb', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'][strength] || '#e5e7eb';
  var strengthPct = [0, 20, 40, 60, 80, 100][strength] || 0;

  async function handleSetPassword(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください');
      return;
    }
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    if (strength < 2) {
      setError('もう少し複雑なパスワードにしてください（英数字混合を推奨）');
      return;
    }
    setLoading(true);
    try {
      var updateRes = await supabase.auth.updateUser({ password: password });
      if (updateRes.error) throw updateRes.error;
      var userRes = await supabase.auth.getUser();
      var user = userRes.data.user;
      if (user) {
        await supabase.from('staff_profiles').update({ invite_status: 'accepted' }).eq('auth_user_id', user.id);
      }
      setSuccess(true);
      setTimeout(function() { router.push('/'); }, 3000);
    } catch (err) {
      setError(err.message || 'パスワードの設定に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#eff6ff,#f0fdf4)', fontFamily:'sans-serif' }}>
        <div style={{ background:'#fff', borderRadius:20, padding:'40px 36px', width:'100%', maxWidth:420, boxShadow:'0 8px 40px rgba(0,0,0,0.10)', textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
          <h2 style={{ fontSize:22, fontWeight:'bold', color:'#1e3a5f', margin:'0 0 8px' }}>設定完了！</h2>
          <p style={{ fontSize:14, color:'#64748b' }}>パスワードを設定しました。<br />まもなくアプリへ移動します…</p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#eff6ff,#f0fdf4)', fontFamily:'sans-serif' }}>
        <div style={{ background:'#fff', borderRadius:20, padding:'40px 36px', width:'100%', maxWidth:420, boxShadow:'0 8px 40px rgba(0,0,0,0.10)', textAlign:'center' }}>
          <p style={{ fontSize:14, color:'#64748b' }}>招待リンクを確認中…</p>
          <p style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>招待メールのリンクから直接アクセスしてください</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#eff6ff,#f0fdf4)', padding:20, fontFamily:'sans-serif' }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'40px 36px', width:'100%', maxWidth:420, boxShadow:'0 8px 40px rgba(0,0,0,0.10)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🏥</div>
          <h1 style={{ fontSize:18, fontWeight:'bold', color:'#1e3a5f', margin:'0 0 6px' }}>クリニック シフト管理</h1>
          <p style={{ fontSize:14, color:'#64748b' }}>{staffName ? staffName + 'さん、' : ''}パスワードを設定してください</p>
        </div>
        <form onSubmit={handleSetPassword}>
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>新しいパスワード</label>
            <div style={{ position:'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={function(e) { setPassword(e.target.value); }}
                placeholder="8文字以上（英数字混合推奨）"
                required
                style={{ width:'100%', padding:'11px 44px 11px 12px', border:'1.5px solid #d1d5db', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box' }}
                autoFocus
              />
              <button type="button" onClick={function() { setShowPassword(!showPassword); }} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16 }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {password && (
              <div style={{ marginTop:6 }}>
                <div style={{ height:5, backgroundColor:'#e5e7eb', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:strengthPct+'%', backgroundColor:strengthColor, borderRadius:3, transition:'width 0.4s' }} />
                </div>
                <p style={{ fontSize:11, color:strengthColor, margin:'3px 0 0', fontWeight:600 }}>強度：{strengthLabel}</p>
              </div>
            )}
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>パスワード（確認）</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={function(e) { setConfirmPassword(e.target.value); }}
              placeholder="もう一度入力"
              required
              style={{ width:'100%', padding:'11px 12px', border:'1.5px solid ' + (confirmPassword && confirmPassword !== password ? '#ef4444' : '#d1d5db'), borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box' }}
            />
            {confirmPassword && confirmPassword !== password && (
              <p style={{ fontSize:12, color:'#ef4444', margin:'4px 0 0' }}>パスワードが一致しません</p>
            )}
          </div>
          {error && (
            <div style={{ backgroundColor:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:14 }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ width:'100%', padding:13, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:loading ? 'not-allowed' : 'pointer', opacity:loading ? 0.7 : 1 }}
          >
            {loading ? '設定中…' : '✅ パスワードを設定してログイン'}
          </button>
        </form>
        <p style={{ fontSize:12, color:'#9ca3af', textAlign:'center', marginTop:20 }}>ご不明な点は管理者にお問い合わせください</p>
      </div>
    </div>
  );
}
