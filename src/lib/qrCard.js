import QRCode from 'qrcode';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fontsource/kaushan-script/400.css';
import logoUrl from '../assets/qr-card-logo.png';

// One drawing routine for the dashboard preview and the downloadable PDFs, so both always match
// the printed table card design. Coordinates are in card units; `scale` sets the pixel density.
export const CARD_WIDTH = 300;
export const CARD_HEIGHT = 506;

const RED = '#ff5757';
const WHITE = '#ffffff';
const SANS = 'Poppins, Inter, system-ui, sans-serif';
const SCRIPT = '"Kaushan Script", cursive';

// The public menu URL a table's QR code opens. The token makes each QR code individually revocable.
export const tableMenuUrl = (vendorId, qrCode) =>
  `${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/menu/${vendorId}/${encodeURIComponent(qrCode.tableNumber)}?qr=${encodeURIComponent(qrCode.token)}`;

let assetsReady;
// Fonts and logo load once (bundled, so this works offline in the Android app too).
const loadAssets = () => {
  if (!assetsReady) {
    const logo = new Image();
    logo.src = logoUrl;
    assetsReady = Promise.all([
      logo.decode().then(() => logo),
      document.fonts.load(`700 20px Poppins`),
      document.fonts.load(`800 20px Poppins`),
      document.fonts.load(`400 20px "Kaushan Script"`),
    ]).then(([img]) => img);
  }
  return assetsReady;
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// Largest font size (down to `min`) at which `text` fits in `maxWidth`.
const fitFont = (ctx, text, weight, family, size, min, maxWidth) => {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (s > min && ctx.measureText(text).width > maxWidth) {
    s -= 1;
    ctx.font = `${weight} ${s}px ${family}`;
  }
  return s;
};

const ellipsize = (ctx, text, maxWidth) => {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
};

// Restaurant name on one line when it fits at a readable size, otherwise two balanced lines
// (split at the word break nearest the middle), truncated with "…" only as a last resort.
// Leaves ctx.font set to the chosen size.
const layoutName = (ctx, name, maxWidth) => {
  if (fitFont(ctx, name, 700, SANS, 21, 16, maxWidth) > 16 || ctx.measureText(name).width <= maxWidth) {
    return [name];
  }
  const words = name.split(/\s+/);
  if (words.length < 2) {
    fitFont(ctx, name, 700, SANS, 16, 12, maxWidth);
    return [ellipsize(ctx, name, maxWidth)];
  }
  let best = 1;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (diff < Math.abs(words.slice(0, best).join(' ').length - words.slice(best).join(' ').length)) best = i;
  }
  const lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')];
  const longest = lines.reduce((a, b) => (ctx.measureText(a).width >= ctx.measureText(b).width ? a : b));
  fitFont(ctx, longest, 700, SANS, 16, 12, maxWidth);
  return lines.map((l) => ellipsize(ctx, l, maxWidth));
};

// Thin white rule that fades out at both ends.
const fadedRule = (ctx, cx, y, width) => {
  const g = ctx.createLinearGradient(cx - width / 2, 0, cx + width / 2, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - width / 2, y, width, 1.6);
};

