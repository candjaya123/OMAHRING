const supabase = require('../../config/supabase');
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
    const {
      title,
      description,
      media,
      category,
      attributes,
      variationOptions,
      variants,
      shipping,
      orderTemplate,
      averageReview,
    } = req.body;

    // Validasi dasar
    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nama produk wajib diisi.',
      });
    }

    if (!category || !Array.isArray(category) || category.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Kategori produk wajib diisi.',
      });
    }

    if (!media || !media.images || media.images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimal satu gambar produk wajib diupload.',
      });
    }

    const { data: savedProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        title: title.trim(),
        description,
        media,
        category,
        attributes,
        variationOptions,
        variants,
        shipping,
        orderTemplate,
        averageReview: convertAndValidateNumber(averageReview, 'Average review', 0),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan.',
      data: { ...savedProduct, _id: savedProduct.id },
    });
  } catch (error) {
    console.error('Error saat menambah produk:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server: ' + error.message,
    });
  }
};

const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Produk berhasil diperbarui.',
      data: { ...updatedProduct, _id: updatedProduct.id },
    });
  } catch (error) {
    console.error('Error saat mengedit produk:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server: ' + error.message,
    });
  }
};

const fetchAllProducts = async (req, res) => {
  try {
    const { data: listOfProducts, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;
    res.status(200).json({
      success: true,
      data: listOfProducts.map(p => ({ ...p, _id: p.id })),
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
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      data: { ...product, _id: product.id },
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

    const { data: product, error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();

    if (deleteError) throw deleteError;

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
