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
🔹 *!fitur* ➝ 📋 Menampilkan daftar fitur  
🔹 *!ping* ➝ 🏓 Mengecek apakah bot aktif  
🔹 *!tagall [pesan]* ➝ 📢 Menyebut semua anggota grup dengan pesan  
🔹 *!jumlahanggota* ➝ 👥 Menampilkan jumlah anggota grup  
🔹 *!tanggal* ➝ 📅 Mengirimkan tanggal saat ini  
🔹 *!faktaunik* ➝ 💡 Mengirimkan fakta unik secara acak  
🔹 *!motivasi* ➝ 🌟 Mengirimkan kutipan motivasi  
🔹 *!qrcode [teks/URL]* ➝ 📷 Membuat QR code dari teks atau URL  
🔹 *!shortlink [URL]* ➝ 🔗 Memperpendek link  
🔹 *!wiki [query]* ➝ 🌍 Mencari informasi di Wikipedia  
🔹 *!bing [query]* ➝ 🌐 Mencari informasi menggunakan Bing  
🔹 *!hitung [ekspresi]* ➝ 🧮 Menghitung hasil dari ekspresi matematika  
🔹 *!translate [teks]* ➝ 🔄 Menerjemahkan teks ke bahasa yang diinginkan  

🎮 *PERMAINAN & TEBAK-TEBAKAN* (Umum)  
━━━━━━━━━━━━━━━━━━  
🔹 *!tebaklogika* ➝ 🧠 Memulai permainan tebak logika  
🔹 *!jlogika [jawaban]* ➝ 💭 Memeriksa jawaban untuk permainan tebak logika  
🔹 *!kluelogika* ➝ 🧩 Memberikan petunjuk untuk permainan tebak logika  
🔹 *!tebakangka* ➝ 🎲 Memulai permainan tebak angka  
🔹 *!jangka [tebakan]* ➝ 🔢 Memeriksa tebakan angka  
🔹 *!acakhuruf* ➝ 🔠 Memulai permainan acak huruf  
🔹 *!survival* ➝ 🔥 Memulai permainan survival  
🔹 *!jhuruf [jawaban]* ➝ 🔤 Memeriksa jawaban untuk permainan huruf  
🔹 *!leaderboard* ➝ 🏆 Menampilkan papan peringkat pemain  
🔹 *!rank* ➝ 🎖 Menampilkan peringkat pengguna  
🔹 *!tantang [nomor telepon]* ➝ ⚔️ Menantang pemain lain untuk bertanding  

📚 *PENGETAHUAN* (Umum)  
━━━━━━━━━━━━━━━━━━  
🔹 *!quran [ayat]* ➝ 📖 Mengambil ayat dari Al-Quran  
🔹 *!pantun* ➝ 📜 Mengirimkan pantun secara acak  

⏰ *PENGINGAT (REMINDER)* (Umum)  
━━━━━━━━━━━━━━━━━━  
🔹 *!remind [teks]* ➝ 📅 Mengatur pengingat  
🔹 *!setremind [teks]* ➝ 🏷️ Mengatur pengingat dengan format tertentu  
🔹 *!gremind [teks]* ➝ 📅 Mengatur pengingat grup  
🔹 *!setgremind [teks]* ➝ 🏷️ Mengatur pengingat grup dengan format tertentu  
🔹 *!listremind* ➝ 📜 Menampilkan daftar pengingat yang telah diset  
🔹 *!cancelremind [id]* ➝ ❌ Membatalkan pengingat tertentu  
🔹 *!repeatremind [teks]* ➝ 🔁 Mengatur pengingat berulang  
🔹 *!repeatgremind [teks]* ➝ 🔁 Mengatur pengingat grup berulang  
🔹 *!stopremind [id]* ➝ ⛔ Menghentikan pengingat berulang tertentu  

