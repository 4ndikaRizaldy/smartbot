require("dotenv").config();
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const moment = require("moment");
require("moment-hijri");
require("moment-timezone");
const axios = require("axios");
const math = require("mathjs");
const translate = require("google-translate-api-x");


const {
  validLanguages,
  autoResponses,
  logicQuestions,
  getRandomFakta,
  pantunList,
} = require("./data");

// Konfigurasi bahasa untuk format tanggal Indonesia
moment.locale("id");

let guessingGame = {};
let logicGame = {};
let botActive = true; //default aktif

// 🔹 Fungsi untuk menangani auto response dengan mention
async function handleAutoResponse(message, remoteJid, senderId, sock) {
  const lowerMessage = message.toLowerCase();

  for (const auto of autoResponses) {
    if (lowerMessage.includes(auto.keyword)) {
      const responseText = `@${senderId.split("@")[0]} ${auto.response}`;

      await sock.sendMessage(remoteJid, {
        text: responseText,
        mentions: [senderId], // Mentions pengguna
      });
      return;
    }
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", (update) => {
    if (update.connection === "close") startBot();
    else if (update.connection === "open") console.log("✅ Bot siap!");
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
    const remoteJid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const textMessage =
      msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!textMessage) return;

    // Perintah untuk menyalakan/mematikan bot
    if (textMessage === "!on") {
      botActive = true;
      sock.sendMessage(remoteJid, { text: "✅ Bot telah diaktifkan!" });
      return;
    } else if (textMessage === "!off") {
      botActive = false;
      sock.sendMessage(remoteJid, { text: "❌ Bot telah dimatikan!" });
      return;
    }

    // Jika bot dalam keadaan nonaktif, abaikan semua perintah kecuali !on
    if (!botActive) return;

    // Periksa apakah ada auto-response yang cocok
    await handleAutoResponse(textMessage, remoteJid, sender, sock);
    // Perintah bot yang lain
    if (textMessage === "!menu") {
      showMenu(remoteJid, sock);
    } else if (textMessage === "!ping") {
      sock.sendMessage(remoteJid, { text: "Pong! 🏓" });
    } else if (textMessage.startsWith("!tagall")) {
      const customMessage =
        textMessage.replace("!tagall", "").trim() || "👥 Mention All:";
      mentionAll(remoteJid, sock, customMessage);
    } else if (textMessage === "!jumlahanggota") {
      countGroupMembers(remoteJid, sock);
    } else if (textMessage === "!tebakangka") {
      startGuessingGame(remoteJid, sock);
    } else if (textMessage.startsWith("!jawab ")) {
      checkGuess(textMessage, remoteJid, sender, sock);
    } else if (textMessage === "!tanggal") {
      sendDate(remoteJid, sock);
    } else if (textMessage === "!faktaunik") {
      sendFaktaUnik(remoteJid, sock);
    } else if (textMessage.startsWith("!quran ")) {
      getQuranAyat(textMessage, remoteJid, sock);
    } else if (textMessage === "!tebaklogika") {
      startLogicGame(remoteJid, sock);
    } else if (textMessage.startsWith("!jlogika ")) {
      checkLogicAnswer(textMessage, remoteJid, sender, sock);
    } else if (textMessage.startsWith("!pantun")) {
      sendPantun(remoteJid, sock);
    } else if (
      textMessage.startsWith("!remind ") ||
      textMessage.startsWith("!setremind ")
    ) {
      setReminder(textMessage, remoteJid, sender, sock, false);
    } else if (
      textMessage.startsWith("!gremind ") ||
      textMessage.startsWith("!setgremind ")
    ) {
      setReminder(textMessage, remoteJid, sender, sock, true);
    } else if (textMessage === "!listremind") {
      listReminders(remoteJid, sock);
    } else if (textMessage.startsWith("!cancelremind ")) {
      cancelReminder(textMessage, remoteJid, sock);
    } else if (
      textMessage.startsWith("!repeatremind ") ||
      textMessage.startsWith("!repeatgremind ")
    ) {
      setRepeatReminder(
        textMessage,
        remoteJid,
        sender,
        sock,
        textMessage.startsWith("!repeatgremind ")
      );
    } else if (textMessage.startsWith("!stoprepeat")) {
      stopRepeatReminder(remoteJid, sender, sock);
    } else if (textMessage === "!motivasi") {
      sendMotivation(remoteJid, sock);
    } else if (textMessage.startsWith("!qrcode ")) {
      const text = textMessage.replace("!qrcode ", "").trim();
      if (text) {
        generateQRCode(text, remoteJid, sock);
      } else {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Masukkan teks atau URL setelah *!qrcode* contoh: *!qrcode https://example.com*",
        });
      }
    } else if (textMessage.startsWith("!shortlink ")) {
      const url = textMessage.replace("!shortlink ", "").trim();
      if (url) {
        shortLink(url, remoteJid, sock);
      } else {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Masukkan URL setelah *!shortlink* contoh: *!shortlink https://example.com*",
        });
      }
    } else if (textMessage.startsWith("!wiki ")) {
      const query = textMessage.replace("!wiki ", "").trim();
      if (query) {
        searchWikipedia(query, remoteJid, sock);
      } else {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Masukkan kata kunci setelah *!wiki* contoh: *!wiki Albert Einstein*",
        });
      }
    } else if (textMessage === "!kluelogika") {
      giveLogicClue(remoteJid, sock);
    } else if (textMessage.startsWith("!hitung ")) {
      try {
        const expression = textMessage.replace("!hitung", "").trim();
        const result = math.evaluate(expression);
        await sock.sendMessage(remoteJid, { text: `Hasil: ${result}` });
      } catch (error) {
        await sock.sendMessage(remoteJid, {
          text: "⚠️ Format salah! Contoh: `!hitung 5+3*2`",
        });
      }
    } else if (textMessage.startsWith("!translate ")) {
      translateText(textMessage, remoteJid, sock);
    } else "Pilihan yang anda inginkan belum tersedia";
  });
}


