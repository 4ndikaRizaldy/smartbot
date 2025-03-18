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
  daftarKata,
} = require("./data");

// Konfigurasi bahasa untuk format tanggal Indonesia
moment.locale("id");

let guessingGame = {};
let logicGame = {};
let botActive = true; //default aktif

// 🔹 Fungsi untuk menangani auto response dengan mention
async function handleAutoResponse(message, remoteJid, sender, sock) {
  const lowerMessage = message.toLowerCase();

  for (const auto of autoResponses) {
    if (lowerMessage.includes(auto.keyword)) {
      const responseText = `@${sender.split("@")[0]} ${auto.response}`;

      await sock.sendMessage(remoteJid, {
        text: responseText,
        mentions: [sender], // Mentions pengguna
      });
      return;
    }
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });

  // Event handler untuk koneksi dan kredensial
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", (update) => {
    if (update.connection === "close") startBot();
    else if (update.connection === "open") console.log("✅ Bot siap!");
  });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

sock.ev.on("group-participants.update", async (update) => {
  console.log("🔄 Update diterima:", update); // Debugging log

  const { id, participants, action } = update;

  for (let participant of participants) {
    let userNumber = participant.replace("@s.whatsapp.net", "");

    if (action === "add") {
      console.log(`✅ Deteksi anggota baru: @${userNumber}`);

      await delay(2000); // Delay untuk memastikan update sudah stabil

      let welcomeMessage = `👋 *Selamat datang @${userNumber}!*  
Semoga betah di grup ini. Jangan lupa baca aturan ya! 😊`;

      await sock.sendMessage(id, {
        text: welcomeMessage,
        mentions: [participant],
      });

      console.log("📩 Pesan selamat datang dikirim ke:", userNumber);
    } else if (action === "remove") {
      console.log(`❌ Deteksi anggota keluar: @${userNumber}`);

      await delay(2000); // Delay untuk menghindari bug
      let goodbyeMessage = `😢 *Selamat tinggal @${userNumber}!*  
Semoga sukses dan sampai jumpa di lain waktu!`;

      await sock.sendMessage(id, {
        text: goodbyeMessage,
        mentions: [participant],
      });

      console.log("📩 Pesan selamat tinggal dikirim ke:", userNumber);
    }
  }
});





  // Event handler untuk pesan masuk
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
    const remoteJid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const textMessage =
      msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!textMessage) return;
    // **Filter agar bot tidak merespons dirinya sendiri**
    if (msg.key.fromMe) return;

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

    // Penanganan respons otomatis (auto-response)
    await handleAutoResponse(textMessage, remoteJid, sender, sock);

    // Penanganan pembelajaran dan respons kustom
    await handleLearning(textMessage, remoteJid, sender, sock);
    await handleCustomResponse(textMessage, remoteJid, sock);

    // Penanganan perintah guru (jika ada)
    await handleTeacherCommands(textMessage, remoteJid, sender, sock);

    // Penanganan perintah umum dan utilitas
    if (textMessage === "!fitur") {
      showMenu(remoteJid, sock);
    } else if (textMessage === "!ping") {
      sock.sendMessage(remoteJid, { text: "Pong! 🏓" });
    } else if (textMessage.startsWith("!tagall")) {
      const customMessage =
        textMessage.replace("!tagall", "").trim() || "👥 Mention All:";
      mentionAll(remoteJid, sock, customMessage);
    } else if (textMessage === "!jumlahanggota") {
      countGroupMembers(remoteJid, sock);
    } else if (textMessage === "!tanggal") {
      sendDate(remoteJid, sock);
    } else if (textMessage === "!faktaunik") {
      sendFaktaUnik(remoteJid, sock);
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
    } else if (textMessage.startsWith("!bing ")) {
      const query = textMessage.replace("!bing ", "").trim();
      if (query) {
        searchBingNoApi(query, remoteJid, sock);
      } else {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Masukkan kata kunci setelah *!bing* contoh: *!bing teknologi AI*",
        });
      }
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
    }

    // Penanganan permainan (games)
    else if (textMessage === "!tebaklogika") {
      startLogicGame(remoteJid, sock);
    } else if (textMessage.startsWith("!jlogika ")) {
      checkLogicAnswer(textMessage, remoteJid, sender, sock);
    } else if (textMessage === "!kluelogika") {
      giveLogicClue(remoteJid, sock);
    } else if (textMessage === "!tebakangka") {
      startGuessingGame(remoteJid, sock);
    } else if (textMessage.startsWith("!jangka ")) {
      checkGuess(textMessage, remoteJid, sender, sock);
    } else if (textMessage === "!acakhuruf") {
      startAcakHuruf(remoteJid, sender, sock);
    } else if (textMessage.startsWith("!jhuruf ")) {
      checkJawaban(remoteJid, sender, textMessage, sock);
    } else if (textMessage === "!leaderboard") {
      getLeaderboard(remoteJid, sock);
    } else if (textMessage === "!rank") {
      showRank(remoteJid, sender, sock);
    } else if (textMessage.startsWith("!tantang ")) {
      let opponentId = textMessage.split(" ")[1] + "@s.whatsapp.net";
      challengePlayer(remoteJid, sender, opponentId, sock);
    } else if (textMessage.startsWith("!quran ")) {
      getQuranAyat(textMessage, remoteJid, sock);
    } else if (textMessage.startsWith("!pantun")) {
      sendPantun(remoteJid, sock);
    }

    // Penanganan pengingat (reminder)
    else if (
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
    }

    // Penanganan pembelajaran (learning)
    else if (textMessage.startsWith("!listajarin")) {
      const args = textMessage.split(" ");
      const page = args.length > 1 ? parseInt(args[1], 10) : 1;
      await listLearnedResponses(remoteJid, sock, page);
    } else if (textMessage.startsWith("!hapusajarin ")) {
      await deleteLearnedResponse(textMessage, remoteJid, sock);
    }

    // Penanganan grup
    else if (textMessage === "!bukagrup") {
      await setGroupRestriction(remoteJid, sock, false);
    } else if (textMessage === "!tutupgrup") {
      await setGroupRestriction(remoteJid, sock, true);
    } else if (textMessage.startsWith("!jadwalbuka ")) {
      const time = textMessage.replace("!jadwalbuka ", "").trim();
      setGroupSchedule(remoteJid, time, "open", sock);
    } else if (textMessage.startsWith("!jadwaltutup ")) {
      const time = textMessage.replace("!jadwaltutup ", "").trim();
      setGroupSchedule(remoteJid, time, "close", sock);
    } else if (textMessage === "!cekjadwal") {
      if (!groupSchedules[remoteJid]) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Tidak ada jadwal yang diset untuk grup ini!",
        });
      } else {
        const schedule = groupSchedules[remoteJid];
        sock.sendMessage(remoteJid, {
          text: `📅 Jadwal Grup:\n🔓 Buka: ${
            schedule.open || "Belum diset"
          }\n🔒 Tutup: ${schedule.close || "Belum diset"}`,
        });
      }
    }
    if (textMessage.startsWith("!add ")) {
      const phoneNumbers = textMessage.replace("!add ", "").trim().split(" ");
      await addMultipleMembers(remoteJid, sender, sock, phoneNumbers);
    } else if (textMessage.startsWith("!remove ")) {
      const phoneNumbers = textMessage
        .replace("!remove ", "")
        .trim()
        .split(" ");
      await removeMultipleMembers(remoteJid, sender, sock, phoneNumbers);
    } else if (textMessage.startsWith("!promote ")) {
      const mentionedJid =
        msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
      if (mentionedJid) {
        await promoteMember(remoteJid, sender, sock, mentionedJid);
      } else {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Tag anggota yang ingin dipromote!",
        });
      }
    } else if (textMessage.startsWith("!demote ")) {
      const mentionedJid =
        msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
      if (mentionedJid) {
        await demoteMember(remoteJid, sender, sock, mentionedJid);
      } else {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Tag admin yang ingin didemote!",
        });
      }
    } else if (textMessage.startsWith("!announce ")) {
      const messageContent = textMessage.replace("!announce ", "").trim();
      await announceToAll(remoteJid, sender, sock, messageContent);
    } else if (textMessage.startsWith("!kritik ")) {
      const messageContent = textMessage.replace("!kritik ", "").trim();
      await submitFeedback(remoteJid, sender, sock, messageContent);
    } else if (textMessage === "!lihatkritik") {
      await viewFeedback(remoteJid, sender, sock);
    } else "Pilihan yang anda inginkan belum tersedia";
  });

  checkGroupSchedule(sock); // Mulai cek jadwal otomatis
}

