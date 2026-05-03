const supabase = require("../db");

// Geçici ID eşleştirmeleri
// Bu ID değerleri veritabanındaki gerçek ID'lere göre gerekirse değiştirilecek.
const PAIN_BELIRTI_ID = 1;
const ITCH_BELIRTI_ID = 2;

const BOLGE_MAP = {
  head: 1,
  neck: 2,
  chest: 3,
  abs: 4,
  obliques: 5,
  deltoids: 6,
  biceps: 7,
  triceps: 8,
  forearm: 9,
  hands: 10,
  quadriceps: 11,
  knees: 12,
  calves: 13,
  feet: 14,
  "upper-back": 15,
  "lower-back": 16,
  gluteal: 17,
  hamstring: 18,
  trapezius: 19,
  hair: 20,
};

const DUYGU_MAP = {
  Mutluluk: 1,
  Üzüntü: 2,
  Stres: 3,
  Kaygı: 4,
  Huzur: 5,
  Öfke: 6,
  Yorgunluk: 7,
};

const getKeyByValue = (obj, value) => {
  return Object.keys(obj).find((key) => obj[key] === value);
};

const formatDateOnly = (date) => {
  if (!date) return new Date().toISOString().split("T")[0];
  return new Date(date).toISOString().split("T")[0];
};

// Kullanıcının semptom kayıtlarını getir
const getSymptoms = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const filterField = userId?.startsWith("device_") ? "cihaz_id" : "kullanici_id";
    const { data: mainRecords, error: mainError } = await supabase
      .from("kullanici_belirti_kayitlari")
      .select("*")
      .eq(filterField, userId)
      .order("olusturma_tarihi", { ascending: false });

    if (mainError) {
      return res.status(400).json({ success: false, message: mainError.message });
    }

    const records = [];

    for (const record of mainRecords || []) {
      const kayitId = record.kayit_id;

      const { data: detaylar } = await supabase
        .from("belirti_kayit_detaylari")
        .select("*")
        .eq("kayit_id", kayitId);

      const { data: bolgeler } = await supabase
        .from("belirti_kayit_bolgeleri")
        .select("*")
        .eq("kayit_id", kayitId);

      const { data: duygular } = await supabase
        .from("belirti_kayit_duygu_durumlari")
        .select("*")
        .eq("kayit_id", kayitId);

      let painLevel = 0;
      let itchLevel = 0;

      (detaylar || []).forEach((item) => {
        if (Number(item.belirti_id) === PAIN_BELIRTI_ID) {
          painLevel = item.siddet || 0;
        }

        if (Number(item.belirti_id) === ITCH_BELIRTI_ID) {
          itchLevel = item.siddet || 0;
        }
      });

      const selectedParts = (bolgeler || [])
        .map((item) => {
          const slug = getKeyByValue(BOLGE_MAP, Number(item.bolge_id));
          return slug ? { slug } : null;
        })
        .filter(Boolean);

      const selectedMoods = (duygular || [])
        .map((item) => getKeyByValue(DUYGU_MAP, Number(item.duygu_id)))
        .filter(Boolean);

      records.push({
        id: kayitId,
        created_at: record.olusturma_tarihi,
        selected_date: record.kayit_tarihi,
        weather: null,
        selected_parts: selectedParts,
        pain_level: painLevel,
        itch_level: itchLevel,
        selected_moods: selectedMoods,
        selected_image: null,
        ai_result: null,
        note: record.genel_not,
      });
    }

    return res.json({ success: true, symptoms: records });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: err.message,
    });
  }
};

