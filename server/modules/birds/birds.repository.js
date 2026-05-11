const supabase = require('../../config/supabase');

class BirdsRepository {
  async findById(id) {
    const { data, error } = await supabase
      .from('birds')
      .select('*, bird_competitions(*), users!birds_member_id_fkey(user_name, phone_number)')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async findByMemberId(memberId) {
    const { data, error } = await supabase
      .from('birds')
      .select('*, bird_competitions(*)')
      .eq('member_id', memberId)
      .is('deleted_at', null);

    if (error) throw error;
    return data;
  }

  async createBird(birdData) {
    const { data, error } = await supabase
      .from('birds')
      .insert({
        member_id: birdData.member_id,
        name: birdData.name,
        species: birdData.species,
        whatsapp_contact: birdData.whatsapp_contact,
        qr_code_url: birdData.qr_code_url || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addCompetitions(birdId, competitions) {
    const { data, error } = await supabase
      .from('bird_competitions')
      .insert(competitions.map(c => ({ ...c, bird_id: birdId })))
      .select();

    if (error) throw error;
    return data;
  }

  async softDelete(id) {
    const { error } = await supabase
      .from('birds')
      .update({ deleted_at: new Date() })
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

module.exports = new BirdsRepository();
