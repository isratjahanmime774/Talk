const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");

// Firebase Service Account Key ফাইল ইম্পোর্ট করো
const serviceAccount = require("./serviceAccountKey.json");

// Firebase অ্যাডমিন SDK ইনিশিয়ালাইজ করো
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://talk1-5b07d-default-rtdb.firebaseio.com/",
});

const db = admin.database(); // ডাটাবেস রেফারেন্স
const app = express();
app.use(bodyParser.json()); // JSON ডেটা পার্স করার জন্য

// POST রুট: ডেটা সেভ করা
app.post("/save", (req, res) => {
  const { key, text } = req.body;
  if (!key || !text) {
    return res.status(400).json({ error: "Key and text are required!" });
  }

  const ref = db.ref(key); // ডাটাবেসের রেফারেন্স
  ref.push(text, (error) => {
    if (error) {
      res.status(500).json({ error: "Failed to save data!" });
    } else {
      res.status(200).json({ message: `Text "${text}" saved under key "${key}".` });
    }
  });
});

// GET রুট: র‌্যান্ডম ডেটা রিটার্ন করা
app.get("/get", (req, res) => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ error: "Key is required!" });
  }

  const ref = db.ref(key);
  ref.once("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      return res.status(404).json({ reply: "এইটা আমাকে শিখানো হয়নি গো🥺" });
    }

    // র‌্যান্ডম ডেটা রিটার্ন
    const values = Object.values(data);
    const reply = values[Math.floor(Math.random() * values.length)];

    // JSON রেসপন্স হিসেবে পাঠানো
    res.status(200).json({ reply });
  });
});

// সার্ভার শুরু করা
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
