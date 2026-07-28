import React from 'react';
import { motion } from 'framer-motion';

const BackgroundDecor = () => (
  <div className="bg-decorations">
    {/* Tech/Code snippets */}
    <div className="decor-item code-snippet" style={{ top: '5%', left: '280px' }}>
      <code>class Freshman extends Student {}</code>
    </div>
    <div className="decor-item code-snippet" style={{ top: '25%', right: '15%' }}>
      <code>import &#123; innovation &#125; from 'IVITSH'</code>
    </div>
    <div className="decor-item code-snippet" style={{ bottom: '30%', left: '350px' }}>
      <code>while(student.isHungry) &#123; student.eat() &#125;</code>
    </div>
    
    {/* Math/Easter Eggs */}
    <div className="decor-item multi-lang" style={{ top: '35%', left: '300px', opacity: 0.2 }}>
      Привет / Hello / Bonjour
    </div>
    <div className="decor-item multi-lang" style={{ bottom: '15%', left: '400px', opacity: 0.2 }}>
      世界 / Hello World
    </div>
    
    {/* sketches & icons */}
    <motion.div 
      className="decor-item floating-icon" 
      style={{ top: '10%', left: '420px', fontSize: '24px' }}
      animate={{ y: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 6, repeat: Infinity }}
    >
      👾
    </motion.div>
    <motion.div 
      className="decor-item floating-icon" 
      style={{ top: '65%', right: '25%', fontSize: '24px' }}
      animate={{ y: [0, 30, 0], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 8, repeat: Infinity }}
    >
      🎓
    </motion.div>
    <motion.div 
      className="decor-item floating-icon" 
      style={{ bottom: '10%', left: '50%', fontSize: '24px' }}
      animate={{ x: [0, 50, 0], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 12, repeat: Infinity }}
    >
      ✨
    </motion.div>

    <div className="decor-item binary-sketch" style={{ bottom: '5%', right: '10%', opacity: 0.1, fontSize: '10px' }}>
      01010110 01001001 01010100 01010011 01001000
    </div>
  </div>
);

export default BackgroundDecor;