const showMenu = (from, sock) => {
  const menuText = `
✨ *SMARTBOT MENU* ✨
Hai! 🤖 Aku *SmartBot*, siap membantu dan menghibur kamu. Berikut daftar perintah yang bisa kamu gunakan:

📌 *INFO & UTILITAS*  
━━━━━━━━━━━━━━━━━━  
🔹 *!menu* ➝ 📋 Menampilkan daftar perintah  
🔹 *!ping* ➝ 🏓 Mengecek apakah bot aktif  
🔹 *!jumlahanggota* ➝ 👥 Menampilkan jumlah anggota grup  
🔹 *!shortlink [URL]* ➝ 🔗 Memperpendek link  
🔹 *!qrcode [teks]* ➝ 📷 Membuat Barcode  

🎮 *PERMAINAN & TEBAK-TEBAKAN*  
━━━━━━━━━━━━━━━━━━  
🎲 *Tebak Angka* ➝ *!tebakangka* | *!jangka [angka]*  
🧠 *Tebak Logika* ➝ *!tebaklogika* | *!jlogika [jawaban]* | *!kluelogika*  
🔠 *Acak Huruf* ➝ *!acakhuruf* | *!jhuruf [kata]*  
⚔️ *1vs1 Acak Huruf* ➝ *!tantang @username*  
🔥 *Survival Mode* ➝ *!survival*  
🏆 *Leaderboard* ➝ *!leaderboard*  
🎖 *Rank & Hadiah Virtual* ➝ *!rank*  

📚 *INFO & PENGETAHUAN*  
━━━━━━━━━━━━━━━━━━  
📅 *Tanggal* ➝ *!tanggal* (Masehi & Hijriah)  
💡 *Fakta Unik* ➝ *!faktaunik*  
📖 *Quran* ➝ *!quran [surat:ayat]*  
🌍 *Wikipedia* ➝ *!wiki [pertanyaan]*  
🔍 *Pencarian Bing* ➝ *!bing [pertanyaan]*  
📜 *Pantun* ➝ *!pantun*  
🌟 *Motivasi* ➝ *!motivasi*  

🔢 *MATEMATIKA*  
━━━━━━━━━━━━━━━━━━  
🧮 *Kalkulator* ➝ *!hitung [ekspresi]* (contoh: !hitung 5+3*2)  

🌍 *BAHASA & TERJEMAHAN*  
━━━━━━━━━━━━━━━━━━  
🔄 *Terjemahan* ➝ *!translate [kode bahasa] [teks]* (contoh: !translate en Pantai)  
🌏 *Kode Bahasa* ➝ *!kodenegara*  

⏰ *PENGINGAT (REMINDER)*  
━━━━━━━━━━━━━━━━━━  
📅 *Setel Pengingat* ➝ *!setremind [tanggal] [jam] [pesan]*  
🏷️ *Setel Pengingat Grup* ➝ *!setgremind [tanggal] [jam] [pesan]*  
📜 *Lihat Pengingat* ➝ *!listremind*  
❌ *Hapus Pengingat* ➝ *!cancelremind [ID]*  
🔁 *Pengingat Berulang* ➝ *!repeatremind [waktu] [pesan]* | *!stoprepeat*  

👨‍🏫 *MANAJEMEN GURU*  
━━━━━━━━━━━━━━━━━━  
✍️ *Tambah Guru* ➝ *!tambahguru [nomor]*  
📜 *Daftar Guru* ➝ *!listguru*  
❌ *Hapus Guru* ➝ *!hapusguru [nomor]*  

📖 *MANAJEMEN AUTO-RESPONSE*  
━━━━━━━━━━━━━━━━━━  
🤖 *Ajarkan Bot* ➝ *!ajarin [pertanyaan] = [jawaban]*  
📖 *Lihat Auto-Response* ➝ *!listajarin [halaman]*  
🗑 *Hapus Auto-Response* ➝ *!hapusajarin [pertanyaan]*  

👥 *GRUP & ADMIN*  
━━━━━━━━━━━━━━━━━━  
📢 *Tag Semua* ➝ *!tagall [pesan opsional]*  
🔓 *Buka/Tutup Grup* ➝ *!bukagrup* | *!tutupgrup*  
⏰ *Jadwal Grup* ➝ *!jadwalbuka [jam]* | *!jadwaltutup [jam]* | *!cekjadwal*  
➕ *Tambah Anggota* ➝ *!add [nomor]* | 🚪 *Keluarkan* ➝ *!remove [nomor]*  
👤 *Promote/Demote Admin* ➝ *!promote [@user]* | *!demote [@user]*  

📩 *SARAN & MASUKAN*  
━━━━━━━━━━━━━━━━━━  
✍️ *Kirim Kritik* ➝ *!kritik*  
📜 *Lihat Kritik* ➝ *!lihatkritik*  

💬 *Coba sekarang!* Kirim salah satu perintah di atas dan nikmati fiturnya! 🚀  
  `;

  sock.sendMessage(from, { text: menuText });
};


