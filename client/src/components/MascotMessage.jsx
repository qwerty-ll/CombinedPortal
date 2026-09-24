import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

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
    <div className={`mascot-say${position === 'right' ? ' mascot-say-right' : ''}`}>
      <motion.button
        type="button"
        className="mascot-say-button"
        onClick={handleMascotClick}
        aria-label="Погладить ВИТШика"
        animate={isMeowing ? { scale: 1.06 } : { scale: 1 }}
        transition={{ duration: 0.2, ease: EASE }}
      >
        <img src="/img/mascot.png" alt="" className="mascot-say-avatar" width="56" height="56" />
        <AnimatePresence>
          {isMeowing && (
            <motion.span
              className="mascot-say-meow"
              role="status"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              Мяу
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <div className="message bot">{text}</div>
    </div>
  );
};

export default MascotMessage;
