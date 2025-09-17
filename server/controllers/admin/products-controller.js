// File: controllers/admin/products-controller.js

const Product = require("../../models/Product"); // Pastikan path model benar

// Fungsi untuk menambah produk baru (Diperbarui)
async function addProduct(req, res) {
  try {
    // 🔹 Ambil 'variants' sebagai array, bukan field terpisah
    const { title, description, category, brand, variants, image, averageReview } = req.body;

    // Validasi dasar
    if (!title || !description || !category || !variants || variants.length === 0 || !image) {
      return res.status(400).json({
        success: false,
        message: "Harap lengkapi semua field, termasuk gambar dan setidaknya satu varian.",
      });
    }

    const newProduct = new Product({
      title,
      description,
      category,
      brand,
      variants, // 🔹 Menyimpan seluruh array variants
      image,
      averageReview,
    });

    const savedProduct = await newProduct.save();

    return res.status(201).json({
      success: true,
      message: "Produk berhasil ditambahkan.",
      data: savedProduct,
    });
  } catch (error) {
    console.error("Error saat menambah produk:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}

// Fungsi untuk mengedit produk (Diperbarui)
async function editProduct(req, res) {
  try {
    const { id } = req.params;
    // 🔹 Ambil semua data baru, termasuk 'variants'
    const updatedData = req.body; 

    // Temukan dan perbarui produk dengan data baru secara langsung
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updatedData,
      { new: true } // Opsi ini mengembalikan dokumen yang sudah diperbarui
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Produk berhasil diperbarui.",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error saat mengedit produk:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}

// Fungsi lain (fetch, delete, handleImageUpload) tetap sama
const { imageUploadUtil } = require("../../helpers/cloudinary");

const handleImageUpload = async (req, res) => {
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const url = "data:" + req.file.mimetype + ";base64," + b64;
    const result = await imageUploadUtil(url);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error occured" });
  }
};

const fetchAllProducts = async (req, res) => {
  try {
    const listOfProducts = await Product.find({});
    res.status(200).json({ success: true, data: listOfProducts });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error occured" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, message: "Product delete successfully" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error occured" });
  }
};


module.exports = {
  handleImageUpload,
  addProduct,
  fetchAllProducts,
  editProduct,
  deleteProduct,
};