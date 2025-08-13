import { motion } from 'framer-motion';
import React from 'react';

export default function GlowCard(
  {children, className=''}:
  {children: React.ReactNode, className?: string}
){
  return (
    <motion.div
      initial={{opacity:0, y:12}}
      animate={{opacity:1, y:0}}
      transition={{duration:.35, ease:'easeOut'}}
      className={`glass ringed ${className}`}
      style={{position:'relative'}}
    >
      {/* soft gradient edge */}
      <div aria-hidden style={{
        position:'absolute', inset:-1, borderRadius:18, pointerEvents:'none',
        background:'radial-gradient(600px 180px at 20% -20%, rgba(0,243,110,.08), transparent 60%)'
      }}/>
      <div style={{position:'relative', zIndex:1}}>{children}</div>
    </motion.div>
  );
}