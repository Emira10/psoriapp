const express = require("express");
const router = express.Router();

const {
  getFototerapiData,
  createFototerapiPlan,
  completeFototerapiSession,
} = require("../controllers/fototerapiController");

// 📥 Kullanıcının tüm fototerapi verilerini getir
router.get("/:userId", getFototerapiData);

// ➕ Yeni plan oluştur
router.post("/plan", createFototerapiPlan);

// ✅ Seansı tamamla
router.put("/session/:sessionId", completeFototerapiSession);

module.exports = router;