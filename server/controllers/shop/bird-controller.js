const supabase = require('../../config/supabase');

const registerBird = async (req, res) => {
  try {
    const { member_id, name, species, competition_history, whatsapp_contact } = req.body;

    const { data, error } = await supabase
      .from('birds')
      .insert({
        member_id,
        name,
        species,
        competition_history: competition_history || [],
        whatsapp_contact,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Error registering bird',
    });
  }
};

const getBirdDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('birds')
      .select('*, users(userName, phone_number)')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bird details',
    });
  }
};

const getMemberBirds = async (req, res) => {
  try {
    const { memberId } = req.params;

    const { data, error } = await supabase
      .from('birds')
      .select('*')
      .eq('member_id', memberId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching member birds',
    });
  }
};

module.exports = { registerBird, getBirdDetails, getMemberBirds };
