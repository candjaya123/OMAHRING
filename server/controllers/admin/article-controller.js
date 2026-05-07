const supabase = require("../../config/supabase");

const addArticle = async (req, res) => {
  try {
    const { title, content, excerpt, category, image, status, author_id } = req.body;

    const { data: newArticle, error } = await supabase
      .from('articles')
      .insert({
        title,
        content,
        excerpt,
        category,
        image,
        status: status || 'draft',
        author_id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { ...newArticle, _id: newArticle.id },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Gagal membuat artikel",
    });
  }
};

const fetchAllArticles = async (req, res) => {
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: articles.map(article => ({ ...article, _id: article.id })),
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar artikel",
    });
  }
};

const editArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, category, image, status } = req.body;

    const { data: updatedArticle, error } = await supabase
      .from('articles')
      .update({
        title,
        content,
        excerpt,
        category,
        image,
        status,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: { ...updatedArticle, _id: updatedArticle.id },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui artikel",
    });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Artikel berhasil dihapus",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus artikel",
    });
  }
};

module.exports = {
  addArticle,
  fetchAllArticles,
  editArticle,
  deleteArticle,
};
