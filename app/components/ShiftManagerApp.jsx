<div style={{ display:"flex", gap:0, marginBottom:8, borderBottom:`1px solid ${T.border}` }}>
        {["受信","送信済み"].map((l,i) => <button key={i} onClick={()=>setTab(i)} style={{ padding:"10px 20px", border:"none", background:"none", cursor:"pointer", borderBottom:tab===i?`3px solid ${T.blue}`:"3px solid transparent", color:tab===i?T.text:T.textDim, fontSize:13, fontWeight:tab===i?700:500, fontFamily:FONT }}>{l}</button>)}
      </div>
      {displayed.some(s=>s.status==='approved'||s.status==='rejected') && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
          <button onClick={async()=>{
            if(!window.confirm('承認済み・却下済みのシフト交換記録を一括削除しますか？')) return;
            const ids = displayed.filter(s=>s.status==='approved'||s.status==='rejected').map(s=>s.id);
            try {
              if(isSupabaseConfigured()) await supabase.from('shift_exchanges').delete().in('id', ids);
              setSwaps(p=>p.filter(s=>!ids.includes(s.id)));
              toast('一括削除しました','success');
            } catch(e){ toast('削除に失敗しました','error'); }
          }} style={{ padding:"7px 16px", fontSize:12, fontWeight:600, color:T.coral, background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, cursor:"pointer", fontFamily:FONT }}>
            🗑️ 承認済み・却下を一括削除
          </button>
        </div>
      )}
      {tab===0 && isSwapManager && incoming.length > 0 && (
```

---

### GitHubでの適用手順

1. https://github.com/tailand1945-crypto/clinic-shift-manager の `app/components/ShiftManagerApp.jsx` を開く
2. ✏️ 編集ボタンをクリック
3. **Ctrl+F**（Find）で以下を検索：
```
   {tab===0 && isSwapManager && incoming.length > 0 && (
```
4. その**直上**に上記の一括削除ボタンコードを挿入
5. コミットメッセージ：
```
   feat: シフト交換に承認済み・却下を一括削除ボタンを追加
