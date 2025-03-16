require("dotenv").config();
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const moment = require("moment");
require("moment-hijri");
const axios = require("axios");
const math = require("mathjs");
const translate = require('google-translate-api-x');


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
    const { state, saveCreds } =
    await useMultiFileAuthState("auth_info_baileys");
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
      } else if (textMessage === "!tagall") {
        mentionAll(remoteJid, sock);
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
      } else if (textMessage.startsWith("!jawablogika ")) {
        checkLogicAnswer(textMessage, remoteJid, sender, sock);
      } else if (textMessage.startsWith ("!pantun")) {
        sendPantun(remoteJid, sock);
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
    ✨ Selamat Datang di SMARTBOT ✨
Hai! 🤖 Aku SmartBot, siap membantu dan menghibur kamu dengan berbagai fitur menarik. Yuk, lihat daftar perintah yang bisa kamu gunakan!

📌 ✨ MENU SMARTBOT ✨ 📌

📢 Perintah yang bisa kamu gunakan:

🔹 INFO & UTILITAS
🔸 !menu ➝ 📋 Menampilkan daftar perintah
🔸 !ping ➝ 🏓 Mengecek apakah bot aktif
🔸 !jumlahanggota ➝ 👥 Menampilkan jumlah anggota grup

🎮 PERMAINAN & TEBAK-TEBAKAN
🔹 !tebakangka ➝ 🎲 Mulai permainan tebak angka (1-10)
🔹 !jawab X ➝ 🔢 Menjawab tebak angka
🔹 !tebaklogika ➝ 🧠 Mulai permainan tebak logika
🔹 !jawablogika [jawaban] ➝ 💭 Menjawab tebak logika
🔹 !kluelogika ➝ 🧩 Mendapatkan klue untuk tebak logika

📚 INFO & PENGETAHUAN
🔹 !tanggal ➝ 📅 Menampilkan tanggal hari ini (Masehi & Hijriah)
🔹 !faktaunik ➝ 💡 Mengirimkan fakta unik
🔹 !quran [surat:ayat] ➝ 📖 Menampilkan ayat dan terjemahannya
🔹 !wiki [pertanyaan] ➝ 🌍 Mencari informasi dari Wikipedia

🔢 MATEMATIKA
🔹 !hitung [ekspresi] ➝ 🧮 Menghitung ekspresi matematika (contoh: !hitung 5+3*2)

🌍 BAHASA & TERJEMAHAN
🔹 !translate [kode bahasa] [teks] ➝ 🔄 Menerjemahkan teks ke bahasa lain (contoh: !translate en Pantai)

👥 GRUP & INTERAKSI
🔸 !tagall ➝ 📢 Mention semua anggota grup

💬 Coba sekarang! Kirim salah satu perintah di atas dan nikmati fiturnya! 🚀

Selamat bersenang-senang! 🎉
    `;
    sock.sendMessage(from, { text: menuText });
};

//Translate
async function translateText(textMessage, remoteJid, sock) {
  try {
    const args = textMessage.split(" ");
    if (args.length < 3) {
      await sock.sendMessage(remoteJid, {
        text: "⚠️ Format salah! Contoh: `!translate en Halo dunia`",
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

    const result = await translate(text, { to: lang });
    await sock.sendMessage(remoteJid, {
      text: `🔄 Terjemahan (${lang}): ${result.text}`,
    });
  } catch (error) {
    console.error("Error saat menerjemahkan:", error);
    await sock.sendMessage(remoteJid, {
      text: "❌ Gagal menerjemahkan teks. Pastikan kode bahasa benar!",
    });
  }
}


// 🔹 Fungsi untuk mention semua anggota grup
const mentionAll = async (from, sock) => {
    try {
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants.map((p) => p.id);
        await sock.sendMessage(from, {
            text:
                "👥 Mention All:\n" +
                participants.map((id) => `@${id.split("@")[0]}`).join("\n"),
            mentions: participants,
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
        const apiUrl = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
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
            text: `🎉 *@${sender.split("@")[0]}* benar! Angkanya adalah *${correctNumber}*. Selamat!`,
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

// 🔹 Fungsi untuk menampilkan tanggal dalam bahasa Indonesia
const sendDate = (from, sock) => {
    const masehi = moment().format("dddd, D MMMM YYYY");
    const hijri = moment().format("D MMMM YYYY");
    const dateText = `📅 *Tanggal Hari Ini*:\n📆 Masehi: ${masehi}\n🕌 Hijriah: ${hijri}`;
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
        text: `🧠 *Tebak Logika!*\n\n❓ ${randomQuestion.question}\n\nGunakan *!jawablogika [jawaban]* untuk menjawab.`,
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
            text: `🎉 *@${sender.split("@")[0]}* benar! Jawabannya adalah *${correctAnswer}*. Selamat!`,
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
            `https://api.alquran.cloud/v1/ayah/${surah}:${ayat}/editions/quran-uthmani,id.indonesian`,
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
    const randomPantun = pantunList[Math.floor(Math.random() * pantunList.length)];
    
    // Format pantun dalam bentuk teks
    const pantunText = `🎭 *Pantun untukmu!* 🎭\n\n${randomPantun.baris1}\n${randomPantun.baris2}\n${randomPantun.baris3}\n${randomPantun.baris4}`;

    // Kirim pantun ke pengguna
    sock.sendMessage(from, { text: pantunText });
}

startBot();
