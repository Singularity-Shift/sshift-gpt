'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { silkscreen } from './fonts';
import { SshiftWallet } from '@fn-chat/components/SshigtWallet';
import { createEmptyGrid, runSimulation, CELL_SIZE } from './utils/gameOfLife';

function GameOfLifeBackground() {
  const [grid, setGrid] = useState(() =>
    createEmptyGrid(typeof window !== 'undefined' ? window.innerWidth : 1000, typeof window !== 'undefined' ? window.innerHeight : 1000)
  );

  const updateGrid = useCallback(() => {
    setGrid(runSimulation);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(updateGrid, 150);
    return () => clearInterval(intervalId);
  }, [updateGrid]);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: -1 }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.ceil(
            (typeof window !== 'undefined' ? window.innerWidth : 1000) / CELL_SIZE
          )}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${Math.ceil(
            (typeof window !== 'undefined' ? window.innerHeight : 1000) / CELL_SIZE
          )}, ${CELL_SIZE}px)`,
          height: '100vh',
          width: '100vw',
        }}
      >
        {grid.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: cell
                  ? 'rgba(200, 200, 200, 0.2)'
                  : 'transparent',
                transition: 'background-color 0.3s ease',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <GameOfLifeBackground />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        <div className="flex items-center mb-8">
          <div className="relative w-64 h-64 mr-8">
            <Image
              src="/images/sshift-logo-animated.gif"
              alt="SShift GPT Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
              unoptimized
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1
              className={`text-6xl font-bold text-gray-800 leading-tight text-center ${silkscreen.className}`}
            >
              Welcome to
              <br />
              SShift GPT
            </h1>
          </div>
        </div>
        <div className="flex space-x-4">
          <SshiftWallet />
        </div>
      </div>
    </div>
  );
}
