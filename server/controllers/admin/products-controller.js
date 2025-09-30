const Product = require('../../models/Product');
const { imageUploadUtil } = require('../../helpers/cloudinary');

const handleImageUpload = async (req, res) => {
  try {
    // Validasi file ada
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const url = 'data:' + req.file.mimetype + ';base64,' + b64;
    const result = await imageUploadUtil(url);

    res.json({
      success: true,
      result: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
      },
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Image upload failed: ' + error.message,
    });
  }
};

const addProduct = async (req, res) => {
  try {
    const { title, description, category, brand, variants, image, averageReview } = req.body;

    // Validasi dasar
    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nama produk wajib diisi.',
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Deskripsi produk wajib diisi.',
      });
    }

    if (!category?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Kategori produk wajib diisi.',
      });
    }

    if (!image?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Gambar produk wajib diupload.',
      });
    }

    if (!variants || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Produk harus memiliki setidaknya satu varian.',
      });
    }

    let processedVariants;
    try {
      processedVariants = processVariants(variants);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    for (let i = 0; i < processedVariants.length; i++) {
      if (!processedVariants[i].name.trim()) {
        return res.status(400).json({
          success: false,
          message: `Nama varian #${i + 1} wajib diisi.`,
        });
      }
    }

    const processedAverageReview = convertAndValidateNumber(averageReview, 'Average review', 0);
    if (processedAverageReview > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating rata-rata tidak boleh lebih dari 5.',
      });
    }

    const newProduct = new Product({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      brand: brand?.trim() || '',
      variants: processedVariants, // 🔹 Gunakan variants yang sudah diproses
      image,
      averageReview: processedAverageReview,
    });

    const savedProduct = await newProduct.save();

    return res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan.',
      data: savedProduct,
    });
  } catch (error) {
    console.error('Error saat menambah produk:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal: ' + messages.join(', '),
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server: ' + error.message,
    });
  }
};

const editProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedData = { ...req.body };

    if (updatedData.variants && Array.isArray(updatedData.variants)) {
      try {
        updatedData.variants = processVariants(updatedData.variants);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    if (updatedData.averageReview !== undefined) {
      try {
        updatedData.averageReview = convertAndValidateNumber(
          updatedData.averageReview,
          'Average review',
          0
        );
        if (updatedData.averageReview > 5) {
          return res.status(400).json({
            success: false,
            message: 'Rating rata-rata tidak boleh lebih dari 5.',
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Produk berhasil diperbarui.',
      data: updatedProduct,
    });
  } catch (error) {
    console.error('Error saat mengedit produk:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal: ' + messages.join(', '),
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server: ' + error.message,
    });
  }
};

const fetchAllProducts = async (req, res) => {
  try {
    const listOfProducts = await Product.find({}).sort({ createdAt: -1 }); // Sort by newest first
    res.status(200).json({
      success: true,
      data: listOfProducts,
      count: listOfProducts.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data produk: ' + error.message,
    });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data produk: ' + error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validasi ID MongoD

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Produk berhasil dihapus.',
      data: { deletedId: id },
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus produk: ' + error.message,
    });
  }
};

const convertAndValidateNumber = (value, fieldName, minValue = 0) => {
  if (value === undefined || value === null || value === '') {
    return minValue;
  }

  const converted = Number(value);
  if (isNaN(converted)) {
    throw new Error(`${fieldName} harus berupa angka yang valid.`);
  }
  if (converted < minValue) {
    throw new Error(`${fieldName} tidak boleh negatif.`);
  }

  return converted;
};

const processVariants = (variants) => {
  if (!Array.isArray(variants)) {
    throw new Error('Variants harus berupa array.');
  }

  return variants.map((variant, index) => {
    try {
      return {
        name: variant.name?.trim() || '',
        price: convertAndValidateNumber(variant.price, `Harga varian #${index + 1}`),
        salePrice: convertAndValidateNumber(
          variant.salePrice,
          `Harga diskon varian #${index + 1}`,
          0
        ),
        totalStock: convertAndValidateNumber(variant.totalStock, `Stok varian #${index + 1}`),
      };
    } catch (error) {
      throw new Error(error.message);
    }
  });
};

module.exports = {
  handleImageUpload,
  addProduct,
  fetchAllProducts,
  getProductById,
  editProduct,
  deleteProduct,
};
