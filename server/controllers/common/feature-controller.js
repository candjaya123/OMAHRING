const supabase = require("../../config/supabase");

const addFeatureImage = async (req, res) => {
  try {
    const { image, title, subtitle, type } = req.body;

    const { data: featureImages, error } = await supabase
      .from('features')
      .insert({ 
        image, 
        title: title || null, 
        subtitle: subtitle || null, 
        type: type || 'feature' 
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { ...featureImages, _id: featureImages.id },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getFeatureImages = async (req, res) => {
  try {
    const { data: images, error } = await supabase
      .from('features')
      .select('*');

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: images.map(img => ({ ...img, _id: img.id })),
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const deleteFeatureImage = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('features')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = { addFeatureImage, getFeatureImages, deleteFeatureImage };
