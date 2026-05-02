const supabase = require("../db");

// 📥 Verileri getir
const getFototerapiData = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: plans } = await supabase
      .from("fototerapi_planlari")
      .select("*")
      .eq("kullanici_id", userId);

    const { data: sessions } = await supabase
      .from("fototerapi_seanslari")
      .select("*")
      .eq("kullanici_id", userId);

    res.json({
      success: true,
      plans: plans || [],
      sessions: sessions || [],
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// ➕ Plan oluştur
const createFototerapiPlan = async (req, res) => {
  try {
    const { kullanici_id, ad, baslangic_tarihi, seans_sayisi } = req.body;

    const { data: plan } = await supabase
      .from("fototerapi_planlari")
      .insert([
        {
          kullanici_id,
          ad,
          baslangic_tarihi,
          seans_sayisi,
          aktif_mi: true,
        },
      ])
      .select()
      .single();

    const sessions = [];

    for (let i = 0; i < seans_sayisi; i++) {
      const d = new Date(baslangic_tarihi);
      d.setDate(d.getDate() + i * 2);

      sessions.push({
        kullanici_id,
        fototerapi_id: plan.fototerapi_id,
        seans_no: i + 1,
        tarih: d.toISOString().split("T")[0],
        alindi_mi: false,
      });
    }

    await supabase.from("fototerapi_seanslari").insert(sessions);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// ✅ Seans tamamla
const completeFototerapiSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    await supabase
      .from("fototerapi_seanslari")
      .update({
        alindi_mi: true,
        tamamlanma_tarihi: new Date().toISOString().split("T")[0],
      })
      .eq("seans_id", sessionId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

module.exports = {
  getFototerapiData,
  createFototerapiPlan,
  completeFototerapiSession,
};