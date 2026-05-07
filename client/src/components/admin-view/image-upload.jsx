import { FileIcon, UploadCloudIcon, X, ImagePlus, Video } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import api from '../../utils/axios';

function ProductImageUpload({
  media,
  setMedia,
  imageLoadingState,
  setImageLoadingState,
}) {
  const inputImageRef = useRef(null);
  const inputVideoRef = useRef(null);

  const handleImageFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      uploadFiles(files, 'image');
    }
  };

  const handleVideoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFiles([file], 'video');
    }
  };

  async function uploadFiles(files, type) {
    setImageLoadingState(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const data = new FormData();
        data.append('my_file', file);
        const response = await api.post('/admin/products/upload-image', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.result.secure_url;
      });

      const urls = await Promise.all(uploadPromises);

      setMedia((prev) => {
        if (type === 'image') {
          const newImages = [...prev.images, ...urls].slice(0, 9);
          return { ...prev, images: newImages };
        } else {
          return { ...prev, video: urls[0] };
        }
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Gagal upload media. Silakan coba lagi.');
    } finally {
      setImageLoadingState(false);
    }
  }

  const removeImage = (index) => {
    setMedia((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeVideo = () => {
    setMedia((prev) => ({ ...prev, video: null }));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <Label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Foto Produk ({media.images.length}/9)
            </Label>
            <span className="text-[10px] text-gray-400 font-medium">PNG, JPG up to 10MB</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.images.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
              <img src={url} alt={`Product ${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="bg-white/20 backdrop-blur-md hover:bg-red-500 text-white rounded-full p-2 transition-all transform hover:scale-110"
                >
                    <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {media.images.length < 9 && (
            <button
              type="button"
              onClick={() => inputImageRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center hover:bg-gray-50 hover:border-orange-200 group transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-orange-50 transition-colors">
                <ImagePlus className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-orange-600">Tambah Foto</span>
            </button>
          )}
        </div>
        <Input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          ref={inputImageRef}
          onChange={handleImageFileChange}
        />
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-bold text-gray-500 uppercase tracking-wider block">Video Produk (Opsional)</Label>
        {media.video ? (
          <div className="relative group rounded-2xl overflow-hidden border border-gray-200 aspect-video max-w-sm shadow-md">
            <video src={media.video} className="w-full h-full object-cover" controls />
            <button
              type="button"
              onClick={removeVideo}
              className="absolute top-2 right-2 bg-white/20 backdrop-blur-md hover:bg-red-500 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputVideoRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center hover:bg-gray-50 hover:border-orange-200 group transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-orange-50 transition-colors">
                <Video className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-orange-600 tracking-wide">Upload Video Product</span>
          </button>
        )}
        <Input
          type="file"
          accept="video/*"
          className="hidden"
          ref={inputVideoRef}
          onChange={handleVideoFileChange}
        />
      </div>

      {imageLoadingState && (
        <div className="fixed bottom-10 right-10 z-[100] bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-10">
           <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent animate-spin rounded-full"></div>
           <div className="flex flex-col">
                <span className="text-sm font-bold">Mengunggah Media...</span>
                <span className="text-[10px] text-gray-400">Mohon tunggu sebentar</span>
           </div>
        </div>
      )}
    </div>
  );
}

export default ProductImageUpload;
