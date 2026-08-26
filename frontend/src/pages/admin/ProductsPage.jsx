import React, { useState, useEffect } from 'react';
import '../../styles/productsPage.css';
import imageCompression from 'browser-image-compression';
import ImageGeneratorInput from '../../components/ImageGeneratorInput';
import {
  getProducts,
  createProduct,
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
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/jpeg'
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    const compressedFile = new File([compressedBlob], file.name || `compressed_${Date.now()}.jpg`, {
      type: compressedBlob.type,
    });
    return compressedFile;
  } catch (error) {
    console.error('خطأ أثناء ضغط الصورة:', error);
    return file;
  }
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    original_price: '',
    stock_quantity: '',
    category_id: '',
    description: '',
    youtube_url: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories()
      ]);
      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error('خطأ أثناء جلب البيانات:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageGenerated = (generatedUrl) => {
    setImageUrlInput(generatedUrl);
    setImageFile(null); // إلغاء تحديد الملف اليدوي في حال توليد صورة
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('price', formData.original_price);
    dataToSend.append('stock_quantity', formData.stock_quantity);
    dataToSend.append('category_id', formData.category_id);
    dataToSend.append('description', formData.description);
    dataToSend.append('youtube_url', formData.youtube_url);

    if (imageFile) {
      const compressed = await compressImageFile(imageFile);
      dataToSend.append('image', compressed);
    } else if (imageUrlInput) {
      dataToSend.append('image_url', imageUrlInput);
    }

    try {
      if (editId) {
        await updateProduct(editId, dataToSend);
      } else {
        await createProduct(dataToSend);
      }

      resetForm();
      const updatedProducts = await getProducts();
      setProducts(updatedProducts);
    } catch (err) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const handleEditClick = (product) => {
    setEditId(product.id);
    setFormData({
      name: product.name || '',
      original_price: product.original_price || '',
      stock_quantity: product.stock_quantity || '',
      category_id: product.category_id || '',
      description: product.description || '',
      youtube_url: product.youtube_url || '',
    });

    if (product.image_url && (product.image_url.startsWith('http://') || product.image_url.startsWith('https://') || product.image_url.startsWith('data:'))) {
      setImageUrlInput(product.image_url);
    } else {
      setImageUrlInput('');
    }
    setImageFile(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت تأكد من حذف هذا المنتج؟')) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      alert(`فشل الحذف: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      original_price: '',
      stock_quantity: '',
      category_id: '',
      description: '',
      youtube_url: '',
    });
    setImageFile(null);
    setImageUrlInput('');
    setEditId(null);
  };

  return (
    <div className="products-wrapper">
      <div className="products-container">

        {/* الهيدر */}
        <div className="products-header">
          <h2>إدارة المنتجات</h2>
        </div>
        <p>قم بإضافة وتعديل أو حذف المنتجات من لوحة التحكم</p>

        {/* نموذج الإضافة والتعديل */}
        <div className="product-form-card">
          <h3>{editId ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>اسم المنتج:</label>
              <input
                type="text"
                name="name"
                placeholder="مثال: سماعة لاسلكية"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>السعر ($):</label>
                <input
                  type="number"
                  step="0.01"
                  name="original_price"
                  placeholder="0.00"
                  value={formData.original_price}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>الكمية المتوفرة:</label>
                <input
                  type="number"
                  name="stock_quantity"
                  placeholder="0"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>الفئة:</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                required
              >
                <option value="">-- اختر الفئة --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>وصف المنتج:</label>
              <textarea
                name="description"
                placeholder="تفاصيل المنتج..."
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>رابط يوتيوب:</label>
              <textarea
                name="youtube_url"
                placeholder="مقطع يوتيوب توضيحي..."
                value={formData.youtube_url}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>1. رفع صورة من الجهاز:</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  setImageFile(e.target.files[0]);
                  if (e.target.files[0]) setImageUrlInput(''); // مسح رابط الصورة المولد إذا تم رفع ملف
                }}
              />
            </div>

            <div className="form-divider">أو</div>

            <div className="form-group">
              <label>2. كتابة وصف وتوليد صورة بالذكاء الاصطناعي:</label>
              <ImageGeneratorInput
                onImageGenerated={handleImageGenerated}
                initialUrl={imageUrlInput}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editId ? 'حفظ التعديلات' : 'إضافة المنتج'}
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
        <div className="products-header">
          <h2>قائمة المنتجات المتاحة</h2>
        </div>

        {loading ? (
          <p className="loading-text">جاري تحميل البيانات...</p>
        ) : products.length === 0 ? (
          <p className="empty-text">لا يوجد منتجات حالياً.</p>
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

                  <span className="category-badge">
                    {p.cname || 'بدون فئة'}
                  </span>

                  <h3 className="product-title">{p.name}</h3>
                  <div className="product-price">
                    ${(Number(p.price || p.original_price || 0)).toFixed(2)}
                  </div>

                  <p className="product-info">
                    المخزون: <strong>{p.stock_quantity}</strong>
                  </p>

                  {p.description && (
                    <p className="product-description">
                      {p.description}
                    </p>
                  )}
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