const moment = require("moment");
require("moment-hijri");
require("moment-timezone");
const axios = require("axios");
const translate = require("google-translate-api-x");

const {
  validLanguages,
  getRandomFakta,
  pantunList,
} = require("./data");
/* 📌 *INFO & UTILITAS* 
🔹 *!menu* ➝ 📋 Menampilkan daftar perintah  
🔹 *!ping* ➝ 🏓 Mengecek apakah bot aktif  
🔹 *!jumlahanggota* ➝ 👥 Menampilkan jumlah anggota grup  
🔹 *!shortlink [URL]* ➝ 🔗 Memperpendek link  
🔹 *!qrcode [teks]* ➝ 📷 Membuat Barcode  
*/
/* AWAL KODE INFO & UTILITAS*/
// TAMPILAN MENU
const showMenu = (from, isAdmin, sock) => {
  const menuText = `
✨ *SMARTBOT MENU* ✨
Hai! 🤖 Aku *SmartBot*, siap membantu dan menghibur kamu. Berikut daftar perintah yang bisa kamu gunakan:

📌 *INFO & UTILITAS* (Umum)  
━━━━━━━━━━━━━━━━━━  
🔹 *!menu* ➝ 📋 Menampilkan daftar perintah  
  *Contoh:* \`!menu\`  
🔹 *!ping* ➝ 🏓 Mengecek apakah bot aktif  
  *Contoh:* \`!ping\` → *Bot menjawab: "Pong! Bot aktif!"*  
🔹 *!jumlahanggota* ➝ 👥 Menampilkan jumlah anggota grup  
  *Contoh:* \`!jumlahanggota\`  
🔹 *!shortlink [URL]* ➝ 🔗 Memperpendek link  
  *Contoh:* \`!shortlink https://www.example.com\`  
🔹 *!qrcode [teks]* ➝ 📷 Membuat Barcode  
  *Contoh:* \`!qrcode SmartBot\`  

👥 *MANAJEMEN DIVISI* (Admin)  
━━━━━━━━━━━━━━━━━━  
📢 *Tag Divisi* ➝ *!tagdivisi [nama_divisi]*  
📜 *Daftar Divisi* ➝ *!listdivisi*  
➕ *Tambah User ke Divisi* ➝ *!setdivisi @user [nama_divisi]*  
❌ *Hapus User dari Divisi* ➝ *!removedivisi @user [nama_divisi]*  
🏢 *Tambah Divisi Baru* ➝ *!adddivisi [nama_divisi]*  

🎮 *PERMAINAN & TEBAK-TEBAKAN* (Umum)  
━━━━━━━━━━━━━━━━━━  
🎲 *Tebak Angka* ➝ *!tebakangka*  
🧠 *Tebak Logika* ➝ *!tebaklogika*  
🔠 *Acak Huruf* ➝ *!acakhuruf*  
⚔️ *1vs1 Acak Huruf* ➝ *!tantang @username*  
🔥 *Survival Mode* ➝ *!survival*  
🏆 *Leaderboard* ➝ *!leaderboard*  
🎖 *Rank & Hadiah Virtual* ➝ *!rank*  

📚 *INFO & PENGETAHUAN* (Umum)  
━━━━━━━━━━━━━━━━━━  
📅 *Tanggal* ➝ *!tanggal*  
💡 *Fakta Unik* ➝ *!faktaunik*  
📖 *Quran* ➝ *!quran [surat:ayat]*  
🌍 *Wikipedia* ➝ *!wiki [pertanyaan]*  
🔍 *Pencarian Bing* ➝ *!bing [pertanyaan]*  
📜 *Pantun* ➝ *!pantun*  
🌟 *Motivasi* ➝ *!motivasi*  

🔢 *MATEMATIKA* (Umum)  
━━━━━━━━━━━━━━━━━━  
🧮 *Kalkulator* ➝ *!hitung [ekspresi]*  

🌍 *BAHASA & TERJEMAHAN* (Umum)  
━━━━━━━━━━━━━━━━━━  
🔄 *Terjemahan* ➝ *!translate [kode bahasa] [teks]*  
🌏 *Kode Bahasa* ➝ *!kodenegara*  

⏰ *PENGINGAT (REMINDER)* (Umum)  
━━━━━━━━━━━━━━━━━━  
📅 *Setel Pengingat* ➝ *!setremind [waktu] [pesan]*  
📜 *Lihat Pengingat* ➝ *!listremind*  
🔁 *Pengingat Berulang* ➝ *!repeatremind [waktu] [pesan]*  

📚 *MANAJEMEN GURU & AUTO-RESPONSE* (Admin)  
━━━━━━━━━━━━━━━━━━  
👨‍🏫 *Tambah Guru* ➝ *!tambahguru [nomor]*  
📜 *Daftar Guru* ➝ *!listguru*  
❌ *Hapus Guru* ➝ *!hapusguru [nomor]*  
🤖 *Ajarkan Bot* ➝ *!ajarin [pertanyaan] = [jawaban]*  
📖 *Lihat Auto-Response* ➝ *!listajarin [halaman]*  
🗑 *Hapus Auto-Response* ➝ *!hapusajarin [pertanyaan]*  

👥 *GRUP & ADMIN* (Admin)  
━━━━━━━━━━━━━━━━━━  
📢 *Tag Semua* ➝ *!tagall [pesan opsional]*  
🔓 *Buka/Tutup Grup* ➝ *!bukagrup* | *!tutupgrup*  
➕ *Tambah Anggota* ➝ *!add [nomor]*  
🚪 *Keluarkan Anggota* ➝ *!remove [nomor]*  

💬 *Greeting Management*  
━━━━━━━━━━━━━━━━━━  
✍️ *Set Welcome Message* ➝ *!setwelcome [pesan]*  
  *Contoh:* \`!setwelcome Selamat datang di @group, @user!\`  
❌ *Clear Welcome Message* ➝ *!clearwelcome*  
📥 *Get Welcome Message* ➝ *!getwelcome*  
✍️ *Set Leave Message* ➝ *!setleave [pesan]*  
  *Contoh:* \`!setleave Selamat jalan, @user!\`  
❌ *Clear Leave Message* ➝ *!clearleave*  
📤 *Get Leave Message* ➝ *!getleave*  
✅ *Aktifkan Greeting* ➝ *!greeting on*  
❌ *Nonaktifkan Greeting* ➝ *!greeting off*  

📩 *SARAN & MASUKAN* (Umum)  
━━━━━━━━━━━━━━━━━━  
✍️ *Kirim Kritik* ➝ *!kritik [pesan]*  

🎲 *FITUR SERU* (Umum)  
━━━━━━━━━━━━━━━━━━  
🎲 *Roll Dadu* ➝ *!roll*  
😂 *Lelucon* ➝ *!joke*  
⏳ *Countdown Event* ➝ *!countdown [tanggal] [jam]*  

💬 *Coba sekarang!* Kirim salah satu perintah di atas dan nikmati fiturnya! 🚀
`;

  sock.sendMessage(from, { text: menuText });
};