// Fungsi untuk menerjemahkan teks
async function translateText(textMessage, remoteJid, sock) {
  try {
    const args = textMessage.split(" ");

    // Validasi format input
    if (args.length < 3) {
      await sock.sendMessage(remoteJid, {
        text: "⚠️ Format salah! Contoh: `!translate en Halo dunia. Apa kabar?` \nKetik `!kodenegara` untuk melihat kode bahasa yang tersedia.",
      });
      return;
    }

    const lang = args[1]; // Ambil kode bahasa
    const text = args.slice(2).join(" "); // Gabungkan teks setelah kode bahasa

    // Periksa apakah kode bahasa valid
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

    // Kirim hasil terjemahan
    await sock.sendMessage(remoteJid, {
      text: `🔄 Terjemahan (${lang}): ${translatedText}`,
    });

  } catch (error) {
    console.error("❌ Error saat menerjemahkan:", error);
    await sock.sendMessage(remoteJid, {
      text: "❌ Gagal menerjemahkan teks. Pastikan kode bahasa benar!",
    });
  }
}





let gameAcakHuruf = {}; // { chatId: { kata: "komputer", jawaban: "komputer", pemain: "userId" } }
let poinUser = {}; // { "userId": 10 }
let levelUser = {}; // { "userId": 1 }

