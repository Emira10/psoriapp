const express = require("express");
const router = express.Router();

const {
  getSymptoms,
  addSymptom,
  deleteSymptom,
  clearSymptoms,
} = require("../controllers/symptomsController");

// Kullanıcının kayıtlarını getir
router.get("/:userId", getSymptoms);

// Yeni kayıt ekle
router.post("/", addSymptom);

// Tek kayıt sil
router.delete("/:id", deleteSymptom);

// Kullanıcının tüm kayıtlarını sil
router.delete("/all/:userId", clearSymptoms);

module.exports = router;