// Fungsi untuk menghitung jumlah anggota grup
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

// Shortlink
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

/* AKHIR KODE INFO & UTILITAS*/

/* 📚 *INFO & PENGETAHUAN*  
━━━━━━━━━━━━━━━━━━  
📅 *Tanggal* ➝ *!tanggal* (Masehi & Hijriah)  
💡 *Fakta Unik* ➝ *!faktaunik*  
📖 *Quran* ➝ *!quran [surat:ayat]*  
🌍 *Wikipedia* ➝ *!wiki [pertanyaan]*  
🔍 *Pencarian Bing* ➝ *!bing [pertanyaan]*  
📜 *Pantun* ➝ *!pantun*  
🌟 *Motivasi* ➝ *!motivasi*  */
/* AWAL */
// TANGGAL
const sendDate = (from, sock) => {
  // Ambil zona waktu pengguna
  const userTimezone = moment.tz.guess();

  // Tentukan zona waktu Indonesia
  const timeZones = { 7: "WIB", 8: "WITA", 9: "WIT" };
  const timeOffset = moment().tz(userTimezone).utcOffset() / 60;
  const timeZone = timeZones[timeOffset] || "Zona Waktu Tidak Diketahui";

  // Format tanggal Masehi dalam bahasa Indonesia
  const masehi = moment()
    .tz(userTimezone)
    .locale("id")
    .format("dddd, D MMMM YYYY");

  // Format waktu
  const time = moment().tz(userTimezone).format("HH:mm:ss");

  // Kirim pesan tanpa Hijriah
  const dateText = `📅 *Tanggal dan Waktu Saat Ini*:\n📆 Masehi: ${masehi}\n⏰ Waktu: ${time} ${timeZone}`;

  sock.sendMessage(from, { text: dateText });
};

// FAKTA UNIK
const sendFaktaUnik = (from, sock) => {
  const randomFakta = getRandomFakta();
  sock.sendMessage(from, { text: randomFakta });
};

// AL QURAN DAN TERJEMAHAN
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

