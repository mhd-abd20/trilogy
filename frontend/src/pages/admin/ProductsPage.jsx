import React, { useState, useEffect } from 'react';
import '../../styles/productsPage.css';
import imageCompression from 'browser-image-compression';
import ImageGeneratorInput from '../../components/ImageGeneratorInput';
import {
  getProducts,
  createBulkProducts,
  updateProduct,
  deleteProduct
} from '../../api/fetchproducts';

import { getCategories } from '../../api/categoryService';

const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;
const PLACEHOLDER_IMAGE = '/placeholder.png';

const getImageUrl = (imagePath) => {
  if (!imagePath) return PLACEHOLDER_IMAGE;
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${SERVER_ORIGIN}${cleanPath}`;
};

const compressImageFile = async (file) => {
  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1000,
    useWebWorker: true,
    fileType: 'image/jpeg'
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(compressedBlob);
    });
  } catch (error) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
};

const initialSingleProduct = {
  name: '',
  original_price: '',
  stock_quantity: '',
  category_id: '',
  description: '',
  youtube_url: '',
  image_url: '',
  imageFile: null
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  const [formList, setFormList] = useState([{ ...initialSingleProduct }]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadData(currentPage);
  }, [currentPage]);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const [productsRes, categoriesData] = await Promise.all([
        getProducts(page, 100),
        getCategories()
      ]);

      if (productsRes && productsRes.products) {
        setProducts(productsRes.products);
        setTotalPages(productsRes.pagination.totalPages);
        setTotalProductsCount(productsRes.pagination.total);
      } else {
        setProducts(Array.isArray(productsRes) ? productsRes : []);
      }

      setCategories(categoriesData || []);
    } catch (err) {
      console.error('خطأ أثناء جلب البيانات:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddRow = () => {
    setFormList((prev) => [...prev, { ...initialSingleProduct }]);
  };

  const handleRemoveRow = (index) => {
    if (formList.length === 1) {
      alert('يجب الإبقاء على منتج واحد على الأقل.');
      return;
    }
    setFormList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageFileChange = async (index, file) => {
    if (!file) {
      handleItemChange(index, 'imageFile', null);
      return;
    }
    const base64 = await compressImageFile(file);
    setFormList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], imageFile: file, image_url: base64 };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editId) {
        const item = formList[0];
        const dataToSend = new FormData();
        dataToSend.append('name', item.name);
        dataToSend.append('price', item.original_price);
        dataToSend.append('stock_quantity', item.stock_quantity);
        dataToSend.append('category_id', item.category_id);
        dataToSend.append('description', item.description);
        dataToSend.append('youtube_url', item.youtube_url);

        if (item.imageFile) {
          dataToSend.append('image', item.imageFile);
        } else if (item.image_url) {
          dataToSend.append('image_url', item.image_url);
        }

        await updateProduct(editId, dataToSend);
        alert('تم تعديل المنتج بنجاح!');
      } else {
        const payload = formList.map((item) => ({
          name: item.name,
          original_price: item.original_price,
          stock_quantity: item.stock_quantity,
          category_id: item.category_id,
          description: item.description,
          youtube_url: item.youtube_url,
          image_url: item.image_url
        }));

        const res = await createBulkProducts(payload);
        alert(res.message || 'تمت إضافة المنتجات بنجاح!');
      }

      resetForm();
      loadData(currentPage);
    } catch (err) {
      alert(`خطأ: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (product) => {
    setEditId(product.id);
    setFormList([
      {
        name: product.name || '',
        original_price: product.original_price || product.price || '',
        stock_quantity: product.stock_quantity || '',
        category_id: product.category_id || '',
        description: product.description || '',
        youtube_url: product.youtube_url || '',
        image_url: product.image_url || '',
        imageFile: null
      }
    ]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await deleteProduct(id);
      loadData(currentPage);
    } catch (err) {
      alert(`فشل الحذف: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormList([{ ...initialSingleProduct }]);
    setEditId(null);
  };

  return (
    <div className="products-wrapper">
      <div className="products-container" style={{ maxWidth: '1400px' }}>
        <div className="products-header">
          <h2>إدارة المنتجات</h2>
          <p>أدخل وحفظ المنتجات بسرعة وبدون استهلاك مساحة الشاشة</p>
        </div>

        {/* نموذج الإدخال فائق الضغط */}
        <div className="compact-form-card">
          <div className="compact-card-top">
            <h3>
              {editId ? 'تعديل بيانات المنتج ✏️' : `إضافة منتجات متعددة (${formList.length}) 📦`}
            </h3>
            {!editId && (
              <button type="button" onClick={handleAddRow} className="btn-add-mini-row">
                + إضافة سطر لمنتج جديد
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="compact-rows-container">
              {formList.map((item, index) => (
                <div key={index} className="compact-row-box">
                  <div className="row-counter-badge">#{index + 1}</div>

                  <div className="compact-grid-line line-1">
                    <input
                      type="text"
                      required
                      placeholder="اسم المنتج *"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="input-compact flex-grow"
                    />

                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="السعر ($) *"
                      value={item.original_price}
                      onChange={(e) => handleItemChange(index, 'original_price', e.target.value)}
                      className="input-compact w-price"
                    />

                    <input
                      type="number"
                      required
                      placeholder="الكمية *"
                      value={item.stock_quantity}
                      onChange={(e) => handleItemChange(index, 'stock_quantity', e.target.value)}
                      className="input-compact w-qty"
                    />

                    <select
                      required
                      value={item.category_id}
                      onChange={(e) => handleItemChange(index, 'category_id', e.target.value)}
                      className="input-compact w-cat"
                    >
                      <option value="">-- اختر الفئة --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>

                    {!editId && formList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="btn-delete-row"
                        title="حذف هذا السطر"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="compact-grid-line line-2">
                    <input
                      type="text"
                      placeholder="وصف مختصر..."
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="input-compact flex-1"
                    />

                    <input
                      type="text"
                      placeholder="رابط يوتيوب..."
                      value={item.youtube_url}
                      onChange={(e) => handleItemChange(index, 'youtube_url', e.target.value)}
                      className="input-compact flex-1"
                    />

                    <div className="compact-image-controls">
                      <label className="btn-file-label" title="رفع صورة من الجهاز">
                        📁 {item.imageFile ? 'تم الرفع ✓' : 'صورة'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          disabled={!!item.image_url && !item.imageFile}
                          onChange={(e) => handleImageFileChange(index, e.target.files[0])}
                        />
                      </label>

                      {item.imageFile && (
                        <button
                          type="button"
                          onClick={() => {
                            handleItemChange(index, 'imageFile', null);
                            handleItemChange(index, 'image_url', '');
                          }}
                          className="btn-cancel-file"
                          title="إلغاء الملف"
                        >
                          ✕
                        </button>
                      )}

                      <div className="ai-gen-wrapper">
                        <ImageGeneratorInput
                          onImageSelected={(url) => {
                            handleItemChange(index, 'image_url', url);
                            if (url) handleItemChange(index, 'imageFile', null);
                          }}
                          defaultImage={item.imageFile ? '' : item.image_url}
                          disabled={!!item.imageFile}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="compact-actions">
              <button type="submit" disabled={submitting} className="btn-submit">
                {submitting
                  ? 'جاري الحفظ...'
                  : editId
                  ? 'حفظ التعديلات'
                  : `حفظ كل المنتجات المكتوبة دفعة واحدة (${formList.length})`}
              </button>

              {editId && (
                <button type="button" onClick={resetForm} className="btn-cancel">
                  إلغاء
                </button>
              )}
            </div>
          </form>
        </div>

        {/* شبكة قائمة المنتجات */}
        <div className="products-header" style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>قائمة المنتجات المتاحة (إجمالي: {totalProductsCount})</h2>
        </div>

        {/* أزرار التنقل بين الصفحات (Pagination) */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', margin: '20px 0' }}>
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '8px 16px',
                backgroundColor: currentPage <= 1 ? '#1e293b' : '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              → الصفحة السابقة
            </button>
            <span style={{ color: '#cbd5e1' }}>
              صفحة <strong>{currentPage}</strong> من <strong>{totalPages}</strong>
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: '8px 16px',
                backgroundColor: currentPage >= totalPages ? '#1e293b' : '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              الصفحة التالية ←
            </button>
          </div>
        )}

        {loading ? (
          <p className="loading-text">جاري تحميل البيانات...</p>
        ) : products.length === 0 ? (
          <p className="empty-text">لا توجد منتجات حالياً.</p>
        ) : (
          <div className="products-grid">
            {products.map((p) => (
              <div key={p.id} className="product-card">
                <div>
                  <div className="product-image-container">
                    <img
                      src={getImageUrl(p.image_url)}
                      alt={p.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  </div>

                  <span className="category-badge">{p.cname || 'بدون فئة'}</span>
                  <h3 className="product-title">{p.name}</h3>
                  <div className="product-price">
                    ${Number(p.price || p.original_price || 0).toFixed(2)}
                  </div>

                  <p className="product-info">
                    المخزون: <strong>{p.stock_quantity}</strong>
                  </p>

                  {p.description && <p className="product-description">{p.description}</p>}
                </div>

                <div className="card-actions">
                  <button onClick={() => handleEditClick(p)} className="btn-edit">
                    تعديل
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="btn-delete">
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}