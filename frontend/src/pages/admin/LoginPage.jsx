import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../api/fetchlogin';
import '../../styles/login.css'; 
const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;
const LoginPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handlesubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login(data.email, data.password);
      localStorage.setItem('userId', res.user.id);
      localStorage.setItem('userRole', res.user.role);
      if(localStorage.getItem('userRole')=="admin"){
        navigate("/categories")
      }
      else{
        navigate("/")
      }
    } catch (err) {
      setError(err.message);
      
    }
  };

  const handleinput = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>تسجيل الدخول</h2>
          <p className="login-subtitle">أدخل حسابك لحفظ كل عمليات الشراء والوصول لسلتك</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form className="login-form" onSubmit={handlesubmit}>
          <div className="input-group">
            <label htmlFor="email">الإيميل</label>
            <input 
              type='email' 
              id='email'
              name='email'
              value={data.email}
              placeholder='example@domain.com'
              onChange={handleinput}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">كلمة السر</label>
            <input 
              type='password'
              id='password'
              name='password'
              value={data.password}
              onChange={handleinput}
              placeholder='••••••••'
              required
            />
          </div>

          <div className="forgot-password-container">
            <button type="button" className="btn-forgot">نسيت كلمة المرور؟</button>
          </div>

          <button type="submit" className="btn-submit">تسجيل الدخول</button>
        </form>

        <div className="login-footer">
          <p>ليس لديك حساب؟ <Link to='/register' className="register-link">أنشئ حساباً جديداً</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;