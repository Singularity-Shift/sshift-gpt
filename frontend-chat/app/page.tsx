'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { silkscreen } from './fonts';
import { SshiftWallet } from '@fn-chat/components/SshigtWallet';
import { PontemWallet } from '@pontem/wallet-adapter-plugin';

const CELL_SIZE = 20;

function createEmptyGrid(width: number, height: number) {
  const cols = Math.ceil(width / CELL_SIZE);
  const rows = Math.ceil(height / CELL_SIZE);
  return Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null)
        .map(() => Math.random() > 0.8)
    );
}

function GameOfLifeBackground() {
  const [grid, setGrid] = useState(() =>
    createEmptyGrid(window.innerWidth, window.innerHeight)
  );

  const runSimulation = useCallback(() => {
    setGrid((g) => {
      return g.map((row, i) =>
        row.map((cell, j) => {
          const neighbors = [
            g[i - 1]?.[j - 1],
            g[i - 1]?.[j],
            g[i - 1]?.[j + 1],
            g[i]?.[j - 1],
            g[i]?.[j + 1],
            g[i + 1]?.[j - 1],
            g[i + 1]?.[j],
            g[i + 1]?.[j + 1],
          ].filter(Boolean).length;

          if (cell && (neighbors < 2 || neighbors > 3)) return false;
          if (!cell && neighbors === 3) return true;
          return cell;
        })
      );
    });
  }, []);

  useEffect(() => {
    const intervalId = setInterval(runSimulation, 150);
    return () => clearInterval(intervalId);
  }, [runSimulation]);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: -1 }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.ceil(
            window.innerWidth / CELL_SIZE
          )}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${Math.ceil(
            window.innerHeight / CELL_SIZE
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
