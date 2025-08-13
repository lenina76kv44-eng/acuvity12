import React, { memo } from 'react';
import './bubbles.css';

const BubbleBackground: React.FC<{count?: number, className?: string}> = ({count=28, className}) => {
  return (
    <div className={`bubble-layer ${className??''}`} aria-hidden>
      {Array.from({length: count}).map((_, i) => (
        <span key={i} className="bubble" style={{
          // randomized but deterministic per index
          left: `${(i*127)%100}%`,
          animationDelay: `${(i*173)%160/10}s`,
          animationDuration: `${18 + (i*97)%22}s`,
          width: `${14 + (i*53)%26}px`,
          height: `${14 + (i*53)%26}px`,
          filter: `blur(${(i%5)}px)`
        }} />
      ))}
    </div>
  );
};
export default memo(BubbleBackground);