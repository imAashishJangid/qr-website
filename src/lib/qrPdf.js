import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { renderQrCard, CARD_WIDTH, CARD_HEIGHT } from './qrCard';

// A4 portrait, in mm. Single downloads get one large card; "Download All" fits four per page
// (2 x 2), each at 80 mm wide, which prints cleanly and is easy to cut out.
const PAGE_W = 210;
const PAGE_H = 297;
const SINGLE_W = 110;
const GRID_W = 80;
const GRID_GAP_X = 12;
const GRID_GAP_Y = 8;
const ASPECT = CARD_HEIGHT / CARD_WIDTH;
// ~290 dpi at 80 mm: sharp in print while keeping a 60-card PDF to a few MB.
const RENDER_SCALE = 3;

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

const cardImage = async (card) => {
  const canvas = await renderQrCard({ ...card, scale: RENDER_SCALE, background: '#ffffff' });
  return canvas.toDataURL('image/jpeg', 0.92);
};

const safeFileName = (name) => name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'qr-codes';

// Web: normal browser download. Android app: the WebView can't download blobs, so the PDF is
// written to the app cache and handed to the system share sheet (Save to Files, Drive, WhatsApp…).
const savePdf = async (doc, fileName) => {
  if (!Capacitor.isNativePlatform()) {
    doc.save(fileName);
    return;
  }
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);
  const data = doc.output('datauristring').split(',')[1];
  const { uri } = await Filesystem.writeFile({ path: fileName, data, directory: Directory.Cache });
  await Share.share({ title: fileName, url: uri, dialogTitle: 'Save or share QR codes' });
};

// cards: [{ restaurantName, tableNumber, url }]. onProgress(done, total) lets the UI show progress.
export const downloadQrPdf = async (cards, { fileName, onProgress } = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const single = cards.length === 1;

  for (let i = 0; i < cards.length; i++) {
    const image = await cardImage(cards[i]);
    if (single) {
      const h = SINGLE_W * ASPECT;
      doc.addImage(image, 'JPEG', (PAGE_W - SINGLE_W) / 2, (PAGE_H - h) / 2, SINGLE_W, h);
    } else {
      const slot = i % 4;
      if (i > 0 && slot === 0) doc.addPage();
      const h = GRID_W * ASPECT;
      const left = (PAGE_W - (GRID_W * 2 + GRID_GAP_X)) / 2;
      const top = (PAGE_H - (h * 2 + GRID_GAP_Y)) / 2;
      doc.addImage(image, 'JPEG', left + (slot % 2) * (GRID_W + GRID_GAP_X), top + Math.floor(slot / 2) * (h + GRID_GAP_Y), GRID_W, h);
    }
    onProgress?.(i + 1, cards.length);
    await nextFrame(); // keep the UI responsive between cards
  }

  const restaurant = cards[0]?.restaurantName || 'restaurant';
  const name = fileName || (single ? `${restaurant} Table ${cards[0].tableNumber}` : `${restaurant} QR codes`);
  await savePdf(doc, `${safeFileName(name)}.pdf`);
};
