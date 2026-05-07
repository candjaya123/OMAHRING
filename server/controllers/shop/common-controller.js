const supabase = require('../../config/supabase');

const fetchShopArticles = async (req, res) => {
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Tambahkan id mapping jika perlu, tapi home.jsx menggunakan article.id
    res.status(200).json({ success: true, data: articles });
  } catch (error) {
    console.error('Error fetching shop articles:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil artikel: ' + error.message });
  }
};

const fetchShopCategories = async (req, res) => {
  try {
    // Menggunakan 'label' untuk sorting karena kolom 'created_at' mungkin tidak ada di tabel categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('label', { ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching shop categories:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil kategori: ' + error.message });
  }
};

const joinCommunity = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Nama dan Email wajib diisi' });
    }

    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (findError) throw findError;

    if (existingUser) {
      if (!['admin', 'manager', 'loyal'].includes(existingUser.role)) {
        const { error: updateError } = await supabase.from('users').update({ role: 'loyal' }).eq('id', existingUser.id);
        if (updateError) throw updateError;
      }
      return res.status(200).json({ success: true, message: 'Terima kasih, Anda sudah terdaftar di komunitas kami!' });
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        userName: name,
        email: email,
        role: 'loyal',
      });

    if (insertError) throw insertError;

    res.status(201).json({ success: true, message: 'Selamat! Anda berhasil bergabung ke komunitas Omahring.' });

  } catch (error) {
    console.error('Error joining community:', error);
    res.status(500).json({ success: false, message: 'Gagal bergabung ke komunitas: ' + error.message });
  }
};

const submitContent = async (req, res) => {
  try {
    const { author_id, type, subcategory, title, content_body, media_url } = req.body;

    const { data, error } = await supabase
      .from('content')
      .insert({
        author_id,
        type,
        subcategory,
        title,
        content_body,
        media_url,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, message: 'Konten berhasil dikirim', data });
  } catch (error) {
    console.error('Error submitting content:', error);
    res.status(500).json({ success: false, message: 'Gagal mengirim konten' });
  }
};

module.exports = { fetchShopArticles, fetchShopCategories, joinCommunity, submitContent };