// 🔹 Fungsi untuk menampilkan menu
const showMenu = (from, sock) => {
  const menuText = `
✨ *SMARTBOT MENU* ✨
Hai! 🤖 Aku *SmartBot*, siap membantu dan menghibur kamu dengan berbagai fitur keren. Berikut daftar perintah yang bisa kamu gunakan:

📌 *INFO & UTILITAS*
🔹 !menu ➝ 📋 Menampilkan daftar perintah
🔹 !ping ➝ 🏓 Mengecek apakah bot aktif
🔹 !jumlahanggota ➝ 👥 Menampilkan jumlah anggota grup
🔹 !shortlink [URL] ➝ 🔗 Memperpendek link
🔹 !qrcode ➝   𝄃𝄃𝄂𝄂𝄀𝄁𝄃𝄂𝄂𝄃 Membuat Barcode

🎮 *PERMAINAN & TEBAK-TEBAKAN*
🔹 !tebakangka ➝ 🎲 Mulai permainan tebak angka (1-10)
🔹 !jawab [angka] ➝ 🔢 Menjawab tebak angka
🔹 !tebaklogika ➝ 🧠 Mulai permainan tebak logika
🔹 !jlogika [jawaban] ➝ 💭 Menjawab tebak logika
🔹 !kluelogika ➝ 🧩 Mendapatkan klue untuk tebak logika

📚 *INFO & PENGETAHUAN*
🔹 !tanggal ➝ 📅 Menampilkan tanggal hari ini (Masehi & Hijriah)
🔹 !faktaunik ➝ 💡 Mengirimkan fakta unik
🔹 !quran [surat:ayat] ➝ 📖 Menampilkan ayat dan terjemahannya
🔹 !wiki [pertanyaan] ➝ 🌍 Mencari informasi dari Wikipedia
🔹 !pantun ➝ 📜 Menampilkan pantun secara acak
🔹 !motivasi ➝ 🌟 Mengirimkan motivasi harian

🔢 *MATEMATIKA*
🔹 !hitung [ekspresi] ➝ 🧮 Menghitung ekspresi matematika (contoh: !hitung 5+3*2)

🌍 *BAHASA & TERJEMAHAN*
🔹 !translate [kode bahasa] [teks] ➝ 🔄 Menerjemahkan teks ke bahasa lain (contoh: !translate en Pantai)

⏰ *PENGINGAT (REMINDER)*
🔹 !setremind [tanggal] [jam] [pesan] ➝ 📅 Setel pengingat individu
🔹 !setgremind [tanggal] [jam] [pesan] ➝ 🏷️ Setel pengingat grup
🔹 !listremind ➝ 📜 Lihat daftar pengingat
🔹 !cancelremind [ID pengingat] ➝ ❌ Hapus pengingat tertentu
🔹 !repeatremind [waktu] [pesan] ➝ 🔁 Setel pengingat berulang
🔹 !repeatgremind [waktu] [pesan] ➝ 🔁 Setel pengingat grup berulang
🔹 !stoprepeat ➝ ⛔ Hentikan pengingat berulang

👥 *GRUP & INTERAKSI*
🔹 !tagall [pesan opsional] ➝ 📢 Mention semua anggota grup

💬 *Coba sekarang!* Kirim salah satu perintah di atas dan nikmati fiturnya! 🚀
  `;
  sock.sendMessage(from, { text: menuText });
};


