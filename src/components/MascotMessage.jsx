import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MascotMessage = ({ text, position = "left" }) => {
  const [isMeowing, setIsMeowing] = useState(false);
  
  const handleMascotClick = () => {
    if (isMeowing) return;
    setIsMeowing(true);
    const audio = new Audio('/sounds/meow.mp3');
    audio.play().catch(() => {});
    setTimeout(() => setIsMeowing(false), 1000);
  };

  return (
    <motion.div 
      className={`mascot-level ${position === 'right' ? 'right' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <motion.div 
        className="mascot-img-wrapper" 
        onClick={handleMascotClick} 
        style={{ cursor: isMeowing ? 'default' : 'pointer' }}
        animate={isMeowing ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
      >
        <img src="/img/mascot.png" alt="ВИТШик" className="mascot-avatar" />
        <AnimatePresence>
          {isMeowing && (
            <motion.div 
              className="meow-hint active"
              initial={{ opacity: 0, y: 10, scale: 0.5 }}
              animate={{ opacity: 1, y: -20, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              Мяу! 🐱
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <div className="speech-bubble-level">{text}</div>
    </motion.div>
  );
};

export default MascotMessage;
