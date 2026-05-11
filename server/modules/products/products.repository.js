const supabase = require('../../config/supabase');

class ProductsRepository {
  async findAll(filters = {}) {
    let query = supabase
      .from('products')
      .select(`
        *,
        product_variants (*),
        product_images (*)
      `)
      .is('deleted_at', null);

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.category) {
      query = query.contains('category', [filters.category]);
    }

    const { data, error } = await query.order(filters.sortBy || 'created_at', { ascending: filters.ascending === 'true' });
    if (error) throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants (*),
        product_images (*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(productData) {
    const { data, error } = await supabase
      .from('products')
      .insert({
        title: productData.title,
        description: productData.description,
        order_template: productData.order_template,
        is_active: productData.is_active !== undefined ? productData.is_active : true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id, productData) {
    const { data, error } = await supabase
      .from('products')
      .update({
        title: productData.title,
        description: productData.description,
        order_template: productData.order_template,
        is_active: productData.is_active,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async softDelete(id) {
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date() })
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // --- Variants ---
  async upsertVariants(productId, variants) {
    // Delete existing variants and insert new ones
    await supabase.from('product_variants').delete().eq('product_id', productId);
    
    const { data, error } = await supabase
      .from('product_variants')
      .insert(variants.map(v => ({ ...v, product_id: productId })))
      .select();

    if (error) throw error;
    return data;
  }

  async updateVariantStock(variantId, quantityChange) {
    // Using RPC for atomic stock update
    const { error } = await supabase.rpc('update_variant_stock', { 
      variant_id_param: variantId, 
      quantity_change_param: quantityChange 
    });
    
    if (error) throw error;
    return true;
  }

  // --- Images ---
  async upsertImages(productId, images) {
    await supabase.from('product_images').delete().eq('product_id', productId);

    const { data, error } = await supabase
      .from('product_images')
      .insert(images.map(img => ({ ...img, product_id: productId })))
      .select();

    if (error) throw error;
    return data;
  }
}

module.exports = new ProductsRepository();