//Translate
async function translateText(textMessage, remoteJid, sock) {
  try {
    const args = textMessage.split(" ");
    if (args.length < 3) {
      await sock.sendMessage(remoteJid, {
        text: "⚠️ Format salah! Contoh: `!translate en Halo dunia. Apa kabar?`",
      });
      return;
    }

    const lang = args[1]; // Ambil kode bahasa
    const text = args.slice(2).join(" "); // Gabungkan teks setelah kode bahasa

    // Cek apakah kode bahasa valid
    if (!validLanguages.includes(lang)) {
      await sock.sendMessage(remoteJid, {
        text: "❌ Kode bahasa tidak valid! Pastikan kode bahasa yang dimasukkan benar.",
      });
      return;
    }

    // Pecah teks menjadi kalimat berdasarkan tanda baca
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];

    // Terjemahkan setiap kalimat secara terpisah
    const translatedSentences = await Promise.all(
      sentences.map(async (sentence) => {
        const result = await translate(sentence.trim(), { to: lang });
        return result.text;
      })
    );

    const translatedText = translatedSentences.join(" "); // Gabungkan hasil terjemahan

    await sock.sendMessage(remoteJid, {
      text: `🔄 Terjemahan (${lang}): ${translatedText}`,
    });
  } catch (error) {
    console.error("Error saat menerjemahkan:", error);
    await sock.sendMessage(remoteJid, {
      text: "❌ Gagal menerjemahkan teks. Pastikan kode bahasa benar!",
    });
  }
}

// Tag Semua Orang
const mentionAll = async (from, sock, customMessage = "👥 Mention All!") => {
  try {
    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants.map((p) => p.id);

    await sock.sendMessage(from, {
      text: `*${customMessage}*`, // Hanya menampilkan pesan tanpa nama yang terlihat
      mentions: participants, // Tetap mention semua anggota secara tersembunyi
      contextInfo: { mentionedJid: participants }, // Mengaktifkan mention tersembunyi
    });
  } catch {
    sock.sendMessage(from, {
      text: "⚠️ Perintah ini hanya bisa digunakan di grup!",
    });
  }
};


// 🔹 Fungsi untuk mencari ringkasan artikel Wikipedia
const searchWikipedia = async (query, from, sock) => {
  try {
    const apiUrl = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      query
    )}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data.type === "disambiguation") {
      sock.sendMessage(from, {
        text: `⚠️ Hasil pencarian terlalu luas. Coba lebih spesifik!\n\n🔗 Lihat lebih lanjut: ${data.content_urls.desktop.page}`,
      });
      return;
    }

    const wikiText = `📖 *Wikipedia*\n\n*Judul:* ${data.title}\n\n${data.extract}\n\n🔗 Baca selengkapnya: ${data.content_urls.desktop.page}`;

    sock.sendMessage(from, { text: wikiText });
  } catch (error) {
    sock.sendMessage(from, {
      text: "⚠️ Maaf, artikel tidak ditemukan atau terjadi kesalahan.",
    });
  }
};

