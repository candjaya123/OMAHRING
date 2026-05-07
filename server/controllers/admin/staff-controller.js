const bcrypt = require('bcryptjs');
const supabase = require('../../config/supabase');

const addNewStaff = async (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Authorized staff only.',
    });
  }

  const { userName, email, password, role } = req.body;

  try {
    const { data: checkUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (checkUser)
      return res.json({
        success: false,
        message: 'User already exists with this email!',
      });

    const hashPassword = await bcrypt.hash(password, 12);
    const { data: newStaff, error: insertError } = await supabase
      .from('users')
      .insert({
        userName,
        email,
        password: hashPassword,
        role: role || 'manager', // Default to manager if not specified
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully',
      data: {
        id: newStaff.id,
        _id: newStaff.id, // Compatibility
        userName: newStaff.userName,
        email: newStaff.email,
        role: newStaff.role,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getAllStaff = async (req, res) => {
  try {
    // We only want to fetch Admins and Managers for the staff management view
    const { data: staffList, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .in('role', ['admin', 'manager']);

    if (fetchError) {
      console.error("Error fetching staff:", fetchError);
      throw fetchError;
    }

    res.status(200).json({
      success: true,
      data: staffList.map(s => ({ 
        ...s, 
        _id: s.id,
        created_at: s.created_at || s.createdAt || new Date().toISOString() 
      })),
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateStaff = async (req, res) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Authorized staff only.',
    });
  }

  const { id } = req.params;
  const { userName, email, password, role } = req.body;

  try {
    const updateData = { userName, email, role };

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const { data: updatedStaff, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: 'Staff updated successfully',
      data: { ...updatedStaff, _id: updatedStaff.id },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const deleteStaff = async (req, res) => {
  if (req.user.role !== 'admin' || req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin only.',
    });
  }

  const { id } = req.params;

  // Prevent self-deletion
  if (id === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own admin account.',
    });
  }

  try {
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully',
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = { addNewStaff, getAllStaff, updateStaff, deleteStaff };
