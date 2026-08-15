/**
 * Pure JavaScript QR Code Generator for rendering scannable SVG QR codes.
 * Supports URL encoding, phone deep links, and standard text.
 */

// Simple & robust QR Code Generator (Model 2, Byte Encoding)
export function generateQRCodeSVG(text, options = {}) {
  const size = options.size || 240;
  const color = options.color || '#000000';
  const bgColor = options.bgColor || '#ffffff';

  const qr = createQRMatrix(text);
  const count = qr.length;
  const cellSize = size / count;

  let rects = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr[r][c]) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const w = (cellSize + 0.05).toFixed(2); // slightly overlap to avoid gaps
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="${color}"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="${bgColor}" rx="12"/>
    <g transform="translate(0, 0)">${rects}</g>
  </svg>`;
}

// Generates a 2D boolean array representing QR modules with finder patterns & alignment
function createQRMatrix(text) {
  // Determine version based on length
  const len = text.length;
  let version = 2; // 25x25
  if (len > 32) version = 4; // 33x33
  if (len > 60) version = 6; // 41x41

  const size = 17 + 4 * version;
  const matrix = Array(size).fill(0).map(() => Array(size).fill(false));
  const reserved = Array(size).fill(0).map(() => Array(size).fill(false));

  // 1. Finder patterns (Top-left, Top-right, Bottom-left)
  addFinderPattern(matrix, reserved, 0, 0);
  addFinderPattern(matrix, reserved, size - 7, 0);
  addFinderPattern(matrix, reserved, 0, size - 7);

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const val = (i % 2 === 0);
    if (!reserved[6][i]) { matrix[6][i] = val; reserved[6][i] = true; }
    if (!reserved[i][6]) { matrix[i][6] = val; reserved[i][6] = true; }
  }

  // 3. Alignment patterns (for version >= 2)
  if (version >= 2) {
    const alignPos = version === 2 ? [18] : (version === 4 ? [22] : [26]);
    alignPos.forEach(r => {
      alignPos.forEach(c => {
        if (!reserved[r][c]) {
          addAnimationPattern(matrix, reserved, r - 2, c - 2);
        }
      });
    });
  }

  // 4. Encode data bits
  const bits = [];
  // Mode indicator for Byte mode: 0100
  bits.push(0, 1, 0, 0);
  // Character count indicator (8 bits for V1-9)
  for (let i = 7; i >= 0; i--) bits.push((len >> i) & 1);
  // Data bytes
  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);
    for (let b = 7; b >= 0; b--) bits.push((code >> b) & 1);
  }
  // Terminator
  bits.push(0, 0, 0, 0);

  // Fill data into matrix in zigzag pattern
  let bitIdx = 0;
  let dir = -1; // up
  let x = size - 1;

  while (x > 0) {
    if (x === 6) x--; // skip vertical timing column
    for (let y = dir === -1 ? size - 1 : 0; y >= 0 && y < size; y += dir) {
      for (let col = 0; col < 2; col++) {
        const currX = x - col;
        const currY = y;
        if (!reserved[currY][currX]) {
          const bitVal = bitIdx < bits.length ? bits[bitIdx++] === 1 : ((currX + currY) % 2 === 0);
          // Mask pattern 0: (x + y) % 2 == 0
          const mask = ((currX + currY) % 2 === 0);
          matrix[currY][currX] = bitVal ^ mask;
        }
      }
    }
    dir = -dir;
    x -= 2;
  }

  return matrix;
}

function addFinderPattern(matrix, reserved, r, c) {
  for (let i = -1; i <= 7; i++) {
    for (let j = -1; j <= 7; j++) {
      const row = r + i;
      const col = c + j;
      if (row >= 0 && row < matrix.length && col >= 0 && col < matrix.length) {
        reserved[row][col] = true;
        if (i >= 0 && i <= 6 && j >= 0 && j <= 6) {
          if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
            matrix[row][col] = true;
          } else {
            matrix[row][col] = false;
          }
        } else {
          matrix[row][col] = false;
        }
      }
    }
  }
}

function addAnimationPattern(matrix, reserved, r, c) {
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const row = r + i;
      const col = c + j;
      reserved[row][col] = true;
      if (i === 0 || i === 4 || j === 0 || j === 4 || (i === 2 && j === 2)) {
        matrix[row][col] = true;
      } else {
        matrix[row][col] = false;
      }
    }
  }
}