function pilihKata() {
  let kata = daftarKata[Math.floor(Math.random() * daftarKata.length)];
  let hurufAcak = kata
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
  return { kata, hurufAcak };
}

function startAcakHuruf(remoteJid, sender, sock) {
  if (gameAcakHuruf[remoteJid]) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Masih ada permainan yang sedang berlangsung!",
    });
    return;
  }

  let { kata, hurufAcak } = pilihKata();
  gameAcakHuruf[remoteJid] = { kata, jawaban: kata, pemain: sender };

  sock.sendMessage(remoteJid, {
    text: `🔀 *Tebak Kata Acak!*  
🎭 Susun kata dari huruf berikut: *${hurufAcak}*  
⏳ Jawab dalam 30 detik dengan *!jhuruf [kata]*`,
  });

  setTimeout(() => {
    if (gameAcakHuruf[remoteJid]) {
      sock.sendMessage(remoteJid, {
        text: `⏳ Waktu habis! Jawaban: *${gameAcakHuruf[remoteJid].jawaban}*`,
      });
      delete gameAcakHuruf[remoteJid];
    }
  }, 30000);
}

function checkJawaban(remoteJid, sender, textMessage, sock) {
  if (!gameAcakHuruf[remoteJid]) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Tidak ada permainan aktif! Mulai dengan *!acakhuruf*.",
    });
    return;
  }

  let jawabanUser = textMessage.split(" ")[1].toLowerCase();
  let game = gameAcakHuruf[remoteJid];

  if (jawabanUser === game.jawaban) {
    let poin = (poinUser[sender] || 0) + 10;
    poinUser[sender] = poin;

    let level = Math.floor(poin / 50) + 1;
    levelUser[sender] = level;

    sock.sendMessage(remoteJid, {
      text: `✅ *Benar!* 🎉  
+10 Poin untuk *${sender}*!  
Total Poin: *${poin}*  
📈 Level: *${level}*`,
    });

    delete gameAcakHuruf[remoteJid];
  } else {
    sock.sendMessage(remoteJid, { text: "❌ *Salah!* Coba lagi!" });
  }
}

function getLeaderboard(remoteJid, sock) {
  let leaderboard = Object.entries(poinUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(
      (user, index) =>
        `#${index + 1} @${user[0].split("@")[0]} - ${user[1]} Poin (Lvl ${
          levelUser[user[0]] || 1
        })`
    )
    .join("\n");

  sock.sendMessage(remoteJid, {
    text: `🏆 *Leaderboard:*  
${leaderboard || "Belum ada pemain!"}`,
  });
}

function getRank(poin) {
  if (poin >= 500) return "🔥 *Grandmaster*";
  if (poin >= 300) return "🌟 *Master*";
  if (poin >= 100) return "🥇 *Gold*";
  return "🔰 *Bronze*";
}

function showRank(remoteJid, sender, sock) {
  let poin = poinUser[sender] || 0;
  let rank = getRank(poin);

  sock.sendMessage(remoteJid, {
    text: `🏅 *Rank Kamu:*  
👤 Nama: *${sender}*  
✨ Poin: *${poin}*  
📊 Rank: ${rank}`,
  });
}

function challengePlayer(remoteJid, sender, opponentId, sock) {
  if (!opponentId) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Gunakan *!tantang @user* untuk menantang seseorang!",
    });
    return;
  }

  if (gameAcakHuruf[remoteJid]) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Masih ada permainan yang berjalan!",
    });
    return;
  }

  let { kata, hurufAcak } = pilihKata();
  gameAcakHuruf[remoteJid] = {
    kata,
    jawaban: kata,
    pemain: sender,
    lawan: opponentId,
  };

  sock.sendMessage(remoteJid, {
    text: `🔥 *Duel 1v1!*  
🎭 Susun kata dari huruf: *${hurufAcak}*  
⏳ Jawab dengan *!jhuruf [kata]*`,
  });

  setTimeout(() => {
    if (gameAcakHuruf[remoteJid]) {
      sock.sendMessage(remoteJid, {
        text: `⏳ Waktu habis! Jawaban: *${gameAcakHuruf[remoteJid].jawaban}*`,
      });
      delete gameAcakHuruf[remoteJid];
    }
  }, 30000);
}


