import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaLeaf, FaBoxOpen } from 'react-icons/fa';
import axios from '../../lib/api';
import toast from 'react-hot-toast';
import ProductFormModal from '../../components/ProductFormModal';

const VendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await axios.delete(`/api/vendor/products/${product._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      toast.success('Product deleted');
    } catch (error) {
      toast.error('Failed to delete product');
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
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <FaPlus /> <span className="hidden sm:inline">Add Product</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex gap-3 p-3"
                >
                  <img
                    src={product.image || 'https://placehold.co/100'}
                    alt={product.name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white truncate">{product.name}</h3>
                      {product.isVeg && <FaLeaf className="text-green-500 flex-shrink-0" />}
                    </div>
                    <p className="text-red-500 font-bold mt-0.5">₹{product.price}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100"
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
    </div>
  );
};

export default VendorProducts;
