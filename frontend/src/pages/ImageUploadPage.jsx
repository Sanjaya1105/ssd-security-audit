import React from 'react';
import ImageUpload from '../components/ImageUpload';

const ImageUploadPage = () => {
  const handleImageUpload = (imageUrl) => {
    console.log('Uploaded image URL:', imageUrl);
    // Here you can handle the uploaded image URL
    // For example, save it to state or send it to your backend
  };

  return (
    <div className="min-h-screen bg-[#0a0b1e] flex items-center justify-center p-4">
      <div className="bg-[#1B2028]/90 backdrop-blur-sm rounded-[20px] p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Upload Image</h1>
        <ImageUpload 
          onImageUpload={handleImageUpload}
          currentImage={null}
        />
      </div>
    </div>
  );
};

export default ImageUploadPage; 