👥 *MANAJEMEN GRUP & ADMIN* (Admin)  
━━━━━━━━━━━━━━━━━━  
🔹 *!setwelcome [pesan]* ➝ ✍️ Mengatur pesan sambutan untuk anggota baru  
🔹 *!setleave [pesan]* ➝ ✍️ Mengatur pesan perpisahan untuk anggota yang keluar  
🔹 *!getwelcome* ➝ 📥 Mengambil pesan sambutan yang telah diatur  
🔹 *!getleave* ➝ 📥 Mengambil pesan perpisahan yang telah diatur  
🔹 *!clearwelcome* ➝ ❌ Menghapus pesan sambutan  
🔹 *!clearleave* ➝ ❌ Menghapus pesan perpisahan  
🔹 *!greeting on/off* ➝ 🔄 Mengaktifkan atau menonaktifkan pesan sambutan otomatis  
🔹 *!bukagrup* ➝ 🔓 Membuka grup untuk anggota baru  
🔹 *!tutupgrup* ➝ 🔒 Menutup grup dari anggota baru  
🔹 *!jadwalbuka [HH:MM WIB/WITA/WIT]* ➝ ⏰ Menetapkan jadwal buka grup  
🔹 *!jadwaltutup [HH:MM WIB/WITA/WIT]* ➝ ⏰ Menetapkan jadwal tutup grup  
🔹 *!cekjadwal* ➝ 📆 Memeriksa jadwal grup yang telah diset  
🔹 *!hapusjadwal [buka/tutup]* ➝ ❌ Menghapus jadwal buka atau tutup grup  
🔹 *!add [nomor telepon]* ➝ ➕ Menambahkan anggota baru ke grup  
🔹 *!remove [nomor telepon]* ➝ ➖ Menghapus anggota dari grup  
🔹 *!kicknonadmin* ➝ 🛑 Mengeluarkan anggota non-admin dari grup  
🔹 *!promote [tag]* ➝ ⬆️ Mempromosikan anggota menjadi admin  
🔹 *!demote [tag]* ➝ ⬇️ Menurunkan status admin anggota  
🔹 *!announce [pesan]* ➝ 📢 Mengumumkan pesan kepada semua anggota grup  

📩 *SARAN & MASUKAN* (Umum)  
━━━━━━━━━━━━━━━━━━  
🔹 *!kritik [pesan]* ➝ ✍️ Mengirimkan kritik atau saran  
🔹 *!lihatkritik* ➝ 📜 Melihat kritik atau saran yang telah diajukan  

📊 *VOTING & POLLING* (Umum)  
━━━━━━━━━━━━━━━━━━  
🔹 *!vote [opsi]* ➝ 🗳 Memulai voting  
🔹 *!poll [pertanyaan]* ➝ 📊 Membuat polling  

📚 *MANAJEMEN GURU & AUTO-RESPONSE* (Admin)  
━━━━━━━━━━━━━━━━━━  
🔹 *!listajarin [halaman]* ➝ 📖 Menampilkan daftar respons yang telah dipelajari  
🔹 *!hapusajarin [id]* ➝ 🗑 Menghapus respons yang telah dipelajari  

💬 *GRUP & ADMIN* (Admin)  
━━━━━━━━━━━━━━━━━━  
🔹 *!setnamegc [nama baru]* ➝ ✏️ Mengubah nama grup  
🔹 *!setdescgc [deskripsi baru]* ➝ ✏️ Mengubah deskripsi grup  
🔹 *!groupinfo* ➝ ℹ️ Menampilkan informasi grup  
🔹 *!hidetag [pesan]* ➝ 📢 Mengirim pesan tanpa menyebut nama  
🔹 *!member [pesan]* ➝ 📩 Mengirim pesan ke semua anggota non-admin  
🔹 *!admin [pesan]* ➝ 📩 Mengirim pesan ke semua admin grup  
🔹 *!refreshgroup* ➝ 🔄 Memperbarui informasi grup  

🎲 *FITUR SERU* (Umum)  
━━━━━━━━━━━━━━━━━━  
🔹 *!roll* ➝ 🎲 Menggulung dadu  
🔹 *!fact* ➝ 💡 Mengambil fakta acak  
🔹 *!joke* ➝ 😂 Mengambil lelucon acak  
🔹 *!countdown [tanggal acara]* ➝ ⏳ Menghitung mundur hingga tanggal acara tertentu  
🔹 *!setrole "No" "Role"* ➝ 🎭 Memberikan role  
🔹 *!tag "role"* ➝ 📣 Mention sesuai role  
🔹 *!roles* ➝ 📋 Melihat daftar role  
🔹 *!delroles* ➝ ❌ Menghapus role  

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
