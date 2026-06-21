import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { Loader2 } from 'lucide-react';

export default function BecomeAHostPage({ user }) {
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    proposedLocation: '',
    proposedPricePerNight: 0,
  });
  const [idDocument, setIdDocument] = useState(null);
  const [housePictures, setHousePictures] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { notify } = useNotifications();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleIdDocumentChange = (e) => {
    setIdDocument(e.target.files[0]);
  };

  const handleHousePicturesChange = (e) => {
    setHousePictures(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idDocument) {
      notify('ID document is required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('fullName', formData.fullName);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('proposedLocation', formData.proposedLocation);
      data.append('proposedPricePerNight', formData.proposedPricePerNight);
      data.append('idDocument', idDocument);
      housePictures.forEach(pic => {
        data.append('housePictures', pic);
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://maskan-xzpw.onrender.com'}/api/host-demands/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data,
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      notify('Your host application has been submitted successfully!', 'success');
      navigate('/');
    } catch (error) {
      console.error(error);
      notify('An error occurred while submitting your application.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-primary-50">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary-900 text-primary-50 p-8">
          <h1 className="text-3xl font-bold">Become a Host</h1>
          <p className="text-primary-200 mt-2">Join our community and start earning by hosting guests.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-4 py-2 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-4 py-2 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Proposed Location</label>
              <input type="text" name="proposedLocation" value={formData.proposedLocation} onChange={handleInputChange} required className="w-full px-4 py-2 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g., Tunis, Marsa" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">Proposed Price Per Night ($)</label>
            <input type="number" name="proposedPricePerNight" value={formData.proposedPricePerNight} onChange={handleInputChange} required min="0" step="0.01" className="w-full px-4 py-2 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>

          <hr className="border-primary-100" />

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">ID Document (Passport or National ID)</label>
            <input type="file" accept="image/*,.pdf" onChange={handleIdDocumentChange} required className="w-full text-sm text-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">House Pictures (Optional, Select multiple)</label>
            <input type="file" accept="image/*" multiple onChange={handleHousePicturesChange} className="w-full text-sm text-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
            {housePictures.length > 0 && (
              <p className="mt-2 text-sm text-primary-500">{housePictures.length} file(s) selected.</p>
            )}
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-50">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