// Pencarian BING
const cheerio = require("cheerio");

const searchBingNoApi = async (query, from, sock) => {
  try {
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(
      query
    )}`;
    const response = await axios.get(searchUrl, { timeout: 10000 });
    const $ = cheerio.load(response.data);

    let results = [];
    $("li.b_algo h2 a").each((i, el) => {
      if (i < 3) {
        const title = $(el).text();
        const link = $(el).attr("href");
        results.push(`🔍 *${title}*\n🔗 ${link}`);
      }
    });

    if (results.length === 0) {
      sock.sendMessage(from, { text: "⚠️ Tidak ada hasil ditemukan." });
      return;
    }

    const searchText = `🔎 *Hasil Pencarian Bing:*\n\n${results.join("\n\n")}`;
    sock.sendMessage(from, { text: searchText });
  } catch (error) {
    console.error("Error Bing Search:", error.message);
    sock.sendMessage(from, {
      text: "⚠️ Terjadi kesalahan saat mencari di Bing.",
    });
  }
};



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
    text: "🎲 Tebak angka dari 1 hingga 10! Gunakan perintah *!jangka X* untuk menjawab.",
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
    sock.sendMessage(remoteJid, {
      text: "📌 Tidak ada reminder yang tersimpan.",
    });
    return;
  }

  let message = "📌 *Daftar Reminder:*\n";
  reminders.forEach((reminder, index) => {
    message += `\n*${index + 1}.* 📅 ${
      reminder.date
        ? `Tanggal: ${reminder.date}`
        : `Hari: ${reminder.days.join(", ")}`
    }\n🕒 Jam: ${reminder.time}\n📢 Pesan: ${reminder.message}\n📍 ${
      reminder.isGroup ? "Grup" : "Pribadi"
    }\n`;
  });

  sock.sendMessage(remoteJid, { text: message });
};

// Fungsi untuk menghapus reminder berdasarkan ID (urutan)
const cancelReminder = (textMessage, remoteJid, sock) => {
  const args = textMessage.split(" ");
  if (args.length < 2) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Gunakan format *!cancelremind <ID>*",
    });
    return;
  }

  const id = parseInt(args[1]) - 1;
  let reminders = loadReminders();

  if (id < 0 || id >= reminders.length) {
    sock.sendMessage(remoteJid, {
      text: `⚠️ Reminder dengan ID *${args[1]}* tidak ditemukan!`,
    });
    return;
  }

  reminders.splice(id, 1);
  saveReminders(reminders);

  sock.sendMessage(remoteJid, {
    text: `✅ Reminder *${args[1]}* telah dihapus!`,
  });
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

//Ajrin Bot

// **Memuat database guru dari file JSON**
const loadTeachers = () => {
  try {
    return JSON.parse(fs.readFileSync("teachers.json", "utf8"));
  } catch (error) {
    return [];
  }
};

// **Menyimpan daftar guru ke file JSON**
const saveTeachers = (data) => {
  fs.writeFileSync("teachers.json", JSON.stringify(data, null, 2));
};

let teachers = loadTeachers();
const ADMIN_GURU = "6285253435963"; // Nomor admin utama yang dapat menambah/menghapus guru

async function handleTeacherCommands(textMessage, remoteJid, sender, sock) {
  // **Tambah Guru**
  if (textMessage.startsWith("!tambahguru ")) {
    if (sender.replace(/[^0-9]/g, "") !== ADMIN_GURU) {
      await sock.sendMessage(remoteJid, { text: "⚠️ Kamu bukan admin guru!" });
      return;
    }

    const newTeacher = textMessage
      .replace("!tambahguru ", "")
      .trim()
      .replace(/[^0-9]/g, "");

    if (!newTeacher || newTeacher.length < 10) {
      await sock.sendMessage(remoteJid, { text: "⚠️ Nomor tidak valid!" });
      return;
    }

    if (teachers.includes(newTeacher)) {
      await sock.sendMessage(remoteJid, {
        text: `✅ Nomor ${newTeacher} sudah terdaftar sebagai guru!`,
      });
      return;
    }

    teachers.push(newTeacher);
    saveTeachers(teachers);

    await sock.sendMessage(remoteJid, {
      text: `✅ Berhasil menambahkan *${newTeacher}* sebagai guru!`,
    });
  }

  // **Melihat Daftar Guru**
  else if (textMessage === "!listguru") {
    if (teachers.length === 0) {
      await sock.sendMessage(remoteJid, {
        text: "📭 Belum ada guru yang terdaftar!",
      });
      return;
    }

    let response = "📚 **Daftar Guru:**\n";
    teachers.forEach((teacher, index) => {
      response += `${index + 1}. *${teacher}*\n`;
    });

    await sock.sendMessage(remoteJid, { text: response });
  }

  // **Hapus Guru**
  else if (textMessage.startsWith("!hapusguru ")) {
    if (sender.replace(/[^0-9]/g, "") !== ADMIN_GURU) {
      await sock.sendMessage(remoteJid, { text: "⚠️ Kamu bukan admin guru!" });
      return;
    }

    const teacherToRemove = textMessage
      .replace("!hapusguru ", "")
      .trim()
      .replace(/[^0-9]/g, "");

    if (!teachers.includes(teacherToRemove)) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ Nomor ${teacherToRemove} tidak ditemukan dalam daftar guru!`,
      });
      return;
    }

    teachers = teachers.filter((teacher) => teacher !== teacherToRemove);
    saveTeachers(teachers);

    await sock.sendMessage(remoteJid, {
      text: `✅ Berhasil menghapus *${teacherToRemove}* dari daftar guru!`,
    });
  }
}