// 🔹 Fungsi untuk menghitung jumlah anggota grup
const countGroupMembers = async (from, sock) => {
  try {
    const groupMetadata = await sock.groupMetadata(from);
    sock.sendMessage(from, {
      text: `👥 Jumlah anggota grup: ${groupMetadata.participants.length}`,
    });
  } catch {
    sock.sendMessage(from, {
      text: "⚠️ Perintah ini hanya bisa digunakan di grup!",
    });
  }
};

// 🔹 Fungsi untuk memulai game tebak angka
const startGuessingGame = (from, sock) => {
  const number = Math.floor(Math.random() * 10) + 1;
  guessingGame[from] = number;
  sock.sendMessage(from, {
    text: "🎲 Tebak angka dari 1 hingga 10! Gunakan perintah *!jawab X* untuk menjawab.",
  });
};

// 🔹 Fungsi untuk mengecek jawaban tebak angka dengan klue & mention pengguna
const checkGuess = (message, from, sender, sock) => {
  const input = message.split(" ")[1];
  const answer = parseInt(input);

  if (isNaN(answer)) {
    sock.sendMessage(from, {
      text: `⚠️ *@${sender.split("@")[0]}*, jawaban harus angka!`,
      mentions: [sender],
    });
    return;
  }

  if (!guessingGame[from]) {
    sock.sendMessage(from, {
      text: "⚠️ Kamu belum memulai permainan! Ketik *!tebakangka* untuk mulai.",
    });
    return;
  }

  const correctNumber = guessingGame[from];

  if (answer === correctNumber) {
    sock.sendMessage(from, {
      text: `🎉 *@${
        sender.split("@")[0]
      }* benar! Angkanya adalah *${correctNumber}*. Selamat!`,
      mentions: [sender],
    });
    delete guessingGame[from]; // Reset game setelah jawaban benar
  } else {
    let clue =
      answer > correctNumber ? "Terlalu besar! 🔽" : "Terlalu kecil! 🔼";
    sock.sendMessage(from, {
      text: `❌ *@${sender.split("@")[0]}*, salah! Coba lagi. ${clue}`,
      mentions: [sender],
    });
  }
};

// 🔹 Fungsi untuk menampilkan tanggal dan waktu dalam bahasa Indonesia sesuai zona waktu pengguna
const sendDate = (from, sock) => {
  const userOffset = moment().utcOffset(); // Ambil offset pengguna dalam menit
  let timeZone = "WIB"; // Default WIB
  let offsetHours = userOffset / 60; // Konversi menit ke jam

  if (offsetHours === 8) {
    timeZone = "WITA";
  } else if (offsetHours === 9) {
    timeZone = "WIT";
  }

  const masehi = moment().format("dddd, D MMMM YYYY");
  const hijri = moment().format("D MMMM YYYY");
  const time = moment().format("HH:mm:ss");

  const dateText = `📅 *Tanggal dan Waktu Saat Ini*:\n📆 Masehi: ${masehi}\n🕌 Hijriah: ${hijri}\n⏰ Waktu: ${time} ${timeZone}`;
  sock.sendMessage(from, { text: dateText });
};

// 🔹 Fungsi untuk mengirimkan fakta unik dengan sumber referensi
const sendFaktaUnik = (from, sock) => {
  const randomFakta = getRandomFakta();
  sock.sendMessage(from, { text: randomFakta });
};

// 🔹 Fungsi untuk Memulai Tebak Logika
const startLogicGame = (from, sock) => {
  const randomQuestion =
    logicQuestions[Math.floor(Math.random() * logicQuestions.length)];
  logicGame[from] = randomQuestion;
  sock.sendMessage(from, {
    text: `🧠 *Tebak Logika!*\n\n❓ ${randomQuestion.question}\n\nGunakan *!jlogika [jawaban]* untuk menjawab.`,
  });
};

