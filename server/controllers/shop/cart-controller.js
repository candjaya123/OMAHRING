const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const calculateCartTotal = (items) => {
  return items.reduce((total, item) => {
    const itemPrice =
      item.variant?.salePrice > 0 ? item.variant.salePrice : item.variant?.price || 0;
    return total + itemPrice * item.quantity;
  }, 0);
};

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const addToCart = async (req, res) => {
  try {
    let { userId, sessionId, productId, quantity, variant } = req.body;

    if (
      (!userId && !sessionId) ||
      !productId ||
      !quantity ||
      quantity <= 0 ||
      !variant ||
      !variant.name
    ) {
      return res.status(400).json({
        success: false,
        message: 'Data input tidak valid. productId, quantity, dan variant wajib diisi.',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
    }

    const productVariant = product.variants.find((v) => v.name === variant.name);
    if (!productVariant) {
      return res.status(400).json({
        success: false,
        message: `Varian ${variant.name} tidak ditemukan pada produk ini.`,
      });
    }

    if (productVariant.totalStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stok untuk varian ${variant.name} tidak mencukupi. Sisa stok: ${productVariant.totalStock}.`,
      });
    }

    let cart;
    if (userId) {
      cart = await Cart.findOne({ userId });
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart) {
      if (!userId && !sessionId) {
        sessionId = `guest_${uuidv4()}`;
      }

      cart = new Cart({
        userId: userId || null,
        sessionId: sessionId || null,
        items: [],
      });
    }

    const cartVariant = {
      name: productVariant.name,
      price: productVariant.price,
      salePrice: productVariant.salePrice || 0,
      totalStock: productVariant.totalStock,
    };

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.variant.name === variant.name
    );

    if (existingItemIndex > -1) {
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;

      if (productVariant.totalStock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Total kuantitas di keranjang (${newQuantity}) akan melebihi stok (${productVariant.totalStock}).`,
        });
      }

      existingItem.quantity = newQuantity;
      existingItem.variant = cartVariant;
    } else {
      cart.items.push({
        productId,
        quantity,
        variant: cartVariant,
      });
    }

    cart.cartTotal = calculateCartTotal(cart.items);
    await cart.save();

    await cart.populate({
      path: 'items.productId',
      select: 'image title description category brand',
    });

    res.status(200).json({
      success: true,
      message: 'Item berhasil ditambahkan ke keranjang!',
      data: {
        ...cart.toObject(),
        sessionId: cart.sessionId || null,
      },
    });
  } catch (error) {
    console.error('AddToCart Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server: ' + error.message,
    });
  }
};

const fetchCartItems = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID atau Session ID diperlukan!',
      });
    }

    const query = isValidObjectId(id) ? { userId: id } : { sessionId: id };
    const cart = await Cart.findOne(query).populate({
      path: 'items.productId',
      select: 'image title description category brand variants',
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { items: [], cartTotal: 0 },
      });
    }

    const validItems = cart.items.filter((item) => item.productId);

    if (validItems.length < cart.items.length) {
      cart.items = validItems;
      cart.cartTotal = calculateCartTotal(cart.items);
      await cart.save();
    }

    const populateCartItems = validItems.map((item) => ({
      productId: item.productId._id,
      image: item.productId.image,
      title: item.productId.title,
      category: item.productId.category,
      quantity: item.quantity,
      variant: item.variant,
    }));

    res.status(200).json({
      success: true,
      data: {
        items: populateCartItems,
        cartTotal: cart.cartTotal,
        _id: cart._id,
      },
    });
  } catch (error) {
    console.error('FetchCart Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server: ' + error.message,
    });
  }
};

