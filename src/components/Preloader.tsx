import React from 'react';
import { motion } from 'motion/react';

const Preloader = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
    >
      <div className="flex flex-col items-center">
        {/* Logo with pulse animation */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative mb-8"
        >
          <img src="/logo.png" alt="MediSmart" className="w-24 h-24 object-contain" />
          
          {/* Wave circles */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{
                scale: [1, 2.5],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut",
              }}
              className="absolute inset-0 border-2 border-[#099aa7] rounded-full"
            />
          ))}
        </motion.div>
        
        {/* Loading text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-sm font-bold text-[#099aa7] uppercase tracking-[0.3em]"
        >
          MediSmart
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Preloader;