// Yeni semptom kaydı ekle
const addSymptom = async (req, res) => {
  try {
    const {
      kullanici_id,
      cihaz_id,
      selected_date,
      selected_parts,
      pain_level,
      itch_level,
      selected_moods,
      note,
    } = req.body;

    if (!kullanici_id) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcı ID eksik.",
      });
    }

    // Ana kayıt eklenir
    const { data: mainRecord, error: mainError } = await supabase
      .from("kullanici_belirti_kayitlari")
      .insert([
        {
  kullanici_id: kullanici_id || null,
  cihaz_id: cihaz_id || null,   // ⬅️ مهم
  hastalik_id: null,
  kayit_tarihi: formatDateOnly(selected_date),
  genel_not: note || null,
  olusturma_tarihi: new Date().toISOString(),
  hava_kayit_id: null,
  fotograf_id: null,
}
      ])
      .select()
      .single();

    if (mainError) {
      return res.status(400).json({ success: false, message: mainError.message });
    }

    const kayitId = mainRecord.kayit_id;

    // Ağrı ve kaşıntı detayları eklenir
    const detayRows = [
      {
        kayit_id: kayitId,
        belirti_id: PAIN_BELIRTI_ID,
        siddet: pain_level || 0,
      },
      {
        kayit_id: kayitId,
        belirti_id: ITCH_BELIRTI_ID,
        siddet: itch_level || 0,
      },
    ];

    const { error: detayError } = await supabase
      .from("belirti_kayit_detaylari")
      .insert(detayRows);

    if (detayError) {
      return res.status(400).json({ success: false, message: detayError.message });
    }

    // Seçilen vücut bölgeleri eklenir
    const bolgeRows = (selected_parts || [])
      .map((part) => {
        const bolgeId = BOLGE_MAP[part.slug];

        if (!bolgeId) return null;

        return {
          kayit_id: kayitId,
          bolge_id: bolgeId,
        };
      })
      .filter(Boolean);

    if (bolgeRows.length > 0) {
      const { error: bolgeError } = await supabase
        .from("belirti_kayit_bolgeleri")
        .insert(bolgeRows);

      if (bolgeError) {
        return res.status(400).json({ success: false, message: bolgeError.message });
      }
    }

    // Seçilen duygu durumları eklenir
    const duyguRows = (selected_moods || [])
      .map((mood) => {
        const duyguId = DUYGU_MAP[mood];

        if (!duyguId) return null;

        return {
          kayit_id: kayitId,
          duygu_id: duyguId,
        };
      })
      .filter(Boolean);

    if (duyguRows.length > 0) {
      const { error: duyguError } = await supabase
        .from("belirti_kayit_duygu_durumlari")
        .insert(duyguRows);

      if (duyguError) {
        return res.status(400).json({ success: false, message: duyguError.message });
      }
    }

    return res.json({
      success: true,
      symptom: {
        id: kayitId,
        created_at: mainRecord.olusturma_tarihi,
        selected_date: mainRecord.kayit_tarihi,
        selected_parts: selected_parts || [],
        pain_level: pain_level || 0,
        itch_level: itch_level || 0,
        selected_moods: selected_moods || [],
        note: note || null,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: err.message,
    });
  }
};

// Tek semptom kaydını sil
const deleteSymptom = async (req, res) => {
  try {
    const { id } = req.params;

    await supabase.from("belirti_kayit_bolgeleri").delete().eq("kayit_id", id);
    await supabase.from("belirti_kayit_detaylari").delete().eq("kayit_id", id);
    await supabase.from("belirti_kayit_duygu_durumlari").delete().eq("kayit_id", id);

    const { error } = await supabase
      .from("kullanici_belirti_kayitlari")
      .delete()
      .eq("kayit_id", id);

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.json({ success: true, message: "Semptom kaydı silindi." });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: err.message,
    });
  }
};

// Kullanıcının tüm semptom kayıtlarını sil
const clearSymptoms = async (req, res) => {
  try {
    const { userId } = req.params;

    const filterField = userId?.startsWith("device_") ? "cihaz_id" : "kullanici_id";
    const { data: records, error: getError } = await supabase
      .from("kullanici_belirti_kayitlari")
      .select("kayit_id")
      .eq(filterField, userId)

    if (getError) {
      return res.status(400).json({ success: false, message: getError.message });
    }

    const ids = (records || []).map((item) => item.kayit_id);

    if (ids.length > 0) {
      await supabase.from("belirti_kayit_bolgeleri").delete().in("kayit_id", ids);
      await supabase.from("belirti_kayit_detaylari").delete().in("kayit_id", ids);
      await supabase.from("belirti_kayit_duygu_durumlari").delete().in("kayit_id", ids);
    }
    
    const filterField = userId?.startsWith("device_") ? "cihaz_id" : "kullanici_id";
    const { error } = await supabase
      .from("kullanici_belirti_kayitlari")
      .delete()
      .eq(filterField, userId)

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.json({
      success: true,
      message: "Tüm semptom kayıtları silindi.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: err.message,
    });
  }
};

module.exports = {
  getSymptoms,
  addSymptom,
  deleteSymptom,
  clearSymptoms,
};