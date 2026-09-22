import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  getPromotions_id,
  addProductToPromotion,
  removeProductFromPromotion
} from '../../api/fetchpromotions';
import { getProducts } from '../../api/fetchproducts';
import '../../styles/promotions.css'; 

const Promotions = () => {
  const { id } = useParams();

  const [products, setProducts] = useState([]);
  const [allproducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [discounts, setDiscounts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");

useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [promoProductsData, allProductsData] = await Promise.all([
          getPromotions_id(id),
          getProducts(1, 1000) 
        ]);

        setProducts(Array.isArray(promoProductsData) ? promoProductsData : (promoProductsData?.products || []));
        if (allProductsData && Array.isArray(allProductsData.products)) {
          setAllProducts(allProductsData.products);
        } else if (Array.isArray(allProductsData)) {
          setAllProducts(allProductsData);
        } else {
          setAllProducts([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleRemoveProduct = async (productId) => {
    try {
      await removeProductFromPromotion(id, productId);
      setProducts((prev) =>
        prev.filter((p) => p.id !== productId && p.product_id !== productId)
      );
    } catch (err) {
      alert(`فشل الحذف: ${err.message}`);
    }
  };

  const handleDiscountChange = (productId, value) => {
    setDiscounts((prev) => ({ ...prev, [productId]: value }));
  };

  const handleAddProduct = async (product) => {
    const discountPercentage = discounts[product.id] || 0;
    try {
      const result = await addProductToPromotion(id, product.id, discountPercentage);
      const newPromoProduct = {
        ...product,
        product_id: product.id,
        discount_percentage: discountPercentage,
        promo_price: result.promo_price,
      };
      setProducts((prev) => [...prev, newPromoProduct]);
    } catch (err) {
      alert(`خطأ: ${err.message}`);
    }
  };


  const categories = Array.from(
    new Set(allproducts.map((p) => p.cname).filter(Boolean))
  );



  const filteredAllProducts = allproducts.filter((p) => {
    const isAddedInCurrentPromo = products.some(
      (promoP) => promoP.id === p.id || promoP.product_id === p.id
    );
    if (isAddedInCurrentPromo) return false;

    const isAlreadyInActivePromo = p.discount_percentage !== null || p.promotion_title !== null;
    if (isAlreadyInActivePromo) return false;

    if (selectedCategory === "all") return true;
    return p.cname === selectedCategory;
  });

  if (loading) {
    return (
      <div className="admin-page-wrapper">
        <div className="admin-main-card empty-state-text">جاري تحميل البيانات...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-wrapper">
        <div className="admin-main-card empty-state-text" style={{ color: 'var(--admin-danger)' }}>
          خطأ: {error}
        </div>
      </div>
    );
  }


  return (
    <div className="admin-page-wrapper">

      <div className="admin-header">
        <div className="admin-title-group">
          <h2>إدارة العروض والخصومات</h2>
          <p className="admin-subtitle">إدارة المنتجات المدرجة ضمن العرض رقم #{id}</p>
        </div>

        <div className="admin-stats-group">
          <div className="stat-badge">
            إجمالي المنتجات بالعرض: <strong>{products.length}</strong>
          </div>
        </div>
      </div>


      <div className="admin-toolbar">
        <button className="btn-admin-add" onClick={() => setAdding((prev) => !prev)}>
          {adding ? "إغلاق قائمة الاختيار" : "+ إضافة منتجات للعرض"}
        </button>
      </div>

      {adding && (
        <div className="admin-main-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 className="card-title-header" style={{ margin: 0 }}>قائمة جميع المنتجات المتاحة:</h3>

         
            <div className="filter-group" style={{ marginBottom: '15px' }}>
              <label htmlFor="category-select" style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                تصفية حسب التصنيف:
              </label>
              <select
                id="category-select"
                className="admin-input"
                style={{ width: 'auto', display: 'inline-block' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">جميع التصنيفات</option>
                {categories.map((categoryName, index) => (
                  <option key={index} value={categoryName}>
                    {categoryName} 
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>اسم المنتج</th>
                  
                  <th>السعر الأصلي</th>
                  <th>نسبة الخصم (%)</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {/* 🔹 التكرار على القائمة المفلترة بدلاً من allproducts */}
                {filteredAllProducts.map((p) => {
                  const isAdded = products.some(
                    (promoP) => promoP.id === p.id || promoP.product_id === p.id
                  );

                  return (
                    <tr key={p.id}>
                      <td data-label="اسم المنتج">{p.name}</td>
                      <td data-label="السعر الأصلي">${p.original_price}</td>
                      <td data-label="نسبة الخصم">
                        {!isAdded ? (
                          <input
                            type="number"
                            placeholder="0 %"
                            className="admin-input"
                            value={discounts[p.id] || ''}
                            onChange={(e) => handleDiscountChange(p.id, e.target.value)}
                          />
                        ) : (
                          <span className="badge-discount">مضاف سابقاً</span>
                        )}
                      </td>
                      <td data-label="الإجراءات">
                        <div className="admin-actions">
                          {!isAdded ? (
                            <button className="btn-admin-action add" onClick={() => handleAddProduct(p)}>
                              إضافة للعرض
                            </button>
                          ) : (
                            <button className="btn-admin-action delete" onClick={() => handleRemoveProduct(p.id)}>
                              إزالة
                            </button>
                          )
                          }
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      <div className="admin-main-card">
        <h3 className="card-title-header">المنتجات التابعة لهذا العرض حالياً:</h3>
        {products.length === 0 ? (
          <div className="empty-state-text">لا توجد منتجات مضافة لهذا العرض حتى الآن.</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>اسم المنتج</th>
                  <th>الفئة</th>
                  <th>نسبة الخصم</th>
                  <th>السعر بعد الخصم</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const currentId = p.product_id || p.id;
                  return (
                    <tr key={currentId}>
                      <td data-label="اسم المنتج">{p.name}</td>
                      <td data-label="الفئة">{p.cname}</td>
                      <td data-label="نسبة الخصم">
                        <span className="badge-discount">{p.discount_percentage}% خصم</span>
                      </td>
                      <td data-label="السعر بعد الخصم" className="price-text">
                        ${p.promo_price}
                      </td>
                      <td data-label="الإجراءات">
                        <div className="admin-actions">
                          <button className="btn-admin-action delete" onClick={() => handleRemoveProduct(currentId)}>
                            حذف من العرض
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Promotions;