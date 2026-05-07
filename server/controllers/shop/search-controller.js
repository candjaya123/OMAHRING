const supabase = require("../../config/supabase");

const searchProducts = async (req, res) => {
  try {
    const { keyword } = req.params;
    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({
        succes: false,
        message: "Keyword is required and must be in string format",
      });
    }

    const { data: searchResults, error } = await supabase
      .from('products')
      .select('*')
      .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,category.cs.["${keyword}"],attributes->>brand.ilike.%${keyword}%`);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: searchResults.map(p => ({ ...p, _id: p.id })),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

module.exports = { searchProducts };
