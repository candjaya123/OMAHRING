const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../../config/supabase');

//register
const registerUser = async (req, res) => {
  const { userName, email, password, role, nik, phone_number } = req.body;

  try {
    const { data: checkUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (checkUser) {
      if (checkUser.password !== null && checkUser.password !== undefined) {
        return res.json({
          success: false,
          message: 'User Already exists with the same email! Please try again',
        });
      }
      
      // Upgrade guest account
      const hashPassword = await bcrypt.hash(password, 12);
      const updateData = { userName, password: hashPassword, role: role || 'user' };
      if (nik) updateData.nik = nik;
      if (phone_number) updateData.phone_number = phone_number;

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', checkUser.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return res.status(200).json({
        success: true,
        message: 'Guest account upgraded successfully',
        user: {
          id: updatedUser.id,
          userName: updatedUser.userName,
          email: updatedUser.email,
          role: updatedUser.role,
          nik: updatedUser.nik,
          phone_number: updatedUser.phone_number
        },
      });
    }

    const hashPassword = await bcrypt.hash(password, 12);
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        userName,
        email,
        password: hashPassword,
        role: role || 'user',
        nik: nik || null,
        phone_number: phone_number || null
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(200).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.id,
        userName: newUser.userName,
        email: newUser.email,
        role: newUser.role,
        nik: newUser.nik,
        phone_number: newUser.phone_number
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Some error occured',
    });
  }
};

//login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: checkUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!checkUser)
      return res.json({
        success: false,
        message: 'Invalid Credentials',
      });

    const checkPasswordMatch = await bcrypt.compare(password, checkUser.password);
    if (!checkPasswordMatch)
      return res.json({
        success: false,
        message: 'Invalid Credential',
      });

    const token = jwt.sign(
      {
        id: checkUser.id,
        role: checkUser.role,
        email: checkUser.email,
        userName: checkUser.userName,
        nik: checkUser.nik,
        phone_number: checkUser.phone_number
      },
      process.env.JWT_SECRET || 'CLIENT_SECRET_KEY',
      { expiresIn: '60m' }
    );

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    }).json({
      success: true,
      message: 'Logged in successfully',
      user: {
        email: checkUser.email,
        role: checkUser.role,
        id: checkUser.id,
        userName: checkUser.userName,
        nik: checkUser.nik,
        phone_number: checkUser.phone_number
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Some error occured',
    });
  }
};

//logout

const logoutUser = (req, res) => {
  res.clearCookie('token').json({
    success: true,
    message: 'Logged out successfully!',
  });
};

//auth middleware
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({
      success: false,
      message: 'Unauthorised user!',
    });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'CLIENT_SECRET_KEY');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Unauthorised user!',
    });
  }
};

module.exports = { registerUser, loginUser, logoutUser, authMiddleware };
