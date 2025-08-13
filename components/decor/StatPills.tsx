import React from 'react';
export type Pill = {label:string, value:string, icon?:React.ReactNode};

export default function StatPills({items}:{items:Pill[]}) {
  return (
    <div style={{display:'flex', flexWrap:'wrap', gap:12, margin:'10px 0 16px'}}>
      {items.map((p,i)=>(
        <div key={i} className="glass" style={{
          display:'inline-flex', alignItems:'center', gap:8, padding:'8px 12px',
          borderRadius:999, border:'1px solid rgba(255,255,255,.06)'
        }}>
          {p.icon}
          <span className="subtle" style={{fontSize:12}}>{p.label}</span>
          <strong style={{fontSize:12, color:'var(--brand)'}}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}