const CELL_SIZE = 20;

export function createEmptyGrid(width: number, height: number): boolean[][] {
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

export function runSimulation(grid: boolean[][]): boolean[][] {
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

export { CELL_SIZE };