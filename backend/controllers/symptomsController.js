const supabase = require("../db");

// Kullanıcının semptom kayıtlarını getir
const getSymptoms = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("semptom_kayitlari")
      .select("*")
      .eq("kullanici_id", userId)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ success: false, message: error.message });

    res.json({ success: true, symptoms: data });
  } catch {
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

// Yeni semptom kaydı ekle
const addSymptom = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("semptom_kayitlari")
      .insert([req.body])
      .select()
      .single();

    if (error) return res.status(400).json({ success: false, message: error.message });

    res.json({ success: true, symptom: data });
  } catch {
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

// Semptom kaydını sil
const deleteSymptom = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("semptom_kayitlari")
      .delete()
      .eq("id", id);

    if (error) return res.status(400).json({ success: false, message: error.message });

    res.json({ success: true, message: "Semptom kaydı silindi" });
  } catch {
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

// Tüm semptom kayıtlarını sil
const clearSymptoms = async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from("semptom_kayitlari")
      .delete()
      .eq("kullanici_id", userId);

    if (error) return res.status(400).json({ success: false, message: error.message });

    res.json({ success: true, message: "Tüm semptom kayıtları silindi" });
  } catch {
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

module.exports = { getSymptoms, addSymptom, deleteSymptom, clearSymptoms };