import { FileIcon, UploadCloudIcon, XIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import api from '../../utils/axios'; // 🔹 Perbaiki import path sesuai struktur folder Anda

function ProductImageUpload({
  imageFile,
  setImageFile,
  imageLoadingState,
  uploadedImageUrl,
  setUploadedImageUrl,
  setImageLoadingState,
  isEditMode,
  isCustomStyling = false,
  initialImage, // 🔹 Tambahkan prop untuk gambar awal saat edit
}) {
  const inputRef = useRef(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  function handleImageFileChange(event) {
    console.log(event.target.files, 'event.target.files');
    const selectedFile = event.target.files?.[0];
    console.log(selectedFile);

    if (selectedFile) setImageFile(selectedFile);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDrop(event) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) setImageFile(droppedFile);
  }

  function handleRemoveImage() {
    setCurrentImageUrl(''); // 🔹 Hapus preview gambar
    setImageFile(null);
    setUploadedImageUrl(''); // 🔹 Reset URL juga
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  async function uploadImageToCloudinary() {
    setImageLoadingState(true);
    try {
      const data = new FormData();
      data.append('my_file', imageFile);

      const response = await api.post('/admin/products/upload-image', data, {
        headers: {
          'Content-Type': 'multipart/form-data', // 🔹 Header yang benar untuk file upload
        },
      });

      if (response?.data?.success) {
        // 🔹 Perbaiki: gunakan secure_url, bukan url
        setUploadedImageUrl(response.data.result.secure_url);
        setImageLoadingState(false);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageLoadingState(false);
      // 🔹 Tambahkan error handling
      alert('Gagal upload gambar. Silakan coba lagi.');
    }
  }

  useEffect(() => {
    if (imageFile !== null) uploadImageToCloudinary();
  }, [imageFile]);

  useEffect(() => {
    if (uploadedImageUrl) {
      setCurrentImageUrl(uploadedImageUrl);
    }
  }, [uploadedImageUrl]);

  useEffect(() => {
    if (isEditMode && initialImage) {
      setCurrentImageUrl(initialImage);
    }
  }, [isEditMode, initialImage]);

  return (
    <div className={`w-full mt-4 ${isCustomStyling ? '' : 'max-w-md mx-auto'}`}>
      <Label className="text-lg font-semibold mb-2 block">Upload Image</Label>

      {/* 🔹 Tampilkan preview gambar jika ada */}
      {currentImageUrl && (
        <div className="mb-4">
          <img
            src={currentImageUrl}
            alt="Product Preview"
            className="w-full h-40 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            className="mt-2 w-full"
          >
            <XIcon className="w-4 h-4 mr-2" />
            Hapus Gambar
          </Button>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`${isEditMode ? 'opacity-60' : ''} border-2 border-dashed rounded-lg p-4`}
      >
        <Input
          id="image-upload"
          type="file"
          className="hidden"
          ref={inputRef}
          onChange={handleImageFileChange}
          disabled={currentImageUrl}
          accept="image/*" // 🔹 Hanya terima file gambar
        />
        {!imageFile ? (
          <Label
            htmlFor="image-upload"
            className={`${
              isEditMode ? 'cursor-not-allowed' : ''
            } flex flex-col items-center justify-center h-32 cursor-pointer`}
          >
            <UploadCloudIcon className="w-10 h-10 text-muted-foreground mb-2" />
            <span>Drag & drop or click to upload image</span>
          </Label>
        ) : imageLoadingState ? (
          <div className="flex items-center justify-center h-32">
            <Skeleton className="h-20 w-20 bg-gray-100" />
            <span className="ml-3">Uploading...</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileIcon className="w-8 text-primary mr-2 h-8" />
            </div>
            <p className="text-sm font-medium">{imageFile.name}</p>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleRemoveImage}
            >
              <XIcon className="w-4 h-4" />
              <span className="sr-only">Remove File</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductImageUpload;
