const supabase = require('../config/supabase');

/**
 * Get all store settings from Supabase.
 * Returns an object with the keys.
 */
const getStoreSettings = async () => {
    try {
        const { data, error } = await supabase
            .from('store_settings')
            .select('data')
            .eq('id', 'main')
            .maybeSingle();
        
        if (error) {
            console.error('Error fetching store settings from DB:', error);
            return {};
        }

        return data?.data || {};
    } catch (err) {
        console.error('Fetch settings error:', err);
        return {};
    }
};

module.exports = { getStoreSettings };