// WIKIPEDIA
const searchWikipedia = async (query, from, sock) => {
  try {
    // Encode the query to ensure it is URL-safe
    const apiUrl = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      query
    )}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    // Check for disambiguation or missing results
    if (data.type === "disambiguation") {
      sock.sendMessage(from, {
        text: `⚠️ Hasil pencarian terlalu luas. Coba lebih spesifik!\n\n🔗 Lihat lebih lanjut: ${data.content_urls.desktop.page}`,
      });
      return;
    }

    // Check if the response is valid and contains useful data
    if (!data || !data.extract || !data.title) {
      sock.sendMessage(from, {
        text: "⚠️ Maaf, tidak ada ringkasan yang ditemukan untuk pencarian ini.",
      });
      return;
    }

    // Format the response text in a more readable way
    const wikiText = `📖 *Wikipedia*\n\n*Judul:* ${data.title}\n\n${data.extract}\n\n🔗 Baca selengkapnya: ${data.content_urls.desktop.page}`;

    // Send the response message to the user
    sock.sendMessage(from, { text: wikiText });
  } catch (error) {
    // Handle different types of errors
    if (error.response) {
      // The API responded with an error
      sock.sendMessage(from, {
        text: `⚠️ Terjadi kesalahan saat mengambil data dari Wikipedia. Coba lagi nanti.`,
      });
    } else if (error.request) {
      // The request was made but no response was received
      sock.sendMessage(from, {
        text: `⚠️ Tidak ada respons dari Wikipedia. Pastikan koneksi internet stabil.`,
      });
    } else {
      // Something else went wrong
      sock.sendMessage(from, {
        text: `⚠️ Terjadi kesalahan tak terduga. Coba lagi nanti.`,
      });
    }
  }
};

// BING
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

// PANTUN
const sendPantun = (from, sock) => {
  // Memastikan pantunList tidak kosong
  if (!pantunList || pantunList.length === 0) {
    console.error("Pantun list is empty!");
    sock.sendMessage(from, {
      text: "⚠️ Maaf, tidak ada pantun yang tersedia.",
    });
    return;
  }

  try {
    const randomPantun =
      pantunList[Math.floor(Math.random() * pantunList.length)];

    // Format pantun dalam bentuk teks
    const pantunText = `🎭 *Pantun untukmu!* 🎭\n\n${randomPantun.baris1}\n${randomPantun.baris2}\n${randomPantun.baris3}\n${randomPantun.baris4}`;

    // Kirim pantun ke pengguna
    sock.sendMessage(from, { text: pantunText });
  } catch (error) {
    console.error("Error in sending pantun:", error.message);
    sock.sendMessage(from, {
      text: "⚠️ Terjadi kesalahan saat mengirim pantun.",
    });
  }
};

// MOTIVASI
async function sendMotivation(remoteJid, sock) {
  try {
    const response = await fetch("https://zenquotes.io/api/random");

    // Memeriksa status respons HTTP
    if (!response.ok) {
      throw new Error("Failed to fetch from API, status: " + response.status);
    }

    const data = await response.json();

    // Memastikan data sesuai format yang diharapkan
    if (
      data &&
      Array.isArray(data) &&
      data.length > 0 &&
      data[0].q &&
      data[0].a
    ) {
      const quote = `💡 *Motivasi Hari Ini:*\n\n"${data[0].q}"\n- ${data[0].a}`;
      sock.sendMessage(remoteJid, { text: quote });
    } else {
      sock.sendMessage(remoteJid, {
        text: "⚠️ Tidak ada kutipan tersedia saat ini.",
      });
    }
  } catch (error) {
    console.error("Error fetching motivation:", error.message); // Menambahkan log error untuk debugging
    sock.sendMessage(remoteJid, {
      text: "⚠️ Gagal mengambil kutipan motivasi. Silakan coba lagi nanti.",
    });
  }
}

/* AKHIR */

/* AWAL */
/* 🔢 *MATEMATIKA*  
━━━━━━━━━━━━━━━━━━  
🧮 *Kalkulator* ➝ *!hitung [ekspresi]* (contoh: !hitung 5+3*2)   */

/* 🌍 *BAHASA & TERJEMAHAN*  
━━━━━━━━━━━━━━━━━━  
🔄 *Terjemahan* ➝ *!translate [kode bahasa] [teks]* (contoh: !translate en Pantai)  
🌏 *Kode Bahasa* ➝ *!kodenegara*  */

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

/* AKHIR */
module.exports = {
  showMenu,
  countGroupMembers,
  shortLink,
  generateQRCode,

  sendDate,
  sendFaktaUnik,
  getQuranAyat,
  searchWikipedia,
  searchBingNoApi,
  sendPantun,
  sendMotivation,
  translateText,
};
