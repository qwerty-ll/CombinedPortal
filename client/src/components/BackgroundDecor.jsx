import React from 'react';
import { motion } from 'framer-motion';

const BackgroundDecor = () => (
  <div className="bg-decorations" style={{ pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
    {/* Subtle ambient floating icons only - no text overlays */}
    <motion.div 
      className="decor-item floating-icon" 
      style={{ position: 'absolute', top: '12%', right: '5%', fontSize: '28px', opacity: 0.12 }}
      animate={{ y: [0, -18, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      👾
    </motion.div>
    <motion.div 
      className="decor-item floating-icon" 
      style={{ position: 'absolute', top: '70%', right: '8%', fontSize: '28px', opacity: 0.12 }}
      animate={{ y: [0, 24, 0] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
    >
      🎓
    </motion.div>
    <motion.div 
      className="decor-item floating-icon" 
      style={{ position: 'absolute', bottom: '15%', left: '260px', fontSize: '28px', opacity: 0.12 }}
      animate={{ x: [0, 30, 0] }}
      transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
    >
      ✨
    </motion.div>
  </div>
);

export default BackgroundDecor;
