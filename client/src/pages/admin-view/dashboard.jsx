import ProductImageUpload from "@/components/admin-view/image-upload";
import { Button } from "@/components/ui/button";
import { addFeatureImage, getFeatureImages } from "@/store/common-slice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DollarSign, ShoppingCart, Users, Trash2 } from "lucide-react";

// =================================================================
// Kartu Statistik dengan Aksen Oranye
// =================================================================
const StatCard = ({ title, value, icon, change }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
    <div className="flex justify-between items-start">
      <div className="flex flex-col">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      {/* Latar belakang ikon diubah menjadi oranye */}
      <div className="bg-orange-100 p-3 rounded-lg">
        {icon}
      </div>
    </div>
    <p className="text-xs text-gray-400 mt-4">{change}</p>
  </div>
);

// =================================================================
// Placeholder Grafik Penjualan dengan Aksen Oranye
// =================================================================
const SalesChart = () => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <h3 className="font-bold text-gray-800 text-lg mb-4">Analitik Penjualan</h3>
    <div className="h-64 flex items-end justify-between gap-2">
      {/* Warna bar diubah menjadi oranye */}
      <div className="w-1/6 bg-orange-200 rounded-t-lg" style={{ height: "40%" }}></div>
      <div className="w-1/6 bg-orange-200 rounded-t-lg" style={{ height: "60%" }}></div>
      <div className="w-1/6 bg-orange-300 rounded-t-lg" style={{ height: "80%" }}></div>
      <div className="w-1/6 bg-orange-200 rounded-t-lg" style={{ height: "50%" }}></div>
      <div className="w-1/6 bg-orange-200 rounded-t-lg" style={{ height: "70%" }}></div>
      <div className="w-1/6 bg-orange-300 rounded-t-lg" style={{ height: "90%" }}></div>
    </div>
  </div>
);

// =================================================================
// AdminDashboard Component
// =================================================================
function AdminDashboard() {
  const [imageFile, setImageFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [imageLoadingState, setImageLoadingState] = useState(false);
  const dispatch = useDispatch();
  const { featureImageList } = useSelector((state) => state.commonFeature);
  const { user } = useSelector((state) => state.auth);

  function handleUploadFeatureImage() {
    if (!uploadedImageUrl) return;
    dispatch(addFeatureImage(uploadedImageUrl)).then((data) => {
      if (data?.payload?.success) {
        dispatch(getFeatureImages());
        setImageFile(null);
        setUploadedImageUrl("");
      }
    });
  }

  function handleDeleteFeatureImage(imageId) {
    console.log("Menghapus gambar dengan ID:", imageId);
    // dispatch(deleteFeatureImage(imageId)).then(() => dispatch(getFeatureImages()));
  }

  useEffect(() => {
    dispatch(getFeatureImages());
  }, [dispatch]);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {/* Nama pengguna diberi warna oranye */}
            Halo, <span className="text-orange-600">{user?.userName || "Admin"}</span> 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Selamat datang kembali di dasbor omahring!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Penjualan"
                value="Rp 120jt"
                icon={<DollarSign className="w-5 h-5 text-orange-600" />}
                change="+20.1% dari bulan lalu"
              />
              <StatCard
                title="Pesanan Baru"
                value="350"
                icon={<ShoppingCart className="w-5 h-5 text-orange-600" />}
                change="+15 dari kemarin"
              />
              <StatCard
                title="Pelanggan"
                value="1,200"
                icon={<Users className="w-5 h-5 text-orange-600" />}
                change="+50 bulan ini"
              />
            </div>
            <SalesChart />
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-800 text-lg mb-4">Galeri Gambar Unggulan</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featureImageList && featureImageList.length > 0 ? (
                  featureImageList.map((img) => (
                    <div key={img._id} className="relative group aspect-square">
                      <img
                        src={img.image}
                        alt="Feature"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center rounded-lg">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteFeatureImage(img._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-center text-gray-500">
                    Belum ada gambar unggulan.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-800 text-lg mb-1">Unggah Gambar Baru</h3>
              <p className="text-sm text-gray-500 mb-4">Tambahkan gambar untuk halaman utama.</p>
              <ProductImageUpload
                imageFile={imageFile}
                setImageFile={setImageFile}
                uploadedImageUrl={uploadedImageUrl}
                setUploadedImageUrl={setUploadedImageUrl}
                setImageLoadingState={setImageLoadingState}
                imageLoadingState={imageLoadingState}
              />
              {/* Tombol utama diubah menjadi oranye */}
              <Button
                onClick={handleUploadFeatureImage}
                className="mt-4 w-full bg-gray-800 hover:bg-orange-600 text-white"
                disabled={!uploadedImageUrl || imageLoadingState}
              >
                {imageLoadingState ? "Mengunggah..." : "Unggah Gambar"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;