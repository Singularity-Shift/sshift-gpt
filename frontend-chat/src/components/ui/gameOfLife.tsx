'use client';

import React, { useState, useEffect, useCallback } from 'react';

const CELL_SIZE = 20;

function createEmptyGrid(width: number, height: number): boolean[][] {
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

function runSimulation(grid: boolean[][]): boolean[][] {
  return grid.map((row, i) =>
    row.map((cell, j) => {
      const neighbors = [
        grid[i - 1]?.[j - 1],
        grid[i - 1]?.[j],
        grid[i - 1]?.[j + 1],
        grid[i]?.[j - 1],
        grid[i]?.[j + 1],
        grid[i + 1]?.[j - 1],
        grid[i + 1]?.[j],
        grid[i + 1]?.[j + 1],
      ].filter(Boolean).length;

      if (cell && (neighbors < 2 || neighbors > 3)) return false;
      if (!cell && neighbors === 3) return true;
      return cell;
    })
  );
}

export function GameOfLife() {
  const [dimensions, setDimensions] = useState({ width: 1000, height: 1000 });
  const [grid, setGrid] = useState<boolean[][]>([]);

  useEffect(() => {
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setGrid(createEmptyGrid(dimensions.width, dimensions.height));
  }, [dimensions]);

  const updateGrid = useCallback(() => {
    setGrid(runSimulation);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(updateGrid, 150);
    return () => clearInterval(intervalId);
  }, [updateGrid]);

  if (grid.length === 0) return null;

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: -1 }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.ceil(dimensions.width / CELL_SIZE)}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${Math.ceil(dimensions.height / CELL_SIZE)}, ${CELL_SIZE}px)`,
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