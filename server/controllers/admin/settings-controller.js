const supabase = require('../../config/supabase');

const getSettings = async (req, res) => {
  try {
    const { data: result, error } = await supabase
      .from('store_settings')
      .select('data')
      .eq('id', 'main')
      .maybeSingle();

    if (error) throw error;

    res.status(200).json({ 
      success: true, 
      data: result?.data || {} 
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan dari database' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const newSettings = req.body;
    
    // UPSERT: Jika id 'main' ada, timpa datanya, jika tidak ada, buat baru.
    const { data: result, error } = await supabase
      .from('store_settings')
      .upsert({ 
        id: 'main', 
        data: newSettings,
        updated_at: new Date().toISOString() 
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ 
      success: true, 
      data: result.data, 
      message: "Pengaturan berhasil diperbarui di database" 
    });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan di database' });
  }
};

module.exports = { getSettings, updateSettings };
