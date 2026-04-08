const express = require("express");
const axios = require("axios");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(cors());

// 🔐 ENV VARIABLES
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN; // Render env
const SECRET_TOKEN = process.env.SECRET_TOKEN || "12345";

// 🤖 TELEGRAM BOT START
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// 📌 START COMMAND
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `👋 Welcome!\n\n🆔 Your User ID: ${msg.from.id}\n\n📥 Send M3U8 link to get proxy`
  );
});

// 📥 HANDLE USER MESSAGE
bot.on("message", async (msg) => {
  const text = msg.text;

  if (!text.includes("m3u8")) return;

  const proxy = `${process.env.RENDER_EXTERNAL_URL}/proxy?url=${encodeURIComponent(text)}&token=${SECRET_TOKEN}`;

  bot.sendMessage(msg.chat.id, `✅ Proxy Link:\n${proxy}`);
});

// 🌐 HOME
app.get("/", (req, res) => {
  res.send("🚀 Ultra M3U8 API + Bot Running");
});

// 🔥 PROXY API
app.get("/proxy", async (req, res) => {
  try {
    const { url, token } = req.query;

    // 🔐 SECURITY CHECK
    if (token !== SECRET_TOKEN) {
      return res.status(403).send("❌ Unauthorized");
    }

    if (!url) {
      return res.status(400).send("❌ Missing URL");
    }

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    let data = response.data;

    // 🔧 FIX RELATIVE LINKS
    const base = url.substring(0, url.lastIndexOf("/") + 1);

    data = data.replace(/(.*\.ts)/g, (match) => {
      if (match.startsWith("http")) return match;
      return base + match;
    });

    // 🎯 HEADERS
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");

    res.send(data);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("❌ Error fetching stream");
  }
});

// 🚀 START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});