import React from 'react';
import { motion } from 'framer-motion';

export default function ToolShell({
  icon, title, subtitle, right, children
}:{
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;   // optional decorative element
  children: React.ReactNode;
}){
  return (
    <section style={{position:'relative', zIndex:1, margin:'40px auto', maxWidth:1160, padding:'0 20px'}}>
      <header style={{display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center', marginBottom:20}}>
        <div>
          <motion.h1 className="section-title" initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:.35}}>
            <span style={{color:'var(--txt-0)'}}>{title.split(' ')[0]} </span>
            <span className="accent">{title.split(' ').slice(1).join(' ')}</span>
          </motion.h1>
          {subtitle && <p className="subtle" style={{marginTop:8, maxWidth:760}}>{subtitle}</p>}
        </div>
        {right && <div style={{opacity:.95}}>{right}</div>}
      </header>
      {children}
    </section>
  );
}