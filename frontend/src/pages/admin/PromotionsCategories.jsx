import { useState, useEffect } from "react";
import { getPromotions, createPromotion, togglePromotionActive } from '../../api/fetchpromotions';
import { useNavigate } from "react-router-dom";
import '../../styles/Promotions.css';

const PromotionsCategories = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    is_active: 1
  });

  const navigate = useNavigate();

  // الحصول على التاريخ والوقت الحالي بصيغة YYYY-MM-THH:mm لحظر التواريخ السابقة بالـ Input
  const getCurrentMinDateTime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now - tzOffset).toISOString().slice(0, 16);
  };

  const currentMinDateTime = getCurrentMinDateTime();

  const fetchPromotions = async () => {
    try {
      const data = await getPromotions();
      setPromotions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? (checked ? 1 : 0) : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: val };
     
      if (name === 'start_date' && updated.end_date && updated.end_date <= value) {
        updated.end_date = '';
      }
      return updated;
    });
  };

  const handleCreatePromotion = async (e) => {
    e.preventDefault();

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      alert("خطأ: يجب أن يكون تاريخ النهاية أكبر من تاريخ البداية!");
      return;
    }

    setSubmitting(true);
    try {
      await createPromotion(formData);
      setFormData({ title: '', start_date: '', end_date: '', is_active: 1 });
      fetchPromotions();
    } catch (err) {
      alert('خطأ أثناء إضافة العرض: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  
  const handleToggleActive = async (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
   
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: newStatus } : p))
    );

    try {
      await togglePromotionActive(id, newStatus);
    } catch (err) {
      alert('فشل تحديث حالة العرض');
      fetchPromotions(); 
    }
  };

  const isExpired = (endDateStr) => {
    if (!endDateStr) return true;
    return new Date(endDateStr) < new Date();
  };

  if (loading) return <div className="promo-wrapper"><div className="promo-container"><p>جاري التحميل...</p></div></div>;

  return (
    <div className="promo-wrapper">
      <div className="promo-container">
        
        <div className="promo-header">
          <h2>إدارة العروضات والخصومات</h2>
          <p>إنشاء ومتابعة حالة عروض المتجر وتفعيلها</p>
        </div>

        {error && <div className="error-box">{error}</div>}

       
        <form onSubmit={handleCreatePromotion} className="promo-form">
          <h3>+ إضافة عرض جديد</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label>عنوان العرض</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="مثال: تنزيلات رأس السنة"
                required
              />
            </div>

            <div className="form-group">
              <label>تاريخ البداية (الحد أدنى: اليوم)</label>
              <input
                type="datetime-local"
                name="start_date"
                min={currentMinDateTime}
                value={formData.start_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>تاريخ النهاية (أكبر من البداية)</label>
              <input
                type="datetime-local"
                name="end_date"
                min={formData.start_date || currentMinDateTime}
                value={formData.end_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active === 1}
                  onChange={handleInputChange}
                />
                تفعيل العرض فور الإنشاء
              </label>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'جاري الحفظ...' : 'حفظ ونشر العرض'}
          </button>
        </form>

        
        <div className="promo-grid">
          {promotions.length === 0 ? (
            <p className="no-data">لا توجد عروضات حالياً.</p>
          ) : (
            promotions.map((p) => {
              const expired = isExpired(p.end_date);
              const isActive = p.is_active === 1;

              return (
                <div key={p.id} className={`promo-card ${expired ? 'expired-card' : ''}`}>
                  
                  <div className="card-header">
                    <h4>{p.title}</h4>
                    <span className={`status-badge ${expired ? 'badge-expired' : (isActive ? 'badge-active' : 'badge-disabled')}`}>
                      {expired ? 'منتهي' : (isActive ? 'نشط' : 'معطّل')}
                    </span>
                  </div>

                  <div className="card-body">
                    <p><strong>من:</strong> {p.start_date ? p.start_date.split('T')[0] : 'غير حدد'}</p>
                    <p><strong>إلى:</strong> {p.end_date ? p.end_date.split('T')[0] : 'غير حدد'}</p>
                  </div>

                  {/* ⚡ مفتاح الـ Toggle لتغيير is_active + زر التفاصيل */}
                  <div className="card-actions">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => handleToggleActive(p.id, p.is_active)}
                        disabled={expired}
                      />
                      <span className="slider round"></span>
                      <span className="toggle-text">{isActive ? 'مفعّل' : 'معطّل'}</span>
                    </label>

                    <button 
                      className="btn-details"
                      onClick={() => navigate(`/promotions/${p.id}`)}
                    >
                      التفاصيل ➔
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default PromotionsCategories;