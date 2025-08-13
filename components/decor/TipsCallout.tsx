import React from 'react';
import GlowCard from './GlowCard';

export default function TipsCallout({title,items}:{
  title:string, items:string[]
}){
  return (
    <GlowCard>
      <div style={{padding:16}}>
        <strong className="accent">{title}</strong>
        <ul style={{marginTop:10, display:'grid', gap:6}}>
          {items.map((t,i)=>(
            <li key={i} className="subtle" style={{fontSize:13}}>• {t}</li>
          ))}
        </ul>
      </div>
    </GlowCard>
  );
}