const updateCartItemQty = async (req, res) => {
  try {
    const { userId, sessionId, productId, variantName, quantity } = req.body;

    if ((!userId && !sessionId) || !productId || !variantName || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message:
          'Data tidak valid! userId, sessionId, productId, variantName, dan quantity diperlukan',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan',
      });
    }

    const productVariant = product.variants.find((v) => v.name === variantName);
    if (!productVariant) {
      return res.status(400).json({
        success: false,
        message: `Varian ${variantName} tidak ditemukan`,
      });
    }

    const query = userId ? { userId } : { sessionId };
    const cart = await Cart.findOne(query);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Keranjang tidak ditemukan!',
      });
    }

    // Update item
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.variant?.name === variantName
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan di keranjang!',
      });
    }

    const currentQuantity = cart.items[itemIndex].quantity;
    if (quantity > currentQuantity) {
      if (quantity > productVariant.totalStock) {
        return res.status(400).json({
          success: false,
          message: `Stok tidak mencukupi untuk varian ${variantName}. Sisa stok: ${productVariant.totalStock}`,
        });
      }
    }
    cart.items[itemIndex].quantity = quantity;

    cart.cartTotal = calculateCartTotal(cart.items);
    await cart.save();

    // Populate dan return
    await cart.populate({
      path: 'items.productId',
      select: 'image title description category brand',
    });

    const populateCartItems = cart.items.map((item) => ({
      productId: item.productId._id,
      image: item.productId.image,
      title: item.productId.title,
      category: item.productId.category,
      quantity: item.quantity,
      variant: item.variant,
    }));

    res.status(200).json({
      success: true,
      data: {
        items: populateCartItems,
        cartTotal: cart.cartTotal,
        _id: cart._id,
      },
    });
  } catch (error) {
    console.error('UpdateCart Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server: ' + error.message,
    });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const { id, productId, variantName } = req.params;

    if (!id || !productId || !variantName) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak valid! id, productId, dan variantName diperlukan',
      });
    }

    const query = isValidObjectId(id) ? { userId: id } : { sessionId: id };
    const cart = await Cart.findOne(query);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Keranjang tidak ditemukan!',
      });
    }

    // Hapus item
    cart.items = cart.items.filter(
      (item) => !(item.productId.toString() === productId && item.variant?.name === variantName)
    );

    cart.cartTotal = calculateCartTotal(cart.items);
    await cart.save();

    // Populate dan return
    await cart.populate({
      path: 'items.productId',
      select: 'image title description category brand',
    });

    const populateCartItems = cart.items.map((item) => ({
      productId: item.productId._id,
      image: item.productId.image,
      title: item.productId.title,
      category: item.productId.category,
      quantity: item.quantity,
      variant: item.variant,
    }));

    res.status(200).json({
      success: true,
      data: {
        items: populateCartItems,
        cartTotal: cart.cartTotal,
        _id: cart._id,
      },
    });
  } catch (error) {
    console.error('DeleteCart Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server: ' + error.message,
    });
  }
};

const mergeCart = async (req, res) => {
  const { userId, sessionId, action } = req.body;

  try {
    const guestCart = await Cart.findOne({ sessionId });
    const userCart = await Cart.findOne({ userId });

    if (!guestCart) {
      return res.status(404).json({ message: 'Guest cart tidak ditemukan.' });
    }

    if (!userCart) {
      guestCart.userId = userId;
      guestCart.sessionId = null;
      await guestCart.save();
      return res.json({ message: 'Cart berhasil dipindahkan ke akun user.', cart: guestCart });
    }

    if (action === 'replace') {
      await Cart.deleteOne({ sessionId });
      return res.json({ message: 'Guest cart dibuang, tetap pakai cart user.', cart: userCart });
    }

    const mergedItems = [...userCart.items];

    for (const guestItem of guestCart.items) {
      const existingIndex = mergedItems.findIndex(
        (item) =>
          item.productId.toString() === guestItem.productId.toString() &&
          item.variant.name === guestItem.variant.name
      );

      if (existingIndex > -1) {
        const totalQuantity = mergedItems[existingIndex].quantity + guestItem.quantity;

        const product = await Product.findById(guestItem.productId);
        const stock =
          product.variants.find((v) => v.name === guestItem.variant.name)?.totalStock || 0;

        // mergedItems[existingIndex].quantity = Math.min(totalQuantity, stock);
        // tambahkan semua meskipun lebih dari stok
        mergedItems[existingIndex].quantity = totalQuantity;
      } else {
        const product = await Product.findById(guestItem.productId);
        const stock =
          product.variants.find((v) => v.name === guestItem.variant.name)?.totalStock || 0;

        if (guestItem.quantity <= stock && stock > 0) {
          mergedItems.push(guestItem);
        }
      }
    }

    userCart.items = mergedItems;

    userCart.cartTotal = mergedItems.reduce(
      (sum, item) => sum + item.quantity * (item.variant.salePrice || item.variant.price),
      0
    );
    userCart.sessionId = null;
    await userCart.save();

    await Cart.deleteOne({ sessionId });

    return res.json({
      message: 'Cart berhasil digabungkan.',
      cart: userCart,
    });
  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat merge cart.', error });
  }
};

module.exports = {
  addToCart,
  fetchCartItems,
  updateCartItemQty,
  deleteCartItem,
  mergeCart,
};
