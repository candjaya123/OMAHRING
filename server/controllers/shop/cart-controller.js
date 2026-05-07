const supabase = require('../../config/supabase');
const { v4: uuidv4 } = require('uuid');

const calculateCartTotal = (items) => {
  return items.reduce((total, item) => {
    const itemPrice =
      item.variant?.salePrice > 0 ? item.variant.salePrice : item.variant?.price || 0;
    return total + itemPrice * item.quantity;
  }, 0);
};

const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
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

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
    }

    const productVariant = (product.variants || []).find(
      (v) => v.name === variant.name || (v.combination && v.combination.join(' - ') === variant.name)
    );
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
    const cartQuery = userId ? supabase.from('carts').select('*').eq('user_id', userId) : supabase.from('carts').select('*').eq('sessionId', sessionId);
    const { data: existingCart, error: cartError } = await cartQuery.maybeSingle();

    if (cartError) throw cartError;
    cart = existingCart;

    if (!cart) {
      if (!userId && !sessionId) {
        sessionId = `guest_${uuidv4()}`;
      }

      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({
          user_id: userId || null,
          sessionId: sessionId || null,
          items: [],
          carttotal: 0
        })
        .select()
        .single();
      
      if (createError) throw createError;
      cart = newCart;
    }

    const cartVariant = {
      name: variant.name, // Use the name from request to ensure consistency
      price: productVariant.price,
      salePrice: productVariant.salePrice || 0,
      totalStock: productVariant.totalStock,
    };

    const updatedItems = [...(cart.items || [])];
    const existingItemIndex = updatedItems.findIndex(
      (item) => item.productId === productId && item.variant.name === variant.name
    );

    if (existingItemIndex > -1) {
      const existingItem = updatedItems[existingItemIndex];
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
      updatedItems.push({
        productId,
        quantity,
        variant: cartVariant,
      });
    }

    const cartTotal = calculateCartTotal(updatedItems);
    const { data: savedCart, error: updateError } = await supabase
      .from('carts')
      .update({ items: updatedItems, carttotal: cartTotal })
      .eq('id', cart.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Manual population for response
    const populatedItems = await Promise.all(savedCart.items.map(async (item) => {
        const { data: p } = await supabase.from('products').select('media, title, description, category, attributes, shipping').eq('id', item.productId).maybeSingle();
        return { ...item, productId: p ? { ...p, _id: item.productId } : { title: 'Product Removed', _id: item.productId } };
    }));

    res.status(200).json({
      success: true,
      message: 'Item berhasil ditambahkan ke keranjang!',
      data: {
        ...savedCart,
        _id: savedCart.id,
        items: populatedItems,
        sessionId: savedCart.sessionId || null,
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

    const cartQuery = isValidUUID(id) ? supabase.from('carts').select('*').eq('user_id', id) : supabase.from('carts').select('*').eq('sessionId', id);
    const { data: cart, error: cartError } = await cartQuery.maybeSingle();

    if (cartError) throw cartError;

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { items: [], cartTotal: 0 },
      });
    }

    // Manual population
    const populatedItems = await Promise.all(cart.items.map(async (item) => {
        const { data: p } = await supabase.from('products').select('media, title, description, category, attributes, variants, shipping').eq('id', item.productId).maybeSingle();
        return { ...item, productId: p ? { ...p, _id: item.productId } : null };
    }));

    const validItems = populatedItems.filter((item) => item.productId);

    if (validItems.length < cart.items.length) {
      const filteredItems = validItems.map(vi => ({ productId: vi.productId._id, quantity: vi.quantity, variant: vi.variant }));
      const cartTotal = calculateCartTotal(filteredItems);
      await supabase.from('carts').update({ items: filteredItems, carttotal: cartTotal }).eq('id', cart.id);
    }

    const responseItems = validItems.map((item) => ({
      productId: item.productId?._id,
      image: item.productId?.media?.images?.[0] || '',
      title: item.productId?.title,
      category: item.productId?.category,
      quantity: item.quantity,
      variant: item.variant,
      shipping: item.productId?.shipping, // 🔹 Sertakan data shipping (originCityId)
    }));

    res.status(200).json({
      success: true,
      data: {
        items: responseItems,
        cartTotal: cart.carttotal || 0,
        _id: cart.id,
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

    const { data: product, error: pError } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
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

    const cartQuery = userId ? supabase.from('carts').select('*').eq('user_id', userId) : supabase.from('carts').select('*').eq('sessionId', sessionId);
    const { data: cart, error: cError } = await cartQuery.maybeSingle();

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Keranjang tidak ditemukan!',
      });
    }

    const updatedItems = [...cart.items];
    const itemIndex = updatedItems.findIndex(
      (item) => item.productId === productId && item.variant?.name === variantName
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan di keranjang!',
      });
    }

    const currentQuantity = updatedItems[itemIndex].quantity;
    if (quantity > currentQuantity) {
      if (quantity > productVariant.totalStock) {
        return res.status(400).json({
          success: false,
          message: `Stok tidak mencukupi untuk varian ${variantName}. Sisa stok: ${productVariant.totalStock}`,
        });
      }
    }
    updatedItems[itemIndex].quantity = quantity;

    const cartTotal = calculateCartTotal(updatedItems);
    const { data: savedCart, error: uError } = await supabase
      .from('carts')
      .update({ items: updatedItems, carttotal: cartTotal })
      .eq('id', cart.id)
      .select()
      .single();

    if (uError) throw uError;

    // Populate
    const responseItems = await Promise.all(savedCart.items.map(async (item) => {
        const { data: p } = await supabase.from('products').select('media, title, description, category, attributes').eq('id', item.productId).maybeSingle();
        return {
          productId: item.productId,
          image: p?.media?.images?.[0] || '',
          title: p?.title || 'Unknown Product',
          category: p?.category || [],
          quantity: item.quantity,
          variant: item.variant,
          shipping: p?.shipping, // 🔹 Sertakan shipping
        };
    }));

    res.status(200).json({
      success: true,
      data: {
        items: responseItems,
        cartTotal: savedCart.carttotal || 0,
        _id: savedCart.id,
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

    const cartQuery = isValidUUID(id) ? supabase.from('carts').select('*').eq('user_id', id) : supabase.from('carts').select('*').eq('sessionId', id);
    const { data: cart, error: cError } = await cartQuery.maybeSingle();

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Keranjang tidak ditemukan!',
      });
    }

    const updatedItems = cart.items.filter(
      (item) => !(item.productId === productId && item.variant?.name === variantName)
    );

    const cartTotal = calculateCartTotal(updatedItems);
    const { data: savedCart, error: suError } = await supabase
      .from('carts')
      .update({ items: updatedItems, carttotal: cartTotal })
      .eq('id', cart.id)
      .select()
      .single();

    if (suError) throw suError;

    // Populate
    const responseItems = await Promise.all(savedCart.items.map(async (item) => {
        const { data: p } = await supabase.from('products').select('media, title, description, category, attributes').eq('id', item.productId).maybeSingle();
        return {
          productId: item.productId,
          image: p?.media?.images?.[0] || '',
          title: p?.title || 'Unknown Product',
          category: p?.category || [],
          quantity: item.quantity,
          variant: item.variant,
        };
    }));

    res.status(200).json({
      success: true,
      data: {
        items: responseItems,
        cartTotal: savedCart.carttotal || 0,
        _id: savedCart.id,
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
    const { data: guestCart } = await supabase.from('carts').select('*').eq('sessionId', sessionId).maybeSingle();
    const { data: userCart } = await supabase.from('carts').select('*').eq('user_id', userId).maybeSingle();

    if (!guestCart) {
      return res.status(404).json({ message: 'Guest cart tidak ditemukan.' });
    }

    if (!userCart) {
      const { data: updatedCart, error } = await supabase
        .from('carts')
        .update({ user_id: userId, sessionId: null })
        .eq('id', guestCart.id)
        .select()
        .single();
      
      if (error) throw error;
      return res.json({ message: 'Cart berhasil dipindahkan ke akun user.', cart: { ...updatedCart, _id: updatedCart.id } });
    }

    if (action === 'replace') {
      await supabase.from('carts').delete().eq('id', guestCart.id);
      return res.json({ message: 'Guest cart dibuang, tetap pakai cart user.', cart: { ...userCart, _id: userCart.id } });
    }

    const mergedItems = [...(userCart.items || [])];

    for (const guestItem of (guestCart.items || [])) {
      const existingIndex = mergedItems.findIndex(
        (item) =>
          item.productId === guestItem.productId &&
          item.variant.name === guestItem.variant.name
      );

      if (existingIndex > -1) {
        mergedItems[existingIndex].quantity += guestItem.quantity;
      } else {
        const { data: product } = await supabase.from('products').select('variants').eq('id', guestItem.productId).maybeSingle();
        const stock = product?.variants?.find((v) => v.name === guestItem.variant.name)?.totalStock || 0;

        if (guestItem.quantity <= stock && stock > 0) {
          mergedItems.push(guestItem);
        }
      }
    }

    const cartTotal = calculateCartTotal(mergedItems);
    const { data: finalCart, error: mergeError } = await supabase
      .from('carts')
      .update({ items: mergedItems, carttotal: cartTotal, sessionId: null })
      .eq('id', userCart.id)
      .select()
      .single();

    if (mergeError) throw mergeError;

    await supabase.from('carts').delete().eq('id', guestCart.id);

    return res.json({
      message: 'Cart berhasil digabungkan.',
      cart: { ...finalCart, _id: finalCart.id },
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