// 🔹 Fungsi untuk Mengecek Jawaban Tebak Logika
const checkLogicAnswer = (message, from, sender, sock) => {
  const input = message.split(" ").slice(1).join(" ").toLowerCase();

  if (!logicGame[from]) {
    sock.sendMessage(from, {
      text: "⚠️ Kamu belum memulai permainan! Ketik *!tebaklogika* untuk mulai.",
    });
    return;
  }

  const correctAnswer = logicGame[from].answer.toLowerCase();

  if (input === correctAnswer) {
    sock.sendMessage(from, {
      text: `🎉 *@${
        sender.split("@")[0]
      }* benar! Jawabannya adalah *${correctAnswer}*. Selamat!`,
      mentions: [sender],
    });
    delete logicGame[from]; // Reset game setelah jawaban benar
  } else {
    sock.sendMessage(from, {
      text: `❌ *@${sender.split("@")[0]}*, jawaban salah! Coba lagi.`,
      mentions: [sender],
    });
  }
};

// 🔹 Fungsi untuk Memberikan Klue Tebak Logika
const giveLogicClue = (from, sock) => {
  if (!logicGame[from]) {
    sock.sendMessage(from, {
      text: "⚠️ Tidak ada permainan yang sedang berlangsung! Ketik *!tebaklogika* untuk mulai.",
    });
    return;
  }

  const clue = logicGame[from].clue;
  sock.sendMessage(from, { text: `💡 *Klue:* ${clue}` });
};

// 🔹 Fungsi untuk menampilkan ayat Al-Qur'an dan artinya
const getQuranAyat = async (message, from, sock) => {
  try {
    const input = message.split(" ")[1]; // Format: !quran 2:255 (Surat:Ayat)
    if (!input) {
      sock.sendMessage(from, {
        text: "⚠️ Format salah! Gunakan *!quran [surat:ayat]*. Contoh: *!quran 2:255*",
      });
      return;
    }

    const [surah, ayat] = input.split(":");
    if (!surah || !ayat) {
      sock.sendMessage(from, {
        text: "⚠️ Format tidak valid! Gunakan *!quran [surat:ayat]*.",
      });
      return;
    }

    // Menggunakan API quran.api-docs.io yang masih aktif
    const response = await axios.get(
      `https://api.alquran.cloud/v1/ayah/${surah}:${ayat}/editions/quran-uthmani,id.indonesian`
    );
    const data = response.data.data;

    if (!data || data.length < 2) {
      sock.sendMessage(from, {
        text: "⚠️ Ayat tidak ditemukan! Pastikan input benar.",
      });
      return;
    }

    // Data[0] contains Arabic text, Data[1] contains translation
    const arabicText = data[0].text;
    const translation = data[1].text;
    const surahName = data[0].surah.englishName;
    const surahNameTranslation = data[0].surah.englishNameTranslation;

    const ayatText = `📖 *${surahName}* (${surahNameTranslation}) - Ayat ${ayat}\n\n📜 *Arab:* ${arabicText}\n\n📖 *Terjemahan:* ${translation}`;
    sock.sendMessage(from, { text: ayatText });
  } catch (error) {
    sock.sendMessage(from, {
      text: "⚠️ Terjadi kesalahan saat mengambil data. Coba lagi nanti!",
    });
    console.error(error);
  }
};

// Fungsi untuk mengirimkan pantun
const sendPantun = (from, sock) => {
  const randomPantun =
    pantunList[Math.floor(Math.random() * pantunList.length)];

  // Format pantun dalam bentuk teks
  const pantunText = `🎭 *Pantun untukmu!* 🎭\n\n${randomPantun.baris1}\n${randomPantun.baris2}\n${randomPantun.baris3}\n${randomPantun.baris4}`;

  // Kirim pantun ke pengguna
  sock.sendMessage(from, { text: pantunText });
};

// Motivasi
async function sendMotivation(remoteJid, sock) {
  try {
    const response = await fetch("https://zenquotes.io/api/random");
    const data = await response.json();

    if (data && data.length > 0) {
      const quote = `💡 *Motivasi Hari Ini:*\n\n"${data[0].q}"\n- ${data[0].a}`;
      sock.sendMessage(remoteJid, { text: quote });
    } else {
      sock.sendMessage(remoteJid, {
        text: "⚠️ Tidak ada kutipan tersedia saat ini.",
      });
    }
  } catch (error) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Gagal mengambil kutipan motivasi.",
    });
  }
}

