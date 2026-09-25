import React, { useState } from 'react';
import cloudinaryConfig from '../config/cloudinaryConfig';

const ImageUpload = ({ onImageUpload, currentImage }) => {
  const [image, setImage] = useState(currentImage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadImage = async (file) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setImage(data.secure_url);
      onImageUpload(data.secure_url);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadImage(file);
    }
  };

  return (
    <div className="space-y-4">
      {image && (
        <div className="relative w-48 h-48">
          <img
            src={image}
            alt="Uploaded"
            className="w-full h-full rounded-lg object-cover"
          />
        </div>
      )}
      
      <div className="flex items-center space-x-4">
        <label className="cursor-pointer bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-all duration-300">
          {loading ? 'Uploading...' : 'Upload Image'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
        </label>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

export default ImageUpload; 