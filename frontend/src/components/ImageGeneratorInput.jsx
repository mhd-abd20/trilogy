import React, { useState } from 'react';
import axios from 'axios';

export default function ImageGeneratorInput({ onImageSelected, defaultImage = '' }) {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState(defaultImage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // طلب رابط الصورة من مسار ה-Backend الخاص بك
      const response = await axios.post(`${SERVER_ORIGIN}/api/products/generate-image`, { prompt });
      const generatedUrl = response.data.imageUrl;

      setImageUrl(generatedUrl);

      // تمرير رابط الصورة الناتجة للـ Form الرئيسي (Component الأب)
      if (onImageSelected) {
        onImageSelected(generatedUrl);
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError('تعذر توليد الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: '#f8fafc',
      marginBottom: '20px'
    }}>
      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>
        توليد صورة المنتج بالذكاء الاصطناعي
      </label>

      {/* حقل الوصف وزر التوليد */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="اكتب وصف الصورة بالإنكليزية (مثال: Wireless gaming mouse, black matte finish)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            outline: 'none',
            fontSize: '14px'
          }}
        />

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          style={{
            padding: '10px 18px',
            backgroundColor: loading ? '#94a3b8' : '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? 'جاري التوليد...' : 'توليد الصورة'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '0', marginBottom: '8px' }}>
          {error}
        </p>
      )}

      {/* معاينة الصورة الناتجة */}
      {imageUrl && (
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>معاينة الصورة الناتجة:</p>
          <img
            src={imageUrl}
            alt="Generated Product"
            style={{
              maxWidth: '100%',
              maxHeight: '260px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              objectFit: 'cover'
            }}
          />
        </div>
      )}
    </div>
  );
}