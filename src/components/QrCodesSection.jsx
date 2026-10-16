import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FaQrcode,
  FaPlus,
  FaTimes,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaDownload,
  FaArrowCircleUp,
  FaWhatsapp,
} from 'react-icons/fa';
import axios, { notifyError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { openAdminWhatsApp } from '../lib/contact';
import { renderQrCard, tableMenuUrl } from '../lib/qrCard';
import Skeleton from './Skeleton';

const planLimitMessage = (limit) =>
  `Please upgrade your plan. Your current plan allows you to create a maximum of ${limit} QR scanners.`;

const isPlanLimitError = (error) => error?.response?.data?.code === 'PLAN_LIMIT_REACHED';

// Rendered previews, kept across re-renders and tab switches (key covers everything drawn).
const previewCache = new Map();
const cardKey = (card) => `${card.restaurantName}|${card.tableNumber}|${card.url}`;

const QrCardPreview = ({ card }) => {
  const key = cardKey(card);
  const [src, setSrc] = useState(() => previewCache.get(key) || null);

  useEffect(() => {
    if (previewCache.has(key)) {
      setSrc(previewCache.get(key));
      return undefined;
    }
    let cancelled = false;
    renderQrCard({ ...card, scale: 1.6 })
      .then((canvas) => {
        const url = canvas.toDataURL('image/png');
        previewCache.set(key, url);
        if (!cancelled) setSrc(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return src ? (
    <img src={src} alt={`QR code for table ${card.tableNumber}`} className="w-48 sm:w-52 h-auto rounded-xl shadow-md" />
  ) : (
    <Skeleton className="w-48 sm:w-52 aspect-[300/506] rounded-xl" />
  );
};

const QrCodesSection = ({ data, onChange, loading }) => {
  const { user } = useAuth();
  const { qrCodes, usage } = data;
  const [showTables, setShowTables] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [limitPopup, setLimitPopup] = useState(null);
  // Which download is running: a table number, or '*' for Download All, plus progress.
  const [download, setDownload] = useState(null);

  const limitReached = usage?.limit != null && usage.remaining === 0;

  const cardFor = (qrCode) => ({
    restaurantName: user?.restaurantName || '',
    tableNumber: qrCode.tableNumber,
    url: tableMenuUrl(user?.id, qrCode),
  });

  // Instant feedback from the usage the server already sent; the server enforces it regardless.
  const openAdd = () => {
    if (limitReached) setLimitPopup(usage.limit);
    else setShowAddModal(true);
  };

  const runDownload = async (list, id) => {
    if (download) return;
    setDownload({ id, done: 0, total: list.length });
    try {
      const { downloadQrPdf } = await import('../lib/qrPdf'); // PDF library loads only when needed
      await downloadQrPdf(list.map(cardFor), {
        onProgress: (done, total) => setDownload({ id, done, total }),
      });
      toast.success(list.length === 1 ? `Table ${list[0].tableNumber} QR code downloaded` : 'All QR codes downloaded');
    } catch (error) {
      // Dismissing the Android share sheet isn't an error worth reporting.
      if (!/cancel/i.test(error?.message || '')) toast.error('Could not create the PDF. Please try again.');
    } finally {
      setDownload(null);
    }
  };

  const usageLabel = usage
    ? usage.limit == null
      ? `${usage.active} active · Unlimited`
      : `${usage.active} / ${usage.limit} QR codes used`
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-2xl lg:rounded-none shadow-lg p-4 sm:p-6"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-1.5 sm:gap-2 min-w-0">
            <FaQrcode className="text-gray-800 dark:text-white flex-shrink-0" />
            <span className="truncate">Tables & QR Codes</span>
          </h2>
          {usageLabel && (
            <p className={`text-xs mt-0.5 ${limitReached ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              {usageLabel}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {qrCodes.length > 0 && (
            <button
              onClick={() => setShowTables((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl lg:rounded-none font-semibold text-sm sm:text-base hover:bg-gray-200 dark:hover:bg-gray-600 transition-all whitespace-nowrap"
            >
              {showTables ? <FaEyeSlash /> : <FaEye />}
              <span className="sm:hidden">{showTables ? 'Hide' : 'Show'}</span>
              <span className="hidden sm:inline">{showTables ? 'Hide Tables' : 'Show Tables'}</span>
            </button>
          )}
          <button
            onClick={openAdd}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white dark:text-white rounded-xl lg:rounded-none font-semibold text-sm sm:text-base hover:shadow-lg transition-all whitespace-nowrap disabled:opacity-50"
          >
            <FaPlus />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Table</span>
          </button>
        </div>
      </div>

      {qrCodes.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-6">
          No tables yet. Add a table number to generate its QR code.
        </p>
      ) : !showTables ? null : (
        <>
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {qrCodes.length} table{qrCodes.length === 1 ? '' : 's'}
            </p>
            <button
              onClick={() => runDownload(qrCodes, '*')}
              disabled={!!download}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl lg:rounded-none bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {download?.id === '*' ? <FaSpinner className="animate-spin" /> : <FaDownload />}
              {download?.id === '*' ? `Preparing ${download.done}/${download.total}` : 'Download All (PDF)'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {qrCodes.map((qrCode) => (
              <div
                key={qrCode.token}
                className="border border-gray-100 dark:border-gray-700 rounded-xl lg:rounded-none p-4 flex flex-col items-center gap-3"
              >
                <QrCardPreview card={cardFor(qrCode)} />
                <button
                  onClick={() => runDownload([qrCode], qrCode.tableNumber)}
                  disabled={!!download}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg lg:rounded-none bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs font-medium disabled:opacity-50"
                >
                  {download?.id === qrCode.tableNumber ? <FaSpinner className="animate-spin text-xs" /> : <FaDownload className="text-xs" />}
                  Download PDF
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {showAddModal && (
        <AddTableModal
          tables={qrCodes.map((q) => q.tableNumber)}
          onClose={() => setShowAddModal(false)}
          onSaved={(updated) => {
            onChange(updated);
            setShowAddModal(false);
            setShowTables(true);
          }}
          onLimitReached={(limit) => {
            setShowAddModal(false);
            setLimitPopup(limit);
          }}
        />
      )}
      {limitPopup != null && (
        <PlanLimitModal limit={limitPopup} onClose={() => setLimitPopup(null)} onContact={() => openAdminWhatsApp(user)} />
      )}
    </motion.div>
  );
};

const AddTableModal = ({ tables, onClose, onSaved, onLimitReached }) => {
  const [number, setNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const trimmed = number.trim();
  const isDuplicate = trimmed !== '' && tables.some((t) => t.trim().toLowerCase() === trimmed.toLowerCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trimmed || isDuplicate) return;

    setSaving(true);
    try {
      const { data } = await axios.post('/api/vendor/tables', { number: trimmed });
      toast.success(`Table ${trimmed} added!`);
      onSaved(data);
    } catch (error) {
      if (isPlanLimitError(error)) onLimitReached(error.response.data.limit);
      else notifyError(error, 'Failed to add table');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaQrcode className="text-gray-800 dark:text-white" /> Add Table
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <FaTimes className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Table Number
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="e.g. 5"
              autoFocus
              className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 ${
                isDuplicate
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-red-500 dark:focus:ring-red-500'
              }`}
            />
            {isDuplicate ? (
              <p className="text-xs text-red-500 mt-1.5">Table {trimmed} is already added</p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Please double-check the number: a QR code can't be edited or deleted once it's created.
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={saving || isDuplicate || !trimmed}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white dark:text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
            Add Table
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Centred on every screen size (unlike the bottom-sheet modals) with a close (×) button.
const PlanLimitModal = ({ limit, onClose, onContact }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={(e) => e.stopPropagation()}
      role="alertdialog"
      aria-labelledby="plan-limit-title"
      className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <FaTimes className="text-gray-500 dark:text-gray-400" />
      </button>
      <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4">
        <FaArrowCircleUp className="text-2xl" />
      </div>
      <h2 id="plan-limit-title" className="text-lg font-bold text-gray-800 dark:text-white">QR limit reached</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{planLimitMessage(limit)}</p>
      <button
        onClick={onContact}
        className="w-full mt-6 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
      >
        <FaWhatsapp className="text-lg" /> Contact admin to upgrade
      </button>
    </motion.div>
  </motion.div>
);

export default QrCodesSection;
