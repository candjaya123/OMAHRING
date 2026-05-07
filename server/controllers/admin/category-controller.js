const supabase = require("../../config/supabase");

const addCategory = async (req, res) => {
  try {
    const { id, label } = req.body;

    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({ id, label })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: newCategory,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Gagal menambah kategori",
    });
  }
};

const fetchAllCategories = async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('label', { ascending: true });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar kategori",
    });
  }
};

module.exports = {
  addCategory,
  fetchAllCategories,
};