//Shortlink
async function shortLink(url, remoteJid, sock) {
  try {
    const response = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    );
    const shortUrl = await response.text();
    sock.sendMessage(remoteJid, { text: `🔗 *Shortened URL:* ${shortUrl}` });
  } catch (error) {
    sock.sendMessage(remoteJid, { text: "⚠️ Gagal memperpendek URL." });
  }
}

const fs = require("fs");
const remindersFile = "reminders.json";
let repeatReminders = {};


// Fungsi untuk memuat reminder dari file
const loadReminders = () => {
  if (fs.existsSync(remindersFile)) {
    return JSON.parse(fs.readFileSync(remindersFile));
  }
  return [];
};

// Fungsi untuk menyimpan reminder ke file
const saveReminders = (reminders) => {
  fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2));
};

// Fungsi untuk menambahkan reminder
const setReminder = (textMessage, remoteJid, sender, sock, isGroup = false) => {
  const args = textMessage.split(" ").slice(1); // Mengabaikan !setremind
  if (args.length < 2) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Format salah! Contoh:\n• *!setremind Ingat makan siang dalam 10m*\n• *!setremind Rapat klien besok 14:00*",
    });
    return;
  }

  const inputText = args.join(" ");
  let reminderTime;
  let message;

  // 🔍 Cek apakah ada pola waktu (misal: dalam 10m, besok 14:00, 15-03-2025 14:30)
  const timeRegex =
    /(dalam\s+(\d+)(s|m|h))|(besok\s+\d{2}:\d{2})|(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2})/;
  const timeMatch = inputText.match(timeRegex);

  if (!timeMatch) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Format waktu tidak ditemukan! Gunakan kata *dalam 10m*, *besok 14:00*, atau *15-03-2025 14:30*",
    });
    return;
  }

  const now = new Date();

  if (timeMatch[2]) {
    // ⏳ Format: "dalam 10m" (berbasis durasi)
    const timeValue = parseInt(timeMatch[2]);
    const timeUnit = timeMatch[3];
    let timeMs;

    switch (timeUnit) {
      case "s":
        timeMs = timeValue * 1000;
        break;
      case "m":
        timeMs = timeValue * 60 * 1000;
        break;
      case "h":
        timeMs = timeValue * 60 * 60 * 1000;
        break;
      default:
        sock.sendMessage(remoteJid, {
          text: "⚠️ Gunakan satuan *s* (detik), *m* (menit), atau *h* (jam)!",
        });
        return;
    }

    reminderTime = new Date(now.getTime() + timeMs);
    message = inputText.replace(timeMatch[0], "").trim();
  } else if (timeMatch[4]) {
    // 📅 Format: "besok 14:00"
    const [hour, minute] = timeMatch[4].split(" ")[1].split(":").map(Number);
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(hour, minute, 0);

    reminderTime = tomorrow;
    message = inputText.replace(timeMatch[0], "").trim();
  } else if (timeMatch[5]) {
    // 📅 Format: "15-03-2025 14:30"
    const [datePart, timePart] = timeMatch[5].split(" ");
    const [day, month, year] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);

    reminderTime = new Date(year, month - 1, day, hour, minute, 0);
    message = inputText.replace(timeMatch[0], "").trim();
  }

  if (reminderTime < now) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Waktu yang kamu masukkan sudah lewat! Harap pilih waktu di masa depan.",
    });
    return;
  }

  sock.sendMessage(remoteJid, {
    text: `✅ Reminder disimpan untuk *${reminderTime.toLocaleString()}* dengan pesan:\n📢 ${message}`,
  });

  // Set timeout untuk mengirimkan reminder saat waktunya tiba
  setTimeout(() => {
    sock.sendMessage(remoteJid, { text: `🔔 *Reminder!* ${message}` });
  }, reminderTime - now);
};

