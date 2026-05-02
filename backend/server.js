const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "./backend/.env" });

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const symptomsRoutes = require("./routes/symptomsRoutes");
const fototerapiRoutes = require("./routes/fototerapiRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// 👇 ربط كل الـ routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/symptoms", symptomsRoutes);
app.use("/api/fototerapi", fototerapiRoutes);

app.get("/", (req, res) => {
  res.send("Backend çalışıyor ✅");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});