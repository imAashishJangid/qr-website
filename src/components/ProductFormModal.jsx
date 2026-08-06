import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSpinner, FaImage, FaPlus, FaChevronDown } from 'react-icons/fa';
import axios from '../lib/api';
import toast from 'react-hot-toast';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ProductFormModal = ({ product, categories, onCategoryCreated, onClose, onSaved }) => {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    originalPrice: product?.originalPrice || '',
    categoryId: product?.categoryId?._id || product?.categoryId || '',
    isVeg: product?.isVeg ?? true,
    isBestseller: product?.isBestseller ?? false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image || '');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  const selectedCategory = categories.find((c) => c._id === form.categoryId);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(await fileToBase64(file));
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    setAddingCategory(true);
    try {
      const { data } = await axios.post('/api/vendor/categories', { name: newCategory.trim() });
      onCategoryCreated(data);
      setForm((prev) => ({ ...prev, categoryId: data._id }));
      setNewCategory('');
      setShowNewCategory(false);
      toast.success('Category added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error('Please select or create a category');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        image: imageFile ? imagePreview : undefined,
      };

      if (isEdit) {
        await axios.put(`/api/vendor/products/${product._id}`, payload);
        toast.success('Product updated');
      } else {
        await axios.post('/api/vendor/products', payload);
        toast.success('Product added');
      }
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-none shadow-2xl w-full sm:max-w-lg lg:max-w-2xl max-h-[90vh] lg:max-h-[95vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
              {isEdit ? 'Edit Product' : 'Add Product'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <FaTimes className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:border-red-400 transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
              ) : (
                <FaImage className="text-3xl text-gray-300 dark:text-gray-600" />
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">Tap to upload image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g. Paneer Tikka"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Short description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Original Price</label>
                <input
                  type="number"
                  name="originalPrice"
                  value={form.originalPrice}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>

              {showNewCategory ? (
                <div className="flex gap-2">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category name"
                    autoFocus
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={addingCategory}
                    className="px-4 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50"
                  >
                    {addingCategory ? <FaSpinner className="animate-spin" /> : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="px-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white"
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No categories yet</p>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="inline-flex items-center gap-1.5 text-red-500 font-semibold text-sm hover:underline"
                  >
                    <FaPlus className="text-xs" /> Add your first category
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <span className={selectedCategory ? '' : 'text-gray-400'}>
                      {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : 'Select category'}
                    </span>
                    <FaChevronDown
                      className={`text-gray-400 text-sm transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {categoryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setCategoryDropdownOpen(false)} />
                      <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-40 overflow-y-auto">
                        {categories.map((c) => (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, categoryId: c._id }));
                              setCategoryDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-4 py-1.5 text-left text-sm transition-colors ${
                              form.categoryId === c._id
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span>{c.icon}</span> {c.name}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryDropdownOpen(false);
                            setShowNewCategory(true);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-1.5 text-left text-sm font-semibold text-red-500 border-t border-gray-100 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <FaPlus className="text-xs" /> Add another category
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" name="isVeg" checked={form.isVeg} onChange={handleChange} />
                Vegetarian
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" name="isBestseller" checked={form.isBestseller} onChange={handleChange} />
                Bestseller
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <FaSpinner className="animate-spin" /> : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductFormModal;
