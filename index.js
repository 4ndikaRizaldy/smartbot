require("dotenv").config();
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const moment = require("moment");
require("moment-hijri");
const axios = require("axios");
const math = require("mathjs");
const translate = require('google-translate-api-x');

// Konfigurasi bahasa untuk format tanggal Indonesia
moment.locale("id");

let guessingGame = {};
let logicGame = {};
let botActive = true; //default aktif

//Kode Bahasa
const validLanguages = [
    'af', 'sq', 'am', 'ar', 'hy', 'eu', 'bn', 'bs', 'bg', 'ca', 'zh-CN', 'zh-TW', 'hr', 'cs',
    'da', 'nl', 'en', 'et', 'tl', 'fi', 'fr', 'ka', 'de', 'el', 'gu', 'ht', 'he', 'hi', 'hu', 'is',
    'id', 'it', 'ja', 'kn', 'kk', 'km', 'ko', 'lv', 'lt', 'ms', 'mt', 'no', 'fa', 'pl', 'pt', 'pa',
    'ro', 'ru', 'sr', 'sk', 'sl', 'es', 'sw', 'sv', 'ta', 'te', 'th', 'tr', 'uk', 'ur', 'vi', 'cy', 'yi'
];

// 🔹 Daftar Auto Responder
const autoResponses = [
    {
        keyword: "smartbot!",
        response: "Aku siap membantu! Mau lihat fiturku? Coba ketik *!menu* 🤖",
    },
];

// 🔹 Fungsi untuk menangani auto response dengan mention
async function handleAutoResponse(message, remoteJid, senderId, sock) {
    const lowerMessage = message.toLowerCase();
    
    for (const auto of autoResponses) {
        if (lowerMessage.includes(auto.keyword)) {
            const responseText = auto.response.replace("{mention}", `@${senderId.split("@")[0]}`);
            
            await sock.sendMessage(remoteJid, {
                text: responseText,
                mentions: [senderId], // Mentions pengguna
            });
            return;
        }
    }
}


// 🔹 Daftar Pertanyaan Tebak Logika
const logicQuestions = [
    {
        question:
            "Aku selalu di depan kamu, tapi kamu tak bisa melihatku. Aku adalah?",
        answer: "masa depan",
        clue: "🔎 Sesuatu yang belum terjadi.",
    },
    {
        question:
            "Aku punya banyak kunci tapi tidak bisa membuka pintu. Aku adalah?",
        answer: "piano",
        clue: "🔎 Aku bisa menghasilkan musik.",
    },
    {
        question: "Apa yang bertambah besar ketika kamu ambil darinya?",
        answer: "lubang",
        clue: "🔎 Sesuatu yang kosong dan bisa bertambah luas.",
    },
    {
        question:
            "Semakin banyak kamu mengambilnya, semakin besar aku. Aku adalah?",
        answer: "nafas",
        clue: "🔎 Kamu membutuhkanku untuk hidup.",
    },
    {
        question:
            "Aku tidak punya tangan, tetapi aku bisa menunjuk. Aku adalah?",
        answer: "jam",
        clue: "🔎 Aku ada di dinding atau di pergelangan tanganmu.",
    },
    {
        question: "Aku bisa terisi air tapi tetap kering. Aku adalah?",
        answer: "spons",
        clue: "🔎 Aku sering dipakai saat mencuci piring.",
    },
    {
        question: "Aku bisa pecah jika kamu menyebut namaku. Aku adalah?",
        answer: "keheningan",
        clue: "🔎 Aku ada di tempat yang sunyi.",
    },
    {
        question:
            "Aku memiliki banyak huruf, tetapi bukan alfabet. Aku adalah?",
        answer: "kantong surat",
        clue: "🔎 Aku digunakan untuk mengirim pesan.",
    },
    {
        question: "Aku bisa naik tapi tidak pernah turun. Aku adalah?",
        answer: "umur",
        clue: "🔎 Setiap orang mengalaminya.",
    },
    {
        question:
            "Aku bisa berdiri tanpa kaki dan menangis tanpa mata. Aku adalah?",
        answer: "lilin",
        clue: "🔎 Aku sering digunakan saat mati lampu.",
    },
];

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
} else if (textMessage.startsWith("!ytmp3 ")) {
    downloadYouTubeMP3(textMessage, remoteJid, sock);
} else if (textMessage.startsWith("!wiki ")) {
    const query = textMessage.replace("!wiki ", "").trim();
    if (query) {
        searchWikipedia(query, remoteJid, sock);
    } else {
        sock.sendMessage(remoteJid, { text: "⚠️ Masukkan kata kunci setelah *!wiki* contoh: *!wiki Albert Einstein*" });
    }
} else if (textMessage === "!kluelogika") {
    giveLogicClue(remoteJid, sock);
} else if (textMessage.startsWith("!hitung ")) { 
    try {
        const expression = textMessage.replace("!hitung", "").trim();
        const result = math.evaluate(expression);
        await sock.sendMessage(remoteJid, { text: `Hasil: ${result}` });
    } catch (error) {
        await sock.sendMessage(remoteJid, { text: "⚠️ Format salah! Contoh: `!hitung 5+3*2`" });
    }
} else if (textMessage.startsWith("!translate ")) {
    translateText(textMessage, remoteJid, sock);
}
        else {
            // Auto-responder unik
            const foundResponse = autoResponses.find((r) =>
                textMessage.toLowerCase().includes(r.keyword),
            );
            if (foundResponse) {
                sock.sendMessage(remoteJid, { text: foundResponse.response });
            }
        }
    });
}

