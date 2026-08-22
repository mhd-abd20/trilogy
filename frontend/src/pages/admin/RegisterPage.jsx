import React, { useState } from 'react';
import { register } from '../../api/fetchlogin';
import { useNavigate, Link } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";
import '../../styles/register.css'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  const [capVal, setCapVal] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!capVal) return;

    setError('');
    setLoading(true);

    try {
      await register(formData);
      alert("تم إنشاء الحساب بنجاح!");
      navigate('/login');
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>إنشاء حساب جديد</h2>
          <p className="register-subtitle">قم بتعبئة البيانات التالية للانضمام إلينا ومتابعة طلباتك</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="name">اسم المستخدم</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="الاسم الكامل"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="example@domain.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">كلمة المرور</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="phone">رقم الهاتف</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="01234567"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label htmlFor="address">العنوان</label>
            <input
              type="text"
              id="address"
              name="address"
              placeholder="المدينة، الشارع، البناء..."
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="recaptcha-wrapper">
            <ReCAPTCHA
              sitekey='6LddnoAtAAAAAIJVKapF_i8BQ8cLfdlYpNi6rtZY'
              onChange={val => setCapVal(val)}
            />
          </div>

          <button type="submit" className="btn-submit" disabled={!capVal || loading}>
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
          </button>
        </form>

        <div className="register-footer">
          <p>لديك حساب بالفعل؟ <Link to='/login' className="login-link">تسجيل الدخول</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;