const supabase = require("../../config/supabase");

const addAddress = async (req, res) => {
  try {
    const { userId, address, city, pincode, phone, notes } = req.body;

    if (!userId || !address || !city || !pincode || !phone || !notes) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const { data: newlyCreatedAddress, error } = await supabase
      .from("addresses")
      .insert({
        user_id: userId,
        address,
        city,
        pincode,
        notes,
        phone,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: { ...newlyCreatedAddress, _id: newlyCreatedAddress.id },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const fetchAllAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User id is required!",
      });
    }

    const { data: addressList, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: addressList.map((addr) => ({ ...addr, _id: addr.id })),
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const editAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const formData = req.body;

    if (!userId || !addressId) {
      return res.status(400).json({
        success: false,
        message: "User and address id is required!",
      });
    }

    const { data: address, error } = await supabase
      .from("addresses")
      .update(formData)
      .eq("id", addressId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { ...address, _id: address.id },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    if (!userId || !addressId) {
      return res.status(400).json({
        success: false,
        message: "User and address id is required!",
      });
    }

    const { data: address, error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

module.exports = { addAddress, editAddress, fetchAllAddress, deleteAddress };
