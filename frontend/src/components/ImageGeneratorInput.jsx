import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ImageGeneratorInput({ onImageSelected, defaultImage = '', disabled = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [imageUrl, setImageUrl] = useState(defaultImage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    setImageUrl(defaultImage);
  }, [defaultImage]);

  const handleSearchImage = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim() || disabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${SERVER_ORIGIN}/api/products/search-image`, { 
        query: searchTerm 
      });

      const fetchedUrl = response.data.imageUrl;
      setImageUrl(fetchedUrl);

      if (onImageSelected) {
        onImageSelected(fetchedUrl);
      }
    } catch (err) {
      console.error('Error fetching image:', err);
      const serverMessage = err.response?.data?.message || 'تعذر العثور على صورة، يرجى تجربة كلمات بحث أخرى.';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClearImage = () => {
    setImageUrl('');
    if (onImageSelected) onImageSelected('');
  };

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: disabled ? '#f1f5f9' : '#f8fafc', 
      opacity: disabled ? 0.6 : 1,
      pointerEvents: disabled ? 'none' : 'auto', 
      marginBottom: '20px'
    }}>
      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>
        البحث عن صورة للمنتج من الإنترنت {disabled && '(معطل لأنك رفعت صورة من الجهاز)'}
      </label>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="اكتب اسم المنتج (مثال: Smart Watch أو سماعات بلوتوث)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading || disabled} 
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
          onClick={handleSearchImage}
          disabled={loading || !searchTerm.trim() || disabled} 
          style={{
            padding: '10px 18px',
            backgroundColor: (loading || disabled) ? '#94a3b8' : '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: (loading || disabled) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'جاري البحث...' : 'بحث وجلب'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '0', marginBottom: '8px' }}>
          {error}
        </p>
      )}

      {imageUrl && (
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>معاينة الصورة المختارة:</p>
          <img
            src={imageUrl}
            alt="Product Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '260px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              objectFit: 'cover'
            }}
          />
          <br />
          <button
            type="button"
            onClick={handleClearImage}
            style={{ 
              fontSize: '12px', 
              color: '#ef4444', 
              marginTop: '6px', 
              cursor: 'pointer', 
              background: 'none', 
              border: 'none' 
            }}
          >
            مسح الصورة المختارة ❌
          </button>
        </div>
      )}
    </div>
  );
}