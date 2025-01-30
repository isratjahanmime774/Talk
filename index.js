const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");

// Firebase Service Account Key ফাইল ইম্পোর্ট করো
const serviceAccount = require("./serviceAccountKey.json");

// Firebase অ্যাডমিন SDK ইনিশিয়ালাইজ করো
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://talk2-88cc6-default-rtdb.firebaseio.com/",
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
app.get("/get", async (req, res) => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ error: "Key is required!" });
  }

  const findKeyData = async (searchKey) => {
    const ref = db.ref(searchKey);
    const snapshot = await ref.once("value");
    return snapshot.val();
  };

  let data;

  // ১. সরাসরি key মিলানো
  data = await findKeyData(key);
  if (data) {
    const values = Object.values(data);
    const reply = values[Math.floor(Math.random() * values.length)];
    return res.status(200).json({ reply });
  }

  // ২. ডেটাবেসে সমস্ত key খুঁজে বের করা
  const allKeysSnapshot = await db.ref().once("value");
  const allKeys = Object.keys(allKeysSnapshot.val() || {});

  // ৩. প্রথম ৩ অক্ষর মিলানো
  const partialKeyStart = key.slice(0, 3);
  const startMatchKey = allKeys.find((dbKey) => dbKey.startsWith(partialKeyStart));
  if (startMatchKey) {
    data = await findKeyData(startMatchKey);
    if (data) {
      const values = Object.values(data);
      const reply = values[Math.floor(Math.random() * values.length)];
      return res.status(200).json({ reply });
    }
  }

  // ৪. শেষ ৩ অক্ষর মিলানো
  const partialKeyEnd = key.slice(-3);
  const endMatchKey = allKeys.find((dbKey) => dbKey.endsWith(partialKeyEnd));
  if (endMatchKey) {
    data = await findKeyData(endMatchKey);
    if (data) {
      const values = Object.values(data);
      const reply = values[Math.floor(Math.random() * values.length)];
      return res.status(200).json({ reply });
    }
  }

  // ৫. কিছুই না মিললে ত্রুটি
  return res.status(404).json({ error: "No data found for the specified key or similar keys!" });
});

// সার্ভার শুরু করা
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