// Memuat database auto-response dari file JSON
const loadResponses = () => {
  try {
    return JSON.parse(fs.readFileSync("responses.json", "utf8"));
  } catch (error) {
    return {};
  }
};

// Menyimpan auto-response ke file JSON
const saveResponses = (data) => {
  fs.writeFileSync("responses.json", JSON.stringify(data, null, 2));
};

const responses = loadResponses();

async function handleLearning(textMessage, remoteJid, sender, sock) {
  if (textMessage.startsWith("!ajarin ")) {
    const teachers = loadTeachers();
    const senderNumber = sender.replace(/[^0-9]/g, "");

    // **Cek apakah pengirim adalah guru**
    if (!teachers.includes(senderNumber)) {
      await sock.sendMessage(remoteJid, {
        text: "⚠️ Kamu bukan guru! Hanya guru yang bisa mengajarkan bot.",
      });
      return;
    }

    const content = textMessage.replace("!ajarin ", "").trim();
    const [question, answer] = content.split(" = ");

    if (!question || !answer) {
      await sock.sendMessage(remoteJid, {
        text: "⚠️ Format salah! Gunakan: `!ajarin [pertanyaan] = [jawaban]`",
      });
      return;
    }

    responses[question.toLowerCase()] = answer;
    saveResponses(responses);

    await sock.sendMessage(remoteJid, {
      text: `✅ Aku sudah belajar!\n\nPertanyaan: *${question}*\nJawaban: *${answer}*`,
    });
  }
}

async function handleCustomResponse(textMessage, remoteJid, sock) {
  const response = responses[textMessage.toLowerCase()];
  if (response) {
    await sock.sendMessage(remoteJid, { text: response });
  }
}

async function listLearnedResponses(remoteJid, sock, page = 1) {
  const responses = loadResponses(); // Memuat database yang sudah diajarkan
  const keys = Object.keys(responses);

  if (keys.length === 0) {
    await sock.sendMessage(remoteJid, {
      text: "📭 Belum ada pertanyaan yang diajarkan ke aku!",
    });
    return;
  }

  const itemsPerPage = 10; // Jumlah item per halaman
  const totalPages = Math.ceil(keys.length / itemsPerPage);

  // Pastikan halaman tidak melebihi total halaman
  page = Math.max(1, Math.min(page, totalPages));

  let responseList = `📚 **Daftar yang sudah diajarkan (Halaman ${page}/${totalPages})**\n\n`;
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  keys.slice(start, end).forEach((question, index) => {
    responseList += `${start + index + 1}. *${question}*\n`;
  });

  responseList += `\nGunakan *!listajarin ${
    page + 1
  }* untuk halaman berikutnya.`;

  await sock.sendMessage(remoteJid, { text: responseList });
}

