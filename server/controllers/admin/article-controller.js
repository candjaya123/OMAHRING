const supabase = require("../../config/supabase");

const addArticle = async (req, res) => {
  try {
    const { title, content, excerpt, category, image, status } = req.body;

    const { data: newArticle, error } = await supabase
      .from('articles')
      .insert({
        title,
        content,
        excerpt,
        category,
        image,
        status: status || 'draft',
        author_id: req.user.id,
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

    // Verify ownership for members
    if (req.user.role === 'member') {
      const { data: existingArticle, error: fetchError } = await supabase
        .from('articles')
        .select('author_id')
        .eq('id', id)
        .single();
        
      if (fetchError || !existingArticle || existingArticle.author_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "Akses ditolak. Anda bukan penulis artikel ini." });
      }
    }

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

    // Verify ownership for members
    if (req.user.role === 'member') {
      const { data: existingArticle, error: fetchError } = await supabase
        .from('articles')
        .select('author_id')
        .eq('id', id)
        .single();
        
      if (fetchError || !existingArticle || existingArticle.author_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "Akses ditolak. Anda bukan penulis artikel ini." });
      }
    }

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

const fetchMemberArticles = async (req, res) => {
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('author_id', req.user.id)
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

module.exports = {
  addArticle,
  fetchAllArticles,
  fetchMemberArticles,
  editArticle,
  deleteArticle,
};
