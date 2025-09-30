import { Bird } from 'lucide-react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-800">
      <Bird className="w-24 h-24 text-orange-500 mb-6" />
      <h1 className="text-6xl font-bold text-orange-500 mb-2">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Halaman Tidak Ditemukan</h2>
      <p className="text-center mb-8 max-w-sm">
        Oops! Sepertinya burung Anda tersesat. Halaman yang Anda cari tidak ada di sini.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition-colors duration-300"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}

export default NotFound;