async function deleteLearnedResponse(textMessage, remoteJid, sock) {
  const responses = loadResponses();
  const question = textMessage.replace("!hapusajarin ", "").trim();

  if (!responses[question]) {
    await sock.sendMessage(remoteJid, {
      text: `⚠️ Aku tidak menemukan pertanyaan: *"${question}"* dalam database!`,
    });
    return;
  }

  delete responses[question];
  saveResponses(responses);

  await sock.sendMessage(remoteJid, {
    text: `✅ Berhasil menghapus: *"${question}"* dari daftar ajaran!`,
  });
}

// Buka tutup Grup
async function setGroupRestriction(groupId, sock, isClosed) {
  try {
    await sock.groupSettingUpdate(
      groupId,
      isClosed ? "announcement" : "not_announcement"
    );
    console.log(`✅ Grup ${groupId} ${isClosed ? "ditutup" : "dibuka"}`);
  } catch (error) {
    console.error("❌ Gagal mengubah status grup:", error);
    sock.sendMessage(groupId, {
      text: "⚠️ Bot harus jadi admin untuk membuka/menutup grup!",
    });
  }
}

let groupSchedules = {}; // Simpan jadwal per grup

function setGroupSchedule(groupId, time, action, sock) {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    sock.sendMessage(groupId, {
      text: "⚠️ Format waktu salah! Gunakan HH:MM (contoh: 07:00)",
    });
    return;
  }

  if (!groupSchedules[groupId]) {
    groupSchedules[groupId] = {};
  }

  groupSchedules[groupId][action] = time;
  sock.sendMessage(groupId, {
    text: `✅ Grup akan *${
      action === "open" ? "dibuka" : "ditutup"
    }* pada ${time}`,
  });
}

async function checkGroupSchedule(sock) {
  setInterval(async () => {
    const now = moment().tz("Asia/Jakarta").format("HH:mm");
    console.log(`⏰ Mengecek jadwal... Sekarang: ${now}`);

    for (const group in groupSchedules) {
      const schedule = groupSchedules[group];

      if (schedule.open === now) {
        console.log(`🔓 Membuka grup ${group} pada ${now}`);
        await setGroupRestriction(group, sock, false);
        sock.sendMessage(group, { text: "🔓 Grup telah dibuka otomatis!" });
      }

      if (schedule.close === now) {
        console.log(`🔒 Menutup grup ${group} pada ${now}`);
        await setGroupRestriction(group, sock, true);
        sock.sendMessage(group, { text: "🔒 Grup telah ditutup otomatis!" });
      }
    }
  }, 60000); // Cek tiap 1 menit
}

// Fungsi untuk mengecek apakah pengirim adalah admin
async function isUserAdmin(remoteJid, sender, sock) {
  try {
    const groupMetadata = await sock.groupMetadata(remoteJid);
    const isAdmin = groupMetadata.participants.some(
      (p) =>
        p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
    );
    return isAdmin;
  } catch (error) {
    console.log("❌ Gagal mengambil metadata grup:", error);
    return false;
  }
}

// Fungsi untuk menambahkan anggota ke grup
async function addMultipleMembers(remoteJid, sender, sock, phoneNumbers) {
  if (!(await isUserAdmin(remoteJid, sender, sock))) {
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Hanya admin yang bisa menambahkan anggota!",
    });
    return;
  }

  try {
    const userJids = phoneNumbers.map((num) => `${num}@s.whatsapp.net`);
    await sock.groupParticipantsUpdate(remoteJid, userJids, "add");

    await sock.sendMessage(remoteJid, {
      text: `✅ Berhasil menambahkan: ${phoneNumbers.join(", ")}`,
      mentions: userJids,
    });
  } catch (error) {
    console.log("❌ Gagal menambahkan anggota:", error);
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Gagal menambahkan beberapa anggota.",
    });
  }
}

// Fungsi untuk menghapus anggota dari grup
async function removeMultipleMembers(remoteJid, sender, sock, phoneNumbers) {
  if (!(await isUserAdmin(remoteJid, sender, sock))) {
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Hanya admin yang bisa mengeluarkan anggota!",
    });
    return;
  }

  try {
    const userJids = phoneNumbers.map((num) => `${num}@s.whatsapp.net`);
    await sock.groupParticipantsUpdate(remoteJid, userJids, "remove");

    await sock.sendMessage(remoteJid, {
      text: `❌ Berhasil mengeluarkan: ${phoneNumbers.join(", ")}`,
      mentions: userJids,
    });
  } catch (error) {
    console.log("❌ Gagal mengeluarkan anggota:", error);
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Gagal mengeluarkan beberapa anggota.",
    });
  }
}

