import React from 'react';
import GlowCard from './GlowCard';

export default function HowItWorks({steps}:{steps:{n:number,title:string,desc:string}[]}) {
  return (
    <GlowCard className="howitworks" >
      <ol style={{display:'grid', gap:10, gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', padding:16}}>
        {steps.map(s=>(
          <li key={s.n} className="glass" style={{padding:'14px 16px', borderRadius:14, border:'1px solid rgba(255,255,255,.06)'}}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <span style={{width:28, height:28, borderRadius:14, background:'rgba(0,243,110,.14)', color:'var(--brand)', display:'grid', placeItems:'center', fontWeight:800}}>{s.n}</span>
              <strong>{s.title}</strong>
            </div>
            <p className="subtle" style={{marginTop:8, fontSize:13}}>{s.desc}</p>
          </li>
        ))}
      </ol>
    </GlowCard>
  );
}