const supabase = require("../db");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email ve şifre gerekli",
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Giriş başarılı",
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası",
    });
  }
};

module.exports = { login };