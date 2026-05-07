const supabase = require("../../config/supabase");

const getFilteredProducts = async (req, res) => {
  try {
    const { category = "", brand = "", sortBy = "price-lowtohigh" } = req.query;

    let query = supabase.from('products').select('*');

    if (category) {
      const categoryList = category.split(",");
      const orQuery = categoryList.map(cat => `category.cs.[${JSON.stringify(cat)}]`).join(",");
      query = query.or(orQuery);
    }

    if (brand) {
      const brandList = brand.split(",");
      // Filtering deep in attributes JSONB
      query = query.filter('attributes->>brand', 'in', `(${brandList.join(',')})`);
    }

    switch (sortBy) {
      case "price-lowtohigh":
        // Sorting by price inside JSONB variants (assuming first variant price)
        query = query.order('variants->0->>price', { ascending: true });
        break;
      case "price-hightolow":
        query = query.order('variants->0->>price', { ascending: false });
        break;
      case "title-atoz":
        query = query.order('title', { ascending: true });
        break;
      case "title-ztoa":
        query = query.order('title', { ascending: false });
        break;
      default:
        query = query.order('variants->0->>price', { ascending: true });
        break;
    }

    const { data: products, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    res.status(200).json({
      success: true,
      data: products.map(p => ({ ...p, _id: p.id })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });

    res.status(200).json({
      success: true,
      data: { ...product, _id: product.id },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};

module.exports = { getFilteredProducts, getProductDetails };