// `background` fills behind the rounded corners (needed for JPEG, which has no transparency).
export const renderQrCard = async ({ restaurantName, tableNumber, url, scale = 2, background = null }) => {
  const logo = await loadAssets();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(CARD_WIDTH * scale);
  canvas.height = Math.round(CARD_HEIGHT * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = CARD_WIDTH / 2;

  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  }

  // Card
  ctx.fillStyle = RED;
  roundRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, 14);
  ctx.fill();

  // Logo
  const logoW = 132;
  const logoH = (logo.height / logo.width) * logoW;
  ctx.drawImage(logo, cx - logoW / 2, 10, logoW, logoH);

  // Restaurant name
  ctx.fillStyle = WHITE;
  const nameLines = layoutName(ctx, restaurantName || 'Restaurant', CARD_WIDTH - 24);
  if (nameLines.length === 1) {
    ctx.fillText(nameLines[0], cx, 84);
  } else {
    ctx.fillText(nameLines[0], cx, 77);
    ctx.fillText(nameLines[1], cx, 95);
  }
  fadedRule(ctx, cx, nameLines.length === 1 ? 99 : 107, 130);

  // Corner-bracket frame with "Scan Me" breaking the top edge and "Order" the bottom edge
  const fx = 34, fy = 132, fw = CARD_WIDTH - 68, fh = 236, r = 14, lw = 5;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.font = `400 31px ${SCRIPT}`;
  const topGap = ctx.measureText('Scan Me').width / 2 + 10;
  ctx.font = `400 29px ${SCRIPT}`;
  const bottomGap = ctx.measureText('Order').width / 2 + 10;
  ctx.beginPath();
  ctx.moveTo(cx - topGap, fy);
  ctx.lineTo(fx + r, fy);
  ctx.arcTo(fx, fy, fx, fy + r, r);
  ctx.lineTo(fx, fy + fh - r);
  ctx.arcTo(fx, fy + fh, fx + r, fy + fh, r);
  ctx.lineTo(cx - bottomGap, fy + fh);
  ctx.moveTo(cx + bottomGap, fy + fh);
  ctx.lineTo(fx + fw - r, fy + fh);
  ctx.arcTo(fx + fw, fy + fh, fx + fw, fy + fh - r, r);
  ctx.lineTo(fx + fw, fy + r);
  ctx.arcTo(fx + fw, fy, fx + fw - r, fy, r);
  ctx.lineTo(cx + topGap, fy);
  ctx.stroke();

  ctx.fillStyle = WHITE;
  ctx.font = `400 31px ${SCRIPT}`;
  ctx.fillText('Scan Me', cx, fy - 2);
  ctx.font = `400 29px ${SCRIPT}`;
  ctx.fillText('Order', cx, fy + fh + 2);

  // QR modules (white on red, like the reference), snapped to whole device pixels so no seams
  // appear between modules when printed.
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  const areaPx = 182 * scale;
  const modulePx = Math.floor(areaPx / n);
  const qrPx = modulePx * n;
  const qrX = Math.round(cx * scale - qrPx / 2);
  const qrY = Math.round((fy + fh / 2) * scale - qrPx / 2);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = WHITE;
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (qr.modules.get(row, col)) ctx.fillRect(qrX + col * modulePx, qrY + row * modulePx, modulePx, modulePx);
    }
  }
  ctx.restore();

  fadedRule(ctx, cx, 395, 130);

  // "Table" + number in a black circle, centred as a pair
  const label = 'Table';
  const num = String(tableNumber);
  ctx.font = `800 32px ${SANS}`;
  const labelW = ctx.measureText(label).width;
  const numSize = fitFont(ctx, num, 800, SANS, 24, 10, 38);
  const circleD = 46;
  const gap = 6;
  const startX = cx - (labelW + gap + circleD) / 2;
  const rowY = 431;
  ctx.fillStyle = WHITE;
  ctx.font = `800 32px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.fillText(label, startX, rowY + 2);
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(startX + labelW + gap + circleD / 2, rowY, circleD / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.textAlign = 'center';
  ctx.font = `800 ${numSize}px ${SANS}`;
  ctx.fillText(num, startX + labelW + gap + circleD / 2, rowY + 1);

  // Dotted divider across the full width, then the footer
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let x = 2; x < CARD_WIDTH - 2; x += 4) ctx.fillRect(x, 466, 2, 1.2);
  ctx.fillStyle = WHITE;
  fitFont(ctx, 'Scan . Order . Enjoy', 700, SANS, 17, 10, CARD_WIDTH - 24);
  ctx.fillText('Scan . Order . Enjoy', cx, 487);

  return canvas;
};