// Fungsi untuk menampilkan semua reminder
const listReminders = (remoteJid, sock) => {
  const reminders = loadReminders();
  if (reminders.length === 0) {
    sock.sendMessage(remoteJid, { text: "📌 Tidak ada reminder yang tersimpan." });
    return;
  }

  let message = "📌 *Daftar Reminder:*\n";
  reminders.forEach((reminder, index) => {
    message += `\n*${index + 1}.* 📅 ${reminder.date ? `Tanggal: ${reminder.date}` : `Hari: ${reminder.days.join(", ")}`}\n🕒 Jam: ${reminder.time}\n📢 Pesan: ${reminder.message}\n📍 ${reminder.isGroup ? "Grup" : "Pribadi"}\n`;
  });

  sock.sendMessage(remoteJid, { text: message });
};

// Fungsi untuk menghapus reminder berdasarkan ID (urutan)
const cancelReminder = (textMessage, remoteJid, sock) => {
  const args = textMessage.split(" ");
  if (args.length < 2) {
    sock.sendMessage(remoteJid, { text: "⚠️ Gunakan format *!cancelremind <ID>*" });
    return;
  }

  const id = parseInt(args[1]) - 1;
  let reminders = loadReminders();

  if (id < 0 || id >= reminders.length) {
    sock.sendMessage(remoteJid, { text: `⚠️ Reminder dengan ID *${args[1]}* tidak ditemukan!` });
    return;
  }

  reminders.splice(id, 1);
  saveReminders(reminders);

  sock.sendMessage(remoteJid, { text: `✅ Reminder *${args[1]}* telah dihapus!` });
};

// Fungsi untuk membuat reminder berulang
const setRepeatReminder = (
  textMessage,
  remoteJid,
  sender,
  sock,
  isGroup = false
) => {
  const args = textMessage.split(" ");
  if (args.length < 3) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Format salah! Contoh: *!repeatremind 10m Olahraga!*",
    });
    return;
  }

  const timeInput = args[1];
  const message = args.slice(2).join(" ");
  const timeValue = parseInt(timeInput.slice(0, -1));
  const timeUnit = timeInput.slice(-1);
  let timeMs;

  switch (timeUnit) {
    case "s":
      timeMs = timeValue * 1000;
      break;
    case "m":
      timeMs = timeValue * 60 * 1000;
      break;
    case "h":
      timeMs = timeValue * 60 * 60 * 1000;
      break;
    default:
      sock.sendMessage(remoteJid, {
        text: "⚠️ Gunakan satuan *s* (detik), *m* (menit), atau *h* (jam)!",
      });
      return;
  }

  // Jika sudah ada reminder untuk user ini, hentikan yang lama
  if (repeatReminders[sender]) {
    clearInterval(repeatReminders[sender]);
  }

  // Simpan interval baru ke dalam repeatReminders
  repeatReminders[sender] = setInterval(() => {
    sock.sendMessage(remoteJid, { text: `🔔 *Reminder Berulang!* ${message}` });
  }, timeMs);

  sock.sendMessage(remoteJid, {
    text: `🔄 Reminder akan diulang setiap *${timeValue}${timeUnit}*: "${message}"\n\nKetik *!stoprepeat* untuk menghentikan.`,
  });
};

const stopRepeatReminder = (remoteJid, sender, sock) => {
  if (repeatReminders[sender]) {
    clearInterval(repeatReminders[sender]);
    delete repeatReminders[sender];
    sock.sendMessage(remoteJid, {
      text: "🛑 Reminder berulang telah dihentikan!",
    });
  } else {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Tidak ada reminder berulang yang aktif!",
    });
  }
};

// Buat QR Code
const QRCode = require("qrcode");

async function generateQRCode(text, remoteJid, sock) {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      errorCorrectionLevel: "H",
    });

    const base64Data = qrCodeDataURL.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");

    await sock.sendMessage(remoteJid, {
      image: buffer,
      caption: `✅ QR Code berhasil dibuat untuk: ${text}`,
    });
  } catch (error) {
    console.error("Gagal membuat QR Code:", error);
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Gagal membuat QR Code. Coba lagi!",
    });
  }
}



startBot();