// Promote dan Demote
async function promoteMember(remoteJid, sender, sock, mentionedJid) {
  try {
    const groupMetadata = await sock.groupMetadata(remoteJid);
    const groupAdmins = groupMetadata.participants
      .filter((member) => member.admin)
      .map((admin) => admin.id);

    if (!groupAdmins.includes(sender)) {
      return sock.sendMessage(remoteJid, {
        text: "⚠️ Kamu bukan admin grup!",
      });
    }

    await sock.groupParticipantsUpdate(remoteJid, mentionedJid, "promote");
    sock.sendMessage(remoteJid, {
      text: `✅ Berhasil promote ${mentionedJid.join(", ")} menjadi admin.`,
    });
  } catch (error) {
    console.error("Error promoting member:", error);
    sock.sendMessage(remoteJid, { text: "⚠️ Gagal promote member." });
  }
}

async function demoteMember(remoteJid, sender, sock, mentionedJid) {
  try {
    const groupMetadata = await sock.groupMetadata(remoteJid);
    const groupAdmins = groupMetadata.participants
      .filter((member) => member.admin)
      .map((admin) => admin.id);

    if (!groupAdmins.includes(sender)) {
      return sock.sendMessage(remoteJid, {
        text: "⚠️ Kamu bukan admin grup!",
      });
    }

    await sock.groupParticipantsUpdate(remoteJid, mentionedJid, "demote");
    sock.sendMessage(remoteJid, {
      text: `✅ Berhasil demote ${mentionedJid.join(
        ", "
      )} menjadi anggota biasa.`,
    });
  } catch (error) {
    console.error("Error demoting member:", error);
    sock.sendMessage(remoteJid, { text: "⚠️ Gagal demote member." });
  }
}

async function announceToAll(remoteJid, sender, sock, message) {
  try {
    const groupMetadata = await sock.groupMetadata(remoteJid);
    const participants = groupMetadata.participants.map((member) => member.id);

    // Pastikan hanya admin yang bisa melakukan pengumuman
    const groupAdmins = groupMetadata.participants
      .filter((member) => member.admin)
      .map((admin) => admin.id);

    if (!groupAdmins.includes(sender)) {
      return sock.sendMessage(remoteJid, {
        text: "⚠️ Kamu bukan admin grup!",
      });
    }

    await sock.sendMessage(remoteJid, {
      text: `📢 *Pengumuman!*\n\n${message}`,
      mentions: participants, // Mentions tanpa menampilkan nomor
    });
  } catch (error) {
    console.error("Error sending announcement:", error);
    sock.sendMessage(remoteJid, { text: "⚠️ Gagal mengirim pengumuman." });
  }
}

//feedback
const feedbackFile = "feedback.json";

// Fungsi untuk membaca data feedback
function readFeedback() {
  try {
    const data = fs.readFileSync(feedbackFile);
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Fungsi untuk menyimpan kritik & saran
function saveFeedback(feedback) {
  const feedbackList = readFeedback();
  feedbackList.push(feedback);
  fs.writeFileSync(feedbackFile, JSON.stringify(feedbackList, null, 2));
}

// Fungsi untuk menerima kritik & saran dari anggota grup
async function submitFeedback(remoteJid, sender, sock, message) {
  try {
    const feedback = {
      sender: sender.replace("@s.whatsapp.net", ""),
      message: message,
      timestamp: new Date().toISOString(),
    };

    saveFeedback(feedback);

    sock.sendMessage(remoteJid, {
      text: "✅ Terima kasih! Kritik & saran kamu sudah disimpan.",
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    sock.sendMessage(remoteJid, { text: "⚠️ Gagal menyimpan kritik & saran." });
  }
}

// Fungsi untuk melihat daftar kritik & saran
async function viewFeedback(remoteJid, sender, sock) {
  try {
    const feedbackList = readFeedback();

    if (feedbackList.length === 0) {
      return sock.sendMessage(remoteJid, {
        text: "📭 Belum ada kritik & saran yang masuk.",
      });
    }

    let response = "📋 *Daftar Kritik & Saran:*\n\n";
    feedbackList.forEach((feedback, index) => {
      response += `${index + 1}. *${feedback.message}*\n   _Dari: ${
        feedback.sender
      }_\n\n`;
    });

    sock.sendMessage(remoteJid, { text: response });
  } catch (error) {
    console.error("Error viewing feedback:", error);
    sock.sendMessage(remoteJid, {
      text: "⚠️ Gagal menampilkan kritik & saran.",
    });
  }
}

// Auto Download


startBot();
