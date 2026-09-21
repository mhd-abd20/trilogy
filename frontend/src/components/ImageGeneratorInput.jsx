import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

export default function ImageGeneratorInput({ onImageSelected, defaultImage = '', disabled = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [imageUrl, setImageUrl] = useState(defaultImage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false); // حالة التكبير في منتصف الشاشة
  const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    setImageUrl(defaultImage);
  }, [defaultImage]);

  const handleSearchImage = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim() || disabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${SERVER_ORIGIN}/api/products/search-image`, { 
        query: searchTerm.trim() 
      });

      const fetchedUrl = response.data.imageUrl;
      setImageUrl(fetchedUrl);

      if (onImageSelected) {
        onImageSelected(fetchedUrl);
      }
    } catch (err) {
      console.error('Error fetching image:', err);
      const serverMessage = err.response?.data?.message || 'تعذر العثور على صورة';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClearImage = () => {
    setImageUrl('');
    setSearchTerm('');
    setError(null);
    setIsZoomed(false);
    if (onImageSelected) onImageSelected('');
  };

  return (
    <>
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          opacity: disabled ? 0.45 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        {/* حقل إدخال اسم البحث */}
        <input
          type="text"
          placeholder="بحث Google للصورة..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearchImage();
            }
          }}
          disabled={loading || disabled}
          style={{
            height: '36px',
            width: '160px',
            padding: '0 10px',
            fontSize: '0.8rem',
            backgroundColor: '#0b1120',
            border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            color: '#f8fafc',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          title="اكتب اسم المنتج واضغط بحث أو Enter"
        />

        {/* زر البحث */}
        <button
          type="button"
          onClick={handleSearchImage}
          disabled={loading || !searchTerm.trim() || disabled}
          style={{
            height: '36px',
            padding: '0 12px',
            backgroundColor: loading ? '#312e81' : '#6366f1',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: loading || !searchTerm.trim() || disabled ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? 'جاري...' : '🔍 بحث'}
        </button>

        {/* الصورة المصغرة بجانب الزر */}
        {imageUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <img
              src={imageUrl}
              alt="Preview"
              onClick={() => setIsZoomed(true)} // فتح الصورة بملء الشاشة
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '6px',
                objectFit: 'cover',
                border: '1px solid #6366f1',
                cursor: 'zoom-in',
                transition: 'transform 0.15s ease'
              }}
              title="اضغط للتكبير وعرض الصورة كاملة 🔍"
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />

            <button
              type="button"
              onClick={handleClearImage}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '0 2px'
              }}
              title="حذف الصورة"
            >
              ✕
            </button>
          </div>
        )}

        {/* رسالة الخطأ إن وجدت */}
        {error && (
          <span
            style={{
              color: '#f87171',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap'
            }}
            title={error}
          >
            ⚠️ خطأ بالبحث
          </span>
        )}
      </div>

      {/* نافذة العرض الكامل بمنتصف الشاشة (Lightbox Modal) */}
      {isZoomed && imageUrl && (
        <div
          onClick={() => setIsZoomed(false)} // النقر في أي مكان يغلق المعاينة
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999,
            cursor: 'zoom-out',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '85vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <img
              src={imageUrl}
              alt="Full Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                borderRadius: '12px',
                objectFit: 'contain',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            />
            <span
              style={{
                marginTop: '12px',
                color: '#cbd5e1',
                fontSize: '0.9rem',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              اضغط في أي مكان للإغلاق ✕
            </span>
          </div>
        </div>
        
      )}
    </>
  );
}