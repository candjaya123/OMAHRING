import { Bird, Mail, Phone, Instagram, Twitter, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

// Footer links aligned with ShoppingHome categories
const footerLinks = [
  { id: "home", label: "Beranda", path: "/shop/home" },
  { id: "burung", label: "Burung", path: "/shop/listing" },
  { id: "kandang", label: "Kandang", path: "/shop/listing" },
  { id: "pakan", label: "Pakan", path: "/shop/listing" },
  { id: "ring", label: "Ring Burung", path: "/shop/listing" },
  { id: "aksesoris", label: "Aksesoris", path: "/shop/listing" },
];

function ShoppingFooter() {
  const navigate = useNavigate();

  function handleNavigateToListingPage(getCurrentItem) {
    sessionStorage.removeItem("filters");
    const currentFilter =
      getCurrentItem.id !== "home"
        ? { category: [getCurrentItem.id] }
        : null;
    sessionStorage.setItem("filters", JSON.stringify(currentFilter));
    navigate(getCurrentItem.path);
  }

  return (
    <footer className="bg-gradient-to-t from-gray-900 to-gray-800 text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start">
            <Link to="/shop/home" className="flex items-center gap-2 mb-4">
              <Bird className="h-8 w-8 text-orange-500" />
              <span className="text-2xl font-bold text-white">Toko Burung</span>
            </Link>
            <p className="text-gray-300 text-sm max-w-xs text-center md:text-left">
              Omahring dan Toko Burung menyediakan produk berkualitas untuk
              pecinta burung, dari ring premium hingga kandang inovatif.
            </p>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 text-center md:text-left">
              Tautan Cepat
            </h3>
            <ul className="space-y-2 text-center md:text-left">
              {footerLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => handleNavigateToListingPage(link)}
                    className="text-gray-300 hover:text-orange-500 transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact and Social Media Section */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 text-center md:text-left">
              Kontak Kami
            </h3>
            <ul className="space-y-2 text-center md:text-left">
              <li className="flex items-center justify-center md:justify-start gap-2 text-gray-300 text-sm">
                <Mail className="h-5 w-5 text-orange-500" />
                <a
                  href="mailto:info@tokoburung.id"
                  className="hover:text-orange-500 transition-colors duration-300"
                >
                  info@tokoburung.id
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2 text-gray-300 text-sm">
                <Phone className="h-5 w-5 text-orange-500" />
                <a
                  href="tel:+6281234567890"
                  className="hover:text-orange-500 transition-colors duration-300"
                >
                  +62 812-3456-7890
                </a>
              </li>
            </ul>
            <div className="flex justify-center md:justify-start gap-4 mt-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-orange-500 transition-colors duration-300"
              >
                <Instagram className="h-6 w-6" />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-orange-500 transition-colors duration-300"
              >
                <Twitter className="h-6 w-6" />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-orange-500 transition-colors duration-300"
              >
                <Facebook className="h-6 w-6" />
                <span className="sr-only">Facebook</span>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Toko Burung. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default ShoppingFooter;