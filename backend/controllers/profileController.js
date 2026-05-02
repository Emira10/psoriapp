const supabase = require("../db");

// Kullanıcı profil bilgilerini getir
const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("profil_kullanici")
      .select("*")
      .eq("kullanici_id", userId)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.json({ success: true, profile: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

// Kullanıcı profil bilgilerini kaydet / güncelle
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tip_id, boy_cm, kilo_kg } = req.body;

    const { data, error } = await supabase
      .from("profil_kullanici")
      .upsert(
        {
          kullanici_id: userId,
          tip_id,
          boy_cm,
          kilo_kg,
        },
        { onConflict: "kullanici_id" }
      )
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.json({ success: true, profile: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

module.exports = { getProfile, updateProfile };