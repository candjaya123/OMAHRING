const axios = require('axios');
const supabase = require('../../config/supabase');
const { getStoreSettings } = require('../../helpers/store-settings-helper');

const BITESHIP_API_URL = 'https://api.biteship.com/v1';

const getCouriers = async (req, res) => {
  try {
    const settings = await getStoreSettings();
    const apiKey = settings.biteshipApiKey || process.env.BITESHIP_API_KEY;

    const response = await axios.get(`${BITESHIP_API_URL}/couriers`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    res.status(200).json({ success: true, data: response.data.couriers });
  } catch (error) {
    console.error('Biteship Couriers Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kurir' });
  }
};

const getCost = async (req, res) => {
  try {
    const { origin_area_id, destination_area_id, items } = req.body;
    const settings = await getStoreSettings();
    const apiKey = settings.biteshipApiKey || process.env.BITESHIP_API_KEY;

    // Default origin area ID from settings if not provided
    const origin = origin_area_id || settings.originAreaId;

    const response = await axios.post(`${BITESHIP_API_URL}/rates`, {
      origin_area_id: origin,
      destination_area_id,
      items
    }, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    res.status(200).json({ success: true, data: response.data.results });
  } catch (error) {
    console.error('Biteship Rates Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghitung ongkos kirim' });
  }
};

const createShippingOrder = async (req, res) => {
    try {
      const { shipper_name, shipper_phone, shipper_address, destination_name, destination_phone, destination_address, destination_area_id, courier_company, courier_type, items } = req.body;
      const settings = await getStoreSettings();
      const apiKey = settings.biteshipApiKey || process.env.BITESHIP_API_KEY;
  
      const response = await axios.post(`${BITESHIP_API_URL}/orders`, {
        shipper_name,
        shipper_phone,
        shipper_address,
        destination_name,
        destination_phone,
        destination_address,
        destination_area_id,
        courier_company,
        courier_type,
        items
      }, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
  
      res.status(201).json({ success: true, data: response.data });
    } catch (error) {
      console.error('Biteship Order Error:', error);
      res.status(500).json({ success: false, message: 'Gagal membuat order pengiriman' });
    }
  };

const searchAreas = async (req, res) => {
  try {
    const { input } = req.query;
    if (!input || input.length < 3) {
      return res.status(200).json({ success: true, data: [] });
    }

    const settings = await getStoreSettings();
    const apiKey = settings.biteshipApiKey || process.env.BITESHIP_API_KEY;

    const response = await axios.get(`${BITESHIP_API_URL}/maps/areas`, {
      params: { countries: 'ID', input, type: 'single' },
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    res.status(200).json({ success: true, data: response.data.areas });
  } catch (error) {
    console.error('Biteship Areas Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mencari area pengiriman' });
  }
};

module.exports = { getCouriers, getCost, createShippingOrder, searchAreas };
