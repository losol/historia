// Demo images, drawn here rather than committed: a sky, a sea and a sun in a few
// palettes, encoded as PNG with nothing but node:zlib. They only need to be real
// images of a sensible size, so Payload's image sizes and the pages have
// something to show.

import { deflateSync } from 'node:zlib';

type Rgb = [number, number, number];

export type Palette = { sky: [Rgb, Rgb]; sea: [Rgb, Rgb]; sun: Rgb };

const WIDTH = 1600;
const HEIGHT = 900;

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (bytes: Buffer): number => {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type: string, data: Buffer): Buffer => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
};

/** A 1600×900 PNG: sky above the horizon, sea below, and a sun resting on it. */
export function seascape({ sky, sea, sun }: Palette): Buffer {
  const horizon = Math.round(HEIGHT * 0.62);
  const sunX = WIDTH * 0.68;
  const sunY = horizon - HEIGHT * 0.06;
  const sunRadius = HEIGHT * 0.12;

  // Each row starts with a filter byte (0: none), then RGB triples.
  const raw = Buffer.alloc((WIDTH * 3 + 1) * HEIGHT);
  let offset = 0;
  for (let y = 0; y < HEIGHT; y++) {
    raw[offset++] = 0;
    const row =
      y < horizon
        ? mix(sky[0], sky[1], y / horizon)
        : mix(sea[0], sea[1], (y - horizon) / (HEIGHT - horizon));
    for (let x = 0; x < WIDTH; x++) {
      const inSun = y < horizon && Math.hypot(x - sunX, y - sunY) < sunRadius;
      const [r, g, b] = inSun ? sun : row;
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
