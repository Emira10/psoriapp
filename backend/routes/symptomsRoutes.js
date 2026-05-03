const express = require("express");
const router = express.Router();

const {
  getSymptoms,
  addSymptom,
  deleteSymptom,
  clearSymptoms,
} = require("../controllers/symptomsController");

// 🔥 Yeni kayıt ekle (kullanici_belirti_kayitlari + diğer tablolar)
router.post("/", addSymptom);

// 🔥 Tüm kayıtları sil (kullanıcıya göre)
router.delete("/all/:userId", clearSymptoms);

// 🔥 Kullanıcının tüm kayıtlarını getir
router.get("/:userId", getSymptoms);

// 🔥 Tek kayıt sil (ana kayıt + bağlı tablolar)
router.delete("/:id", deleteSymptom);

module.exports = router;