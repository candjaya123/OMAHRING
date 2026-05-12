const supabase = require('../../config/supabase');

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'; // Fixed UUID for singleton

class SettingsRepository {
  async get() {
    const { data, error } = await supabase
      .from('store_settings')
      .select('store_name, store_service_fee, payment_mode, qris_image_url, bank_accounts, origin_area_id')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getWithSecrets() {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async update(settingsData) {
    // Attempt to get the first row's ID if SETTINGS_ID is not used
    const current = await this.get();
    const id = current ? current.id : SETTINGS_ID;

    const { data, error } = await supabase
      .from('store_settings')
      .upsert({ 
        id, 
        ...settingsData,
        updated_at: new Date() 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new SettingsRepository();
