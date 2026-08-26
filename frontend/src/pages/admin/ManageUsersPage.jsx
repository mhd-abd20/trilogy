import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/manage-users.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://trilogy-production.up.railway.app';

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null); 
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', role: 'client' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users`);
      setUsers(res.data);
    } catch (err) {
      alert('خطأ أثناء جلب المستخدمين');
    } finally {
      setLoading(false);
    }
  };


  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      role: user.role
    });
  };

 
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/users/${editingUser.id}`, formData);
      alert('تم التحديث بنجاح!');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ في التعديل');
    }
  };


  const handleDelete = async (id) => {
    if (window.confirm('هل أنت تأكد من رغبتك في حذف هذا المستخدم؟')) {
      try {
        await axios.delete(`${API_URL}/api/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert('فشل في عملية الحذف');
      }
    }
  };

  // فلترة المستخدمين بحسب البحث
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">جاري التحميل...</div>;

  return (
    <div className="users-management-container">
      <h2>إدارة المستخدمين</h2>

      <input 
        type="text" 
        placeholder="ابحث بالاسم أو البريد الإلكتروني..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />

      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>الاسم</th>
            <th>الإيميل</th>
            <th>الهاتف</th>
            <th>الدور (Role)</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td><strong>{u.name}</strong></td>
              <td>{u.email}</td>
              <td>{u.phone || 'غير مدخل'}</td>
              <td>
                <span className={`role-badge ${u.role}`}>
                  {u.role === 'admin' ? 'مدير (Admin)' : 'عميل (Client)'}
                </span>
              </td>
              <td>
                <button className="btn-edit" onClick={() => handleEditClick(u)}>تعديل</button>
                <button className="btn-delete" onClick={() => handleDelete(u.id)}>حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* نافذة التعديل (Modal) */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>تعديل بيانات المستخدم #{editingUser.id}</h3>
            <form onSubmit={handleUpdate}>
              <label>الاسم:</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />

              <label>البريد الإلكتروني:</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
              />

              <label>الهاتف:</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              />

              <label>الدور:</label>
              <select 
                value={formData.role} 
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="client">عميل (Client)</option>
                <option value="admin">آدمن (Admin)</option>
              </select>

              <div className="modal-actions">
                <button type="submit" className="btn-save">حفظ التغيرات</button>
                <button type="button" className="btn-cancel" onClick={() => setEditingUser(null)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersPage;