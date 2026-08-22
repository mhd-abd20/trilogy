import { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory } from '../../api/categoryService';
import '../../styles/CategoriesList.css';

function CategoriesList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await createCategory(newCategoryName);
      setNewCategoryName('');
      loadCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      await updateCategory(category.id, category.name, !category.is_active);
      loadCategories();
    } catch (err) {
      alert('فشل تغيير الحالة: ' + err.message);
    }
  };

  const handleSaveName = async (category) => {
    if (!editingName.trim()) return;
    try {
      await updateCategory(category.id, editingName, category.is_active);
      setEditingId(null);
      loadCategories();
    } catch (err) {
      alert('فشل تعديل الاسم: ' + err.message);
    }
  };

  const activeCount = categories.filter(c => c.is_active).length;

  if (loading) return <div className="admin-page-wrapper"><p style={{ color: '#94a3b8' }}>جاري تحميل البيانات...</p></div>;
  if (error) return <div className="admin-page-wrapper"><p style={{ color: '#ef4444' }}>خطأ: {error}</p></div>;

  return (
    <div className="admin-page-wrapper">
      
      {/* الهيدر العلوي */}
      <div className="admin-header">
        <div className="admin-title-group">
          <h2>إدارة الفئات والمخزون</h2>
          <p className="admin-subtitle">متابعة الفئات والكميات المتوفرة في المخزن</p>
        </div>

        <div className="admin-stats-group">
          <div className="stat-badge">
            الإجمالي: <strong>{categories.length}</strong>
          </div>
          <div className="stat-badge">
            النشطة: <strong style={{ color: '#10b981' }}>{activeCount}</strong>
          </div>
          <div className="stat-badge">
            المعطلة: <strong style={{ color: '#ef4444' }}>{categories.length - activeCount}</strong>
          </div>
        </div>
      </div>

      {/* كرت المحتوى */}
      <div className="admin-main-card">
        
        {/* شريط الإضافة */}
        <div className="admin-toolbar">
          <form onSubmit={handleAddCategory} className="admin-add-form">
            <input
              type="text"
              className="admin-input"
              placeholder="أدخل اسم فئة جديدة لإضافتها..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button type="submit" className="btn-admin-add">+ إضافة فئة</button>
          </form>
        </div>

        {/* الجدول مع عمود المخزون */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '8%' }}># المعرف</th>
                <th style={{ width: '35%' }}>اسم الفئة</th>
                <th style={{ width: '17%' }}>إجمالي المخزون</th>
                <th style={{ width: '15%' }}>الحالة</th>
                <th style={{ width: '25%' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ color: '#64748b', fontWeight: '600' }}>#{cat.id}</td>
                  
                  {/* اسم الفئة */}
                  <td>
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        className="admin-input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className={cat.is_active ? '' : 'text-disabled'}>
                        {cat.name}
                      </span>
                    )}
                  </td>

             
                  <td>
                    <span className="stock-badge">
                      {Number(cat.total_stock).toLocaleString()} قطعة
                    </span>
                  </td>

                  {/* حالة الفئة */}
                  <td>
                    <span className={`badge-status ${cat.is_active ? 'active' : 'inactive'}`}>
                      ● {cat.is_active ? 'نشط' : 'معطل'}
                    </span>
                  </td>

                  {/* الإجراءات */}
                  <td>
                    <div className="admin-actions">
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        className={`btn-admin-action ${cat.is_active ? 'toggle-off' : 'toggle-on'}`}
                      >
                        {cat.is_active ? 'تعطيل' : 'تفعيل'}
                      </button>

                      {editingId === cat.id ? (
                        <button onClick={() => handleSaveName(cat)} className="btn-admin-action save">
                          حفظ
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditingName(cat.name);
                          }}
                          className="btn-admin-action"
                        >
                          تعديل
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default CategoriesList;