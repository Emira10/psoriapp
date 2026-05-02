const express = require("express");
const router = express.Router();

// 👇 controller bağlama
const { getProfile, updateProfile } = require("../controllers/profileController");

// 📌 Profil getir
router.get("/:userId", getProfile);

// 📌 Profil güncelle
router.put("/:userId", updateProfile);

module.exports = router;