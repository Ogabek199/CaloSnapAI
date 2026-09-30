export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const HEIF_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1']);

/** Detects the real image type from magic bytes; the client-declared mimetype is not trusted. */
export function detectImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';

  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }

  if (buf.toString('ascii', 4, 8) === 'ftyp' && HEIF_BRANDS.has(buf.toString('ascii', 8, 12))) {
    return 'image/heic';
  }

  return null;
}
