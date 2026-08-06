import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaLeaf, FaBoxOpen, FaExclamationTriangle } from 'react-icons/fa';
import axios from '../../lib/api';
import toast from 'react-hot-toast';
import ProductFormModal from '../../components/ProductFormModal';

const VendorProducts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get('/api/vendor/products'),
        axios.get('/api/vendor/categories'),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.openAdd) {
      setModalProduct(null);
      setShowModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const openAddModal = () => {
    setModalProduct(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setModalProduct(product);
    setShowModal(true);
  };

  const handleSaved = () => {
    setShowModal(false);
    fetchData();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/vendor/products/${deleteTarget._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      toast.success('Product deleted');
      setDeleteTarget(null);
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <header className="safe-top sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-bold text-gray-800 dark:text-white">Products</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{products.length} items</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold text-sm sm:text-base hover:shadow-lg transition-all flex-shrink-0"
          >
            <FaPlus /> Add Product
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <FaSpinner className="text-3xl text-red-500 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <FaBoxOpen className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No products yet</h3>
            <p className="text-gray-500 dark:text-gray-500 mt-2">Add your first product to build your menu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <AnimatePresence>
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden flex gap-4 p-4 border border-gray-100 dark:border-gray-700"
                >
                  <img
                    src={product.image || 'https://placehold.co/100'}
                    alt={product.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white leading-snug">{product.name}</h3>
                      {product.isVeg && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex-shrink-0">
                          <FaLeaf /> Veg
                        </span>
                      )}
                    </div>
                    <p className="text-red-500 font-bold text-lg mt-1">₹{product.price}</p>
                    <div className="flex gap-2 mt-auto pt-3">
                      <button
                        onClick={() => openEditModal(product)}
                        className="flex items-center justify-center gap-1.5 flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="flex items-center justify-center gap-1.5 flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {showModal && (
        <ProductFormModal
          product={modalProduct}
          categories={categories}
          onCategoryCreated={(cat) => setCategories((prev) => [...prev, cat])}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="text-2xl" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Delete product?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
              "{deleteTarget.name}" will be removed from your menu. This can't be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deleting ? <FaSpinner className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default VendorProducts;