// 🔹 Fungsi untuk menampilkan menu
const showMenu = (from, sock) => {
    const menuText = `
    ✨ Selamat Datang di SMARTBOT! ✨
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
    const faktaList = [
        "💡 Otak manusia dapat menyimpan sekitar 2,5 petabyte informasi. (Scientific American, 2023)",
        "💡 Lebah bisa mengenali wajah manusia! (Journal of Experimental Biology, 2021)",
        "💡 Tidur kurang dari 6 jam sehari dapat menurunkan daya tahan tubuh. (National Sleep Foundation, 2024)",
        "💡 Jantung manusia berdetak lebih dari 100.000 kali sehari. (American Heart Association, 2022)",
        "💡 Air panas bisa membeku lebih cepat daripada air dingin, ini disebut efek Mpemba. (Physics World, 2023)",
        "💡 Jerapah hanya tidur sekitar 30 menit sehari dalam keadaan berdiri. (Smithsonian National Zoo, 2022)",
        "💡 Sidik jari koala sangat mirip dengan manusia hingga bisa membingungkan forensik. (Australian Koala Foundation, 2025)",
        "💡 Planet Venus berputar searah jarum jam, berbeda dari planet lain di tata surya. (NASA, 2024)",
        "💡 Manusia berbagi sekitar 60% DNA dengan pisang. (National Human Genome Research Institute, 2023)",
        "💡 Air liur manusia bisa mengurai makanan lebih cepat daripada asam baterai. (Journal of Oral Biosciences, 2022)",
        "💡 Zebra tidak memiliki warna putih dengan garis hitam, melainkan hitam dengan garis putih. (National Geographic, 2024)",
        "💡 Jika kita bisa mendengar suara di luar angkasa, matahari akan bersuara seperti deru mesin jet. (NASA, 2023)",
        "💡 Kucing memiliki tulang selangka yang tidak terhubung ke tulang lain, memungkinkan mereka masuk ke ruang sempit. (Smithsonian, 2024)",
        "💡 Pisang secara teknis adalah buah beri, tetapi stroberi bukan. (Botanical Science Journal, 2023)",
        "💡 Air mata manusia mengandung hormon yang bisa mengurangi stres saat menangis. (Harvard Medical School, 2023)",
        "💡 Hiu sudah ada di bumi lebih lama daripada pohon! Mereka muncul sekitar 400 juta tahun yang lalu. (Paleontology Journal, 2024)",
        "💡 Cahaya dari matahari membutuhkan sekitar 8 menit 20 detik untuk mencapai bumi. (NASA, 2024)",
        "💡 Ubur-ubur Turritopsis dohrnii dikenal sebagai ‘makhluk abadi’ karena bisa kembali ke tahap polip. (Marine Biology Research, 2023)",
        "💡 Madu adalah satu-satunya makanan yang tidak akan pernah basi, bahkan setelah ribuan tahun. (National Honey Board, 2023)",
        "💡 Pulau Paskah memiliki patung kepala raksasa, dan ternyata mereka memiliki tubuh di bawah tanah. (Archaeology Journal, 2022)",
        "💡 Gajah bisa mengenali diri mereka sendiri di cermin, menunjukkan tanda-tanda kesadaran diri. (Animal Cognition Journal, 2023)",
        "💡 Lumba-lumba memberi nama satu sama lain dengan peluit unik. (Marine Mammal Science, 2024)",
        "💡 Bekicot bisa tidur hingga tiga tahun dalam kondisi ekstrem. (Biology Letters, 2023)",
        "💡 Ada lebih banyak bintang di alam semesta daripada butiran pasir di semua pantai di bumi. (NASA, 2024)",
        "💡 Kecepatan bersin manusia bisa mencapai lebih dari 160 km/jam. (Medical News Today, 2023)",
        "💡 Jantung paus biru sebesar mobil kecil dan detaknya bisa terdengar dari 3 km jauhnya. (National Geographic, 2024)",
        "💡 Seekor gurita memiliki tiga jantung dan darahnya berwarna biru. (Marine Science Journal, 2023)",
        "💡 Bunga matahari bisa 'melihat' matahari dan bergerak mengikutinya sepanjang hari. (Botanical Review, 2024)",
        "💡 Listrik dari satu kilat bisa menyalakan lampu bohlam selama sekitar tiga bulan. (Weather Science, 2023)",
        "💡 Rasa gravitasi di puncak Gunung Everest lebih lemah dibandingkan di permukaan laut. (Geophysics Journal, 2024)",
        "💡 Katak bisa menelan makanan dengan menggunakan matanya untuk mendorong makanan ke dalam tenggorokan. (Zoology Research, 2023)",
        "💡 Siput memiliki ribuan gigi kecil dan bisa menggiling makanan dengan rahangnya. (Journal of Molluscan Studies, 2024)",
        "💡 Gunung berapi terbesar di tata surya adalah Olympus Mons di Mars, yang tiga kali lebih tinggi dari Gunung Everest. (NASA, 2023)",
        "💡 Setiap tahun, tubuh manusia mengganti hampir seluruh selnya, artinya kita seperti ‘orang baru’ setiap 7-10 tahun. (Science Journal, 2024)",
        "💡 Kupu-kupu bisa merasakan rasa dengan kaki mereka. (Entomology Research, 2023)",
        "💡 Air di bumi sudah ada selama lebih dari 4 miliar tahun, lebih tua dari matahari. (Geological Society, 2024)",
        "💡 Popcorn bisa meledak karena memiliki air di dalamnya yang menguap saat dipanaskan. (Food Science Journal, 2023)",
        "💡 Beruang kutub memiliki kulit hitam di bawah bulu putihnya untuk menyerap lebih banyak panas. (Arctic Research, 2024)",
        "💡 Planet Saturnus bisa mengapung di air jika ada kolam cukup besar, karena densitasnya lebih rendah dari air. (NASA, 2024)",
        "💡 Burung hantu tidak bisa menggerakkan bola matanya, jadi mereka memutar kepala hingga 270 derajat untuk melihat sekeliling. (Ornithology Journal, 2023)",
        "💡 Bayi hiu terkadang memakan saudaranya sendiri sebelum lahir dalam rahim ibu mereka. (Marine Biology Research, 2024)",
        "💡 Semut bisa mengangkat beban 50 kali lebih berat dari tubuhnya. (Entomology Journal, 2023)",
        "💡 Buaya tidak bisa menjulurkan lidahnya karena lidahnya melekat ke langit-langit mulut. (Zoological Journal, 2024)",
        "💡 Burung kolibri adalah satu-satunya burung yang bisa terbang mundur. (Bird Science, 2023)",
        "💡 Tikus bisa tertawa ketika mereka digelitik. (Animal Behavior Research, 2024)",
        "💡 Ada spesies ikan yang bisa berjalan di darat, salah satunya adalah ikan paru-paru (lungfish). (Marine Science, 2023)",
    ];

    // Pilih fakta secara acak
    const randomFakta = faktaList[Math.floor(Math.random() * faktaList.length)];

    // Kirim fakta unik ke pengguna
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

startBot();
