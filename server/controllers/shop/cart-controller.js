const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

// Fungsi helper untuk menghitung cartTotal
const calculateCartTotal = (items) => {
  return items.reduce((total, item) => {
    return total + (item.variant?.price || 0) * item.quantity;
  }, 0);
};

// Fungsi untuk memeriksa apakah string adalah ObjectId yang valid
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ===========================
// Add item to cart (guest or user)
// ===========================
const addToCart = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    let { userId, productId, quantity, variant } = req.body;

    // Validasi wajib
    if (!productId || quantity <= 0 || !variant || !variant.name || !variant.price) {
      return res.status(400).json({
        success: false,
        message: "Invalid data! productId, quantity, and variant (name, price) required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Validasi stok varian
    const productVariant = product.variants.find((v) => v.name === variant.name);
    if (!productVariant || productVariant.totalStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stok tidak mencukupi untuk varian ${variant.name}`,
      });
    }

    // Jika tidak ada userId (guest), generate sessionId
    let sessionId;
    if (!userId) {
      sessionId = `guest-${uuidv4()}`;
    }

    // Cari cart berdasarkan userId atau sessionId
    let cart = await Cart.findOne(userId ? { userId } : { sessionId });

    if (!cart) {
      cart = new Cart({
        userId: userId || undefined,
        sessionId: sessionId || undefined,
        items: [],
      });
    }

    // Cari apakah produk + varian sudah ada di cart
    const index = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.variant?.name === variant.name
    );

    if (index === -1) {
      // Tambah item baru
      cart.items.push({
        productId,
        quantity,
        variant,
      });
    } else {
      // Tambah quantity
      cart.items[index].quantity += quantity;
    }

    // Hitung cartTotal
    cart.cartTotal = calculateCartTotal(cart.items);
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
      userId: userId || null,
      sessionId: sessionId || cart.sessionId,
    });
  } catch (error) {
    console.error("AddToCart Error:", error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// ===========================
// Fetch cart items by userId / sessionId
// ===========================
const fetchCartItems = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "User ID or guest ID required!" });
    }

    const query = isValidObjectId(id) ? { userId: id } : { sessionId: id };
    const cart = await Cart.findOne(query).populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found!" });
    }

    // Filter item valid (produk masih ada)
    const validItems = cart.items.filter((item) => item.productId);

    if (validItems.length < cart.items.length) {
      cart.items = validItems;
      cart.cartTotal = calculateCartTotal(cart.items);
      await cart.save();
    }

    const populateCartItems = validItems.map((item) => ({
      productId: item.productId?._id || null,
      image: item.productId?.image || "/placeholder.png",
      title: item.productId?.title || "Produk tidak ditemukan",
      price: item.variant?.price || item.productId?.price || 0,
      salePrice: item.productId?.salePrice || null,
      quantity: item.quantity,
      variant: item.variant,
    }));

    res.status(200).json({
      success: true,
      data: { ...cart._doc, items: populateCartItems },
    });
  } catch (error) {
    console.error("FetchCart Error:", error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// ===========================
// Update cart item quantity
// ===========================
const updateCartItemQty = async (req, res) => {
  try {
    const { id, productId, variantName, quantity } = req.body;

    if (!id || !productId || !variantName || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data! id, productId, variantName, and quantity required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const productVariant = product.variants.find((v) => v.name === variantName);
    if (!productVariant || productVariant.totalStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stok tidak mencukupi untuk varian ${variantName}`,
      });
    }

    const query = isValidObjectId(id) ? { userId: id } : { sessionId: id };
    const cart = await Cart.findOne(query);

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found!" });
    }

    const index = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.variant?.name === variantName
    );
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Item not in cart!" });
    }

    cart.items[index].quantity = quantity;

    // Hitung ulang cartTotal
    cart.cartTotal = calculateCartTotal(cart.items);
    await cart.save();

    await cart.populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    const populateCartItems = cart.items.map((item) => ({
      productId: item.productId ? item.productId._id : null,
      image: item.productId ? item.productId.image : "/placeholder.png",
      title: item.productId ? item.productId.title : "Product not found",
      price: item.variant?.price || item.productId?.price || 0,
      salePrice: item.productId ? item.productId.salePrice : null,
      quantity: item.quantity,
      variant: item.variant,
    }));

    res.status(200).json({ success: true, data: { ...cart._doc, items: populateCartItems } });
  } catch (error) {
    console.error("UpdateCart Error:", error);
    res.status(500).json({ success: false, message: error.message || "Error" });
  }
};

// ===========================
// Delete item from cart
// ===========================
const deleteCartItem = async (req, res) => {
  try {
    const { userId, productId, variantName } = req.params;

    if (!userId || !productId || !variantName) {
      return res.status(400).json({
        success: false,
        message: "Invalid data! userId, productId, and variantName required",
      });
    }

    const query = isValidObjectId(userId) ? { userId } : { sessionId: userId };
    const cart = await Cart.findOne(query).populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found!" });
    }

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.productId._id.toString() === productId &&
          item.variant?.name === variantName
        )
    );

    // Hitung ulang cartTotal
    cart.cartTotal = calculateCartTotal(cart.items);
    await cart.save();

    const populateCartItems = cart.items.map((item) => ({
      productId: item.productId ? item.productId._id : null,
      image: item.productId ? item.productId.image : "/placeholder.png",
      title: item.productId ? item.productId.title : "Product not found",
      price: item.variant?.price || item.productId?.price || 0,
      salePrice: item.productId ? item.productId.salePrice : null,
      quantity: item.quantity,
      variant: item.variant,
    }));

    res.status(200).json({ success: true, data: { ...cart._doc, items: populateCartItems } });
  } catch (error) {
    console.error("DeleteCart Error:", error);
    res.status(500).json({ success: false, message: error.message || "Error" });
  }
};

module.exports = {
  addToCart,
  fetchCartItems,
  updateCartItemQty,
  deleteCartItem,
};