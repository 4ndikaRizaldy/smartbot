// data.js

// 🔹 Daftar Kode Bahasa
const validLanguages = [
  "af",
  "sq",
  "am",
  "ar",
  "hy",
  "eu",
  "bn",
  "bs",
  "bg",
  "ca",
  "zh-CN",
  "zh-TW",
  "hr",
  "cs",
  "da",
  "nl",
  "en",
  "et",
  "tl",
  "fi",
  "fr",
  "ka",
  "de",
  "el",
  "gu",
  "ht",
  "he",
  "hi",
  "hu",
  "is",
  "id",
  "it",
  "ja",
  "kn",
  "kk",
  "km",
  "ko",
  "lv",
  "lt",
  "ms",
  "mt",
  "no",
  "fa",
  "pl",
  "pt",
  "pa",
  "ro",
  "ru",
  "sr",
  "sk",
  "sl",
  "es",
  "sw",
  "sv",
  "ta",
  "te",
  "th",
  "tr",
  "uk",
  "ur",
  "vi",
  "cy",
  "yi",
];

// 🔹 Daftar Auto Responder
const autoResponses = [
  {
    keyword: "smartbot!",
    response: "Aku siap membantu! Mau lihat fiturku? Coba ketik *!menu* 🤖",
  },
  {
    keyword: "!fitur",
    response: `✨ *SMARTBOT MENU* ✨  
Hai! 🤖 Aku *SmartBot*, siap membantu kamu! Berikut fitur yang tersedia:  

📌 *UTILITAS*  
━━━━━━━━━━━━━━━━━━  
➤ *!fitur* – 📋 Tampilkan menu fitur yang tersedia  
➤ *!ping* – 🏓 Cek apakah bot aktif  
➤ *!jumlahanggota* – 👥 Cek jumlah anggota grup  
➤ *!tanggal* – 📅 Kirimkan tanggal saat ini  
➤ *!faktaunik* – 💡 Kirimkan fakta unik secara acak  
➤ *!motivasi* – 🌟 Kirimkan kutipan motivasi  
➤ *!qrcode [teks/URL]* – 📷 Hasilkan QR code dari teks atau URL yang diberikan  
➤ *!shortlink [URL]* – 🔗 Hasilkan link pendek dari URL yang diberikan  
➤ *!wiki [query]* – 🌍 Cari informasi di Wikipedia berdasarkan query  
➤ *!bing [query]* – 🌐 Mencari informasi menggunakan Bing  
➤ *!hitung [ekspresi]* – 🧮 Hitung hasil dari ekspresi matematika yang diberikan  
➤ *!translate [teks]* – 🔄 Menerjemahkan teks ke bahasa yang diinginkan  

🎮 *PERMAINAN*  
━━━━━━━━━━━━━━━━━━  
➤ *!tebaklogika* – 🧠 Memulai permainan tebak logika  
➤ *!jlogika [jawaban]* – 💭 Memeriksa jawaban untuk permainan tebak logika  
➤ *!kluelogika* – 🧩 Memberikan petunjuk untuk permainan tebak logika  
➤ *!tebakangka* – 🎲 Memulai permainan tebak angka  
➤ *!jangka [tebakan]* – 🔢 Memeriksa tebakan angka  
➤ *!acakhuruf* – 🔠 Memulai permainan acak huruf  
➤ *!survival* – 🔥 Memulai permainan survival  
➤ *!jhuruf [jawaban]* – 🔤 Memeriksa jawaban untuk permainan huruf  
➤ *!leaderboard* – 🏆 Menampilkan papan peringkat pemain  
➤ *!rank* – 🎖 Menampilkan peringkat pengguna  
➤ *!tantang [nomor telepon]* – ⚔️ Menantang pemain lain untuk bertanding  

📚 *PENGETAHUAN*  
━━━━━━━━━━━━━━━━━━  
➤ *!quran [ayat]* – 📖 Mengambil ayat dari Al-Quran  
➤ *!pantun* – 📜 Mengirimkan pantun secara acak  

⏰ *PENGINGAT*  
━━━━━━━━━━━━━━━━━━  
➤ *!remind [teks]* – 📅 Mengatur pengingat  
➤ *!setremind [teks]* – 🏷️ Mengatur pengingat dengan format tertentu  
➤ *!gremind [teks]* – 📅 Mengatur pengingat grup  
➤ *!setgremind [teks]* – 🏷️ Mengatur pengingat grup dengan format tertentu  
➤ *!listremind* – 📜 Menampilkan daftar pengingat yang telah diset  
➤ *!cancelremind [id]* – ❌ Membatalkan pengingat tertentu  
➤ *!repeatremind [teks]* – 🔁 Mengatur pengingat berulang  
➤ *!repeatgremind [teks]* – 🔁 Mengatur pengingat grup berulang  
➤ *!stopremind [id]* – ⛔ Menghentikan pengingat berulang tertentu  

👥 *GRUP & ADMIN*  
━━━━━━━━━━━━━━━━━━  
➤ *!setwelcome [pesan]* – 🎉 Mengatur pesan sambutan untuk anggota baru  
➤ *!setleave [pesan]* – 👋 Mengatur pesan perpisahan untuk anggota yang keluar  
➤ *!getwelcome* – 📥 Mengambil pesan sambutan yang telah diatur  
➤ *!getleave* – 📥 Mengambil pesan perpisahan yang telah diatur  
➤ *!clearwelcome* – ❌ Menghapus pesan sambutan  
➤ *!clearleave* – ❌ Menghapus pesan perpisahan  
➤ *!greeting on/off* – 🔄 Mengaktifkan atau menonaktifkan pesan sambutan otomatis  
➤ *!bukagrup* – 🔓 Membuka grup untuk anggota baru  
➤ *!tutupgrup* – 🔒 Menutup grup dari anggota baru  
➤ *!jadwalbuka [HH:MM WIB/WITA/WIT]* – ⏰ Menetapkan jadwal buka grup  
➤ *!jadwaltutup [HH:MM WIB/WITA/WIT]* – ⏰ Menetapkan jadwal tutup grup  
➤ *!cekjadwal* – 📆 Memeriksa jadwal grup yang telah diset  
➤ *!hapusjadwal [buka/tutup]* – ❌ Menghapus jadwal buka atau tutup grup  
➤ *!add [nomor telepon]* – ➕ Menambahkan anggota baru ke grup  
➤ *!kick [nomor telepon]* – ➖ Menghapus anggota dari grup  
➤ *!kicknonadmin* – 🛑 Mengeluarkan anggota non-admin dari grup  
➤ *!promote [tag]* – ⬆️ Mempromosikan anggota menjadi admin  
➤ *!demote [tag]* – ⬇️ Menurunkan status admin anggota  
➤ *!announce [pesan]* – 📢 Mengumumkan pesan kepada semua anggota grup  
➤ *!kritik [pesan]* – ✍️ Mengirimkan kritik atau saran  
➤ *!lihatkritik* – 📜 Melihat kritik atau saran yang telah diajukan  
➤ *!tagdivisi [divisi]* – 📣 Menyebut anggota dalam divisi tertentu  
➤ *!listdivisi* – 📋 Menampilkan daftar divisi yang ada  
➤ *!setdivisi [user] [divisi]* – ➕ Menambahkan anggota ke divisi tertentu  
➤ *!removedivisi [user] [divisi]* – ➖ Menghapus anggota dari divisi tertentu  
➤ *!adddivisi [divisi]* – ➕ Menambahkan divisi baru  
➤ *!removedivisi [divisi]* – ➖ Menghapus divisi tertentu  
➤ *!tambahnama [divisi] [nama]* – ➕ Menambahkan nama ke divisi  
➤ *!editnama [divisi] [nama lama]* – ✏️ Mengedit nama di divisi  
➤ *!hapusnama [divisi] [nama]* – ❌ Menghapus nama dari divisi  
➤ *!daftarhadir [rapat]* – 📋 Menampilkan daftar hadir untuk rapat tertentu  
➤ *!tambahrapat [judul] [tanggal]* – ➕ Menambahkan rapat baru  
➤ *!salinrapat [rapat sumber] [rapat tujuan]* – 📋 Menyalin rapat  
➤ *!absen [rapat] [nama]* – ✔️ Mengisi absen untuk rapat  

📊 *VOTING & POLLING*  
━━━━━━━━━━━━━━━━━━  
➤ *!vote [opsi]* – 🗳 Memulai voting  
➤ *!poll [pertanyaan]* – 📊 Membuat polling  
➤ *!vote mulai* – 📊 Memulai voting  
➤ *!poll mulai* – 📊 Memulai polling  

📄 *GRUP & INFO*  
━━━━━━━━━━━━━━━━━━  
➤ *!setnamegc [nama baru]* – ✏️ Mengubah nama grup  
➤ *!setdescgc [deskripsi baru]* – ✏️ Mengubah deskripsi grup  
➤ *!groupinfo* – ℹ️ Menampilkan informasi grup  
➤ *!hidetag [pesan]* – 📢 Mengirim pesan tanpa menyebut nama  
➤ *!member [pesan]* – 📩 Mengirim pesan ke semua anggota non-admin  
➤ *!admin [pesan]* – 📩 Mengirim pesan ke semua admin grup  
➤ *!refreshgroup* – 🔄 Memperbarui informasi grup  

🎲 *FITUR SERU*  
━━━━━━━━━━━━━━━━━━  
➤ *!roll* – 🎲 Menggulung dadu  
➤ *!fact* – 💡 Mengambil fakta acak  
➤ *!joke* – 😂 Mengambil lelucon acak  
➤ *!countdown [tanggal acara]* – ⏳ Menghitung mundur hingga tanggal acara tertentu  
➤ *!setrole "No" "Role"* – 🎭 Memberikan role  
➤ *!tag "role"* – 📣 Mention sesuai role  
➤ *!roles* – 📋 Melihat daftar role  
➤ *!delroles* – ❌ Menghapus role  

🎓 *FITUR GURU*  
━━━━━━━━━━━━━━━━━━  
➤ *!tambahguru [nomor]* – 🎓 Menambahkan guru  
➤ *!listguru* – 📚 Melihat data guru  
➤ *!hapusguru [nomor]* – ❌ Menghapus guru  
➤ *!ajarin [text]* – 📖 Mengajarkan SmartBot  
➤ *!listajarin* – 📜 Melihat hal yang diajarkan  

!addcmd [perintah] [balasan]
!listcmd
!deletecmd [perintah]
!updatecmd [perintah lama] [perintah baru]


🔹 *Gunakan perintah di atas untuk menikmati fitur SmartBot!* 🚀`,
  },


  {
    keyword: "!kodenegara",
    response: `✨ *Kode Negara untuk Bahasa* 🌍  

🌍 *af* ➝ Afrikaans  
🌍 *sq* ➝ Albania  
🌍 *am* ➝ Amharik  
🌍 *ar* ➝ Arab  
🌍 *hy* ➝ Armenia  
🌍 *eu* ➝ Basque  
🌍 *bn* ➝ Bengali  
🌍 *bs* ➝ Bosnia  
🌍 *bg* ➝ Bulgaria  
🌍 *ca* ➝ Catalan  
🌍 *zh-CN* ➝ Mandarin (Sederhana)  
🌍 *zh-TW* ➝ Mandarin (Tradisional)  
🌍 *hr* ➝ Kroasia  
🌍 *cs* ➝ Ceko  
🌍 *da* ➝ Denmark  
🌍 *nl* ➝ Belanda  
🌍 *en* ➝ Inggris  
🌍 *et* ➝ Estonia  
🌍 *tl* ➝ Tagalog  
🌍 *fi* ➝ Finlandia  
🌍 *fr* ➝ Prancis  
🌍 *ka* ➝ Georgia  
🌍 *de* ➝ Jerman  
🌍 *el* ➝ Yunani  
🌍 *gu* ➝ Gujarati  
🌍 *ht* ➝ Haiti  
🌍 *he* ➝ Ibrani  
🌍 *hi* ➝ Hindi  
🌍 *hu* ➝ Hungaria  
🌍 *is* ➝ Islandia  
🌍 *id* ➝ Indonesia  
🌍 *it* ➝ Italia  
🌍 *ja* ➝ Jepang  
🌍 *kn* ➝ Kannada  
🌍 *kk* ➝ Kazakh  
🌍 *km* ➝ Khmer  
🌍 *ko* ➝ Korea  
🌍 *lv* ➝ Latvia  
🌍 *lt* ➝ Lithuania  
🌍 *ms* ➝ Melayu  
🌍 *mt* ➝ Malta  
🌍 *no* ➝ Norwegia  
🌍 *fa* ➝ Persia  
🌍 *pl* ➝ Polandia  
🌍 *pt* ➝ Portugis  
🌍 *pa* ➝ Punjabi  
🌍 *ro* ➝ Rumania  
🌍 *ru* ➝ Rusia  
🌍 *sr* ➝ Serbia  
🌍 *sk* ➝ Slovakia  
🌍 *sl* ➝ Slovenia  
🌍 *es* ➝ Spanyol  
🌍 *sw* ➝ Swahili  
🌍 *sv* ➝ Swedia  
🌍 *ta* ➝ Tamil  
🌍 *te* ➝ Telugu  
🌍 *th* ➝ Thailand  
🌍 *tr* ➝ Turki  
🌍 *uk* ➝ Ukraina  
🌍 *ur* ➝ Urdu  
🌍 *vi* ➝ Vietnam  
🌍 *cy* ➝ Welsh  
🌍 *yi* ➝ Yiddish  

🔹 *Gunakan kode di atas untuk menerjemahkan bahasa dengan SmartBot!* 🌍`,
  },
];
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
    question: "Aku tidak punya tangan, tetapi aku bisa menunjuk. Aku adalah?",
    answer: "jam",
    clue: "🔎 Aku ada di dinding atau di pergelangan tanganmu.",
  },
  {
    question: "Aku bisa pecah, tapi aku bukan kaca. Aku adalah?",
    answer: "hati",
    clue: "🔎 Biasanya terjadi saat sedih atau kecewa.",
  },
  {
    question:
      "Semakin banyak kamu mengambilku, semakin banyak yang tertinggal. Aku adalah?",
    answer: "jejak kaki",
    clue: "🔎 Aku muncul di pasir atau tanah basah.",
  },
  {
    question: "Aku bisa mengeringkan, tetapi aku sendiri basah. Aku adalah?",
    answer: "handuk",
    clue: "🔎 Dipakai setelah mandi.",
  },
  {
    question: "Aku selalu naik tapi tak pernah turun. Aku adalah?",
    answer: "usia",
    clue: "🔎 Bertambah setiap tahun.",
  },
  {
    question: "Aku punya jendela, tapi bukan rumah. Aku adalah?",
    answer: "komputer",
    clue: "🔎 Digunakan untuk bekerja dan bermain game.",
  },
  {
    question: "Aku berisi huruf tetapi bukan buku. Aku adalah?",
    answer: "amplop",
    clue: "🔎 Biasanya dikirim lewat pos.",
  },
  {
    question: "Aku berlari tanpa kaki, mengalir tanpa henti. Aku adalah?",
    answer: "air",
    clue: "🔎 Sumber kehidupan yang selalu bergerak.",
  },
  {
    question: "Aku selalu datang tetapi tak pernah tiba. Aku adalah?",
    answer: "besok",
    clue: "🔎 Selalu ada di masa depan.",
  },
  {
    question: "Aku memiliki kulit tetapi bukan manusia. Aku adalah?",
    answer: "buah",
    clue: "🔎 Bisa dimakan dan sehat untuk tubuh.",
  },
  {
    question:
      "Aku berwarna hitam saat bersih, dan putih saat kotor. Aku adalah?",
    answer: "papan tulis",
    clue: "🔎 Biasanya ada di kelas.",
  },
  {
    question:
      "Aku lebih ringan dari udara tetapi tidak bisa mengapung selamanya. Aku adalah?",
    answer: "balon",
    clue: "🔎 Bisa meledak jika terkena benda tajam.",
  },
  {
    question: "Aku punya kepala tapi tidak punya otak. Aku adalah?",
    answer: "paku",
    clue: "🔎 Digunakan untuk menempelkan sesuatu.",
  },
  {
    question: "Aku berputar tapi tidak bergerak. Aku adalah?",
    answer: "jam dinding",
    clue: "🔎 Ada jarumnya, tapi tidak menusuk.",
  },
  {
    question: "Aku punya banyak wajah, tapi tidak punya mata. Aku adalah?",
    answer: "dadu",
    clue: "🔎 Digunakan dalam permainan papan.",
  },
  {
    question: "Aku memiliki angka tetapi bukan kalkulator. Aku adalah?",
    answer: "kalender",
    clue: "🔎 Digunakan untuk melihat tanggal.",
  },
  {
    question: "Aku tumbuh ke bawah dan bukan ke atas. Aku adalah?",
    answer: "akar",
    clue: "🔎 Bagian dari pohon yang tersembunyi.",
  },
  {
    question: "Aku memiliki mulut tetapi tidak berbicara. Aku adalah?",
    answer: "botol",
    clue: "🔎 Bisa menyimpan air di dalamnya.",
  },
  {
    question: "Aku memiliki gigi tetapi tidak bisa menggigit. Aku adalah?",
    answer: "sisir",
    clue: "🔎 Digunakan untuk merapikan rambut.",
  },
  {
    question: "Aku bisa melihat tanpa mata. Aku adalah?",
    answer: "cermin",
    clue: "🔎 Memantulkan bayanganmu.",
  },
  {
    question: "Aku berisik tetapi tidak bisa mendengar. Aku adalah?",
    answer: "alarm",
    clue: "🔎 Berbunyi untuk membangunkanmu.",
  },
  {
    question: "Aku bisa menampung air tetapi berlubang. Aku adalah?",
    answer: "spons",
    clue: "🔎 Digunakan untuk mencuci piring.",
  },
  {
    question: "Aku memiliki tangan tetapi tidak punya jari. Aku adalah?",
    answer: "jam tangan",
    clue: "🔎 Dipakai di pergelangan tangan.",
  },
  {
    question: "Aku bisa memotong tapi bukan pisau. Aku adalah?",
    answer: "gunting",
    clue: "🔎 Bisa memotong kertas dengan rapi.",
  },
  {
    question: "Aku bisa naik tetapi bukan kendaraan. Aku adalah?",
    answer: "layang-layang",
    clue: "🔎 Terbang tinggi di langit saat berangin.",
  },
  {
    question: "Aku bisa menampung air dan bisa bocor jika rusak. Aku adalah?",
    answer: "ember",
    clue: "🔎 Biasanya ada di kamar mandi.",
  },
  {
    question:
      "Aku bisa menyimpan sesuatu tetapi semakin penuh semakin ringan. Aku adalah?",
    answer: "balon",
    clue: "🔎 Bisa terbang jika diisi udara.",
  },
  {
    question: "Aku bisa berbunyi tapi tidak bisa berbicara. Aku adalah?",
    answer: "bel",
    clue: "🔎 Digunakan untuk memberi tanda di sekolah.",
  },
  {
    question: "Aku bisa berubah bentuk tapi tetap sama. Aku adalah?",
    answer: "air",
    clue: "🔎 Bisa cair, beku, atau gas.",
  },
  {
    question: "Aku lebih panjang saat dipotong. Aku adalah?",
    answer: "lilin",
    clue: "🔎 Digunakan saat mati lampu.",
  },
  {
    question: "Aku bisa berjalan tanpa kaki. Aku adalah?",
    answer: "awan",
    clue: "🔎 Bergerak di langit.",
  },
  {
    question: "Aku bisa berbicara tapi tidak bisa mendengar. Aku adalah?",
    answer: "radio",
    clue: "🔎 Mengeluarkan suara dari dalam kotak.",
  },
  {
    question: "Aku bisa berdiri tetapi tidak punya kaki. Aku adalah?",
    answer: "pohon",
    clue: "🔎 Memberikan oksigen untuk manusia.",
  },
  {
    question: "Aku bisa digenggam tapi tak bisa dipegang. Aku adalah?",
    answer: "pasir",
    clue: "🔎 Banyak ditemukan di pantai.",
  },
  {
    question: "Aku bisa tumbuh tanpa disiram air. Aku adalah?",
    answer: "kaktus",
    clue: "🔎 Hidup di gurun pasir.",
  },
  {
    question: "Aku bisa menghilang saat terang. Aku adalah?",
    answer: "bayangan",
    clue: "🔎 Hanya muncul saat ada cahaya.",
  },
  {
    question: "Aku bisa dipakai tapi bukan baju. Aku adalah?",
    answer: "topi",
    clue: "🔎 Dipakai di kepala untuk melindungi dari matahari.",
  },
];

//Game Tebak Kata
const daftarKata = [
  "buku",
  "meja",
  "kursi",
  "rumah",
  "mobil",
  "jalan",
  "sekolah",
  "pohon",
  "air",
  "makanan",
  "hewan",
  "udara",
  "cahaya",
  "kota",
  "sungai",
  "bunga",
  "langit",
  "waktu",
  "suara",
  "angka",
  "warna",
  "matahari",
  "tangan",
  "pintu",
  "roda",
  "laut",
  "gunung",
  "hujan",
  "tanah",
  "bayangan",
  "awan",
  "bulan",
  "bintang",
  "pasir",
  "pepohonan",
  "angin",
  "musik",
  "kata",
  "perasaan",
  "hati",
  "gunting",
  "papan",
  "kertas",
  "pena",
  "lampu",
  "pintu",
  "jendela",
  "payung",
  "kapal",
  "perahu",
  "sepeda",
  "kereta",
  "pesawat",
  "sandal",
  "sepatu",
  "pakaian",
  "topi",
  "sarung",
  "gelas",
  "piring",
  "sendok",
  "garpu",
  "pisau",
  "kompor",
  "lemari",
  "cermin",
  "radio",
  "televisi",
  "telepon",
  "kamera",
  "jam",
  "kalender",
  "tas",
  "dompet",
  "kunci",
  "taman",
  "rumput",
  "hutan",
  "sawah",
  "ladang",
  "susu",
  "kopi",
  "teh",
  "gula",
  "garam",
  "lada",
  "cabe",
  "ikan",
  "daging",
  "sayur",
];

// Daftar Fakta Unik
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

const getRandomFakta = () => {
  return faktaList[Math.floor(Math.random() * faktaList.length)];
};

// Daftar Pantun
const pantunList = [
  {
    baris1: "Pergi ke pasar beli durian,",
    baris2: "Jangan lupa beli ikan patin.",
    baris3: "Jangan sering lihat mantan,",
    baris4: "Nanti susah move on berlarut-larut.",
  },
  {
    baris1: "Jalan-jalan ke kota Medan,",
    baris2: "Mampir sebentar beli rambutan.",
    baris3: "Jangan suka ngomong sembarangan,",
    baris4: "Nanti bisa bikin orang kesel beneran.",
  },
  {
    baris1: "Main layangan di tepi pantai,",
    baris2: "Sambil makan es kelapa muda.",
    baris3: "Kalau kamu masih sendiri,",
    baris4: "Jangan khawatir jodoh pasti ada.",
  },
  {
    baris1: "Burung elang terbang tinggi,",
    baris2: "Melihat bumi dari angkasa.",
    baris3: "Jangan lupa tetap rendah hati,",
    baris4: "Karena sombong tiada gunanya.",
  },
  {
    baris1: "Ke kebun ambil mangga,",
    baris2: "Mangga manis buat dimakan.",
    baris3: "Jangan suka menunda-nunda,",
    baris4: "Nanti semua jadi beban.",
  },
  {
    baris1: "Pagi hari minum kopi,",
    baris2: "Ditemani roti rasa keju.",
    baris3: "Jangan sering begadang lagi,",
    baris4: "Biar badan tetap sehat selalu.",
  },
  {
    baris1: "Beli roti di warung Bu Rina,",
    baris2: "Dimakan enak dengan selai.",
    baris3: "Jangan ragu untuk mencoba,",
    baris4: "Karena gagal adalah hal biasa.",
  },
  {
    baris1: "Pergi ke sawah tanam padi,",
    baris2: "Jangan lupa membawa cangkul.",
    baris3: "Kalau mau sukses nanti,",
    baris4: "Jangan malas belajar betul-betul.",
  },
  {
    baris1: "Kucing lucu suka berlari,",
    baris2: "Mengejar bola sampai capek.",
    baris3: "Jika ingin hidup berarti,",
    baris4: "Jangan menyerah sebelum berhasil.",
  },
  {
    baris1: "Ke sekolah naik sepeda,",
    baris2: "Di jalan bertemu teman lama.",
    baris3: "Hidup ini harus berusaha,",
    baris4: "Biar nanti bisa bahagia.",
  },
  {
    baris1: "Naik gunung lihat pemandangan,",
    baris2: "Hati senang melihat bunga.",
    baris3: "Jangan lelah untuk berjuang,",
    baris4: "Karena sukses butuh usaha.",
  },
  {
    baris1: "Ke pasar beli rambutan,",
    baris2: "Jangan lupa beli semangka.",
    baris3: "Kalau banyak hutang teman,",
    baris4: "Jangan lupa ditagih juga.",
  },
  {
    baris1: "Burung dara di atas dahan,",
    baris2: "Terbang tinggi melawan angin.",
    baris3: "Jangan sering merasa bosan,",
    baris4: "Karena hidup penuh tantangan.",
  },
  {
    baris1: "Pagi hari pergi ke taman,",
    baris2: "Melihat bunga warna-warni.",
    baris3: "Janganlah suka bermalas-malasan,",
    baris4: "Nanti hidup jadi tak berarti.",
  },
  {
    baris1: "Naik perahu ke seberang,",
    baris2: "Melihat ombak di lautan.",
    baris3: "Jangan suka marah-marah,",
    baris4: "Nanti wajah cepat keriputan.",
  },
  {
    baris1: "Pergi ke sawah lihat petani,",
    baris2: "Menanam padi dengan hati-hati.",
    baris3: "Jangan sering iri hati,",
    baris4: "Bersyukur itu lebih berarti.",
  },
  {
    baris1: "Ke toko beli sepatu baru,",
    baris2: "Dipakai jalan ke rumah kawan.",
    baris3: "Kalau ingin jadi nomor satu,",
    baris4: "Harus kerja keras dan berjuang.",
  },
  {
    baris1: "Ke hutan melihat rusa,",
    baris2: "Bertemu juga dengan monyet.",
    baris3: "Jangan mudah menyerah,",
    baris4: "Karena keberhasilan butuh niat.",
  },
  {
    baris1: "Ambil air di sumur tua,",
    baris2: "Airnya jernih seperti kaca.",
    baris3: "Hidup harus penuh doa,",
    baris4: "Agar selalu dapat berkah.",
  },
  {
    baris1: "Langit biru indah sekali,",
    baris2: "Dihiasi awan putih berseri.",
    baris3: "Jika ingin hidup abadi,",
    baris4: "Lakukan kebaikan setiap hari.",
  },
  {
    baris1: "Pergi ke hutan mencari madu,",
    baris2: "Bertemu lebah terbang tinggi.",
    baris3: "Jangan pernah sombong selalu,",
    baris4: "Nanti teman bisa pergi.",
  },
  {
    baris1: "Pulang kerja beli martabak,",
    baris2: "Dimakan hangat enak rasanya.",
    baris3: "Jangan banyak mengeluh saja,",
    baris4: "Lebih baik usaha dan doa.",
  },
  {
    baris1: "Di kebun ada bunga melati,",
    baris2: "Harumnya semerbak ke mana-mana.",
    baris3: "Jadilah orang yang baik hati,",
    baris4: "Pasti banyak teman yang suka.",
  },
  {
    baris1: "Naik kapal menuju seberang,",
    baris2: "Melihat laut luas terbentang.",
    baris3: "Jangan lupa selalu senang,",
    baris4: "Biar hidup jadi lapang.",
  },
  {
    baris1: "Menanam jagung di tepi jalan,",
    baris2: "Jagung tumbuh subur sekali.",
    baris3: "Kalau ingin sukses di masa depan,",
    baris4: "Belajarlah dengan tekun setiap hari.",
  },
  {
    baris1: "Ke pantai beli kelapa,",
    baris2: "Diminum segar di bawah pohon.",
    baris3: "Jangan suka lupa janji,",
    baris4: "Nanti orang jadi kecewa.",
  },
  {
    baris1: "Ke warung beli ketupat,",
    baris2: "Dimakan hangat dengan sambal.",
    baris3: "Kalau banyak niat jahat,",
    baris4: "Nanti hidup jadi kacau total.",
  },
  {
    baris1: "Ke sekolah bawa tas baru,",
    baris2: "Di dalamnya ada buku cerita.",
    baris3: "Jangan pernah ragu-ragu,",
    baris4: "Percaya diri adalah kuncinya.",
  },
  {
    baris1: "Ke gunung melihat awan,",
    baris2: "Awan putih indah sekali.",
    baris3: "Kalau sering banyak kawan,",
    baris4: "Hidup pasti lebih berseri.",
  },
  {
    baris1: "Ke toko beli sepatu,",
    baris2: "Dibeli warna hitam pekat.",
    baris3: "Kalau ingin jadi nomor satu,",
    baris4: "Harus rajin dan semangat.",
  },
  {
    baris1: "Beli es di pinggir jalan,",
    baris2: "Diminum segar di siang bolong.",
    baris3: "Kalau sering malas-malasan,",
    baris4: "Nanti masa depan jadi bolong.",
  },
  {
    baris1: "Ke hutan bertemu rusa,",
    baris2: "Di sana juga ada kijang.",
    baris3: "Jangan suka lupa janji,",
    baris4: "Nanti teman jadi hilang.",
  },
  {
    baris1: "Makan siang dengan sate,",
    baris2: "Sate enak bumbu kacang.",
    baris3: "Jangan banyak bicara bohong,",
    baris4: "Nanti teman jadi berkurang.",
  },
  {
    baris1: "Di sungai ada buaya,",
    baris2: "Di pinggirnya ada ikan gabus.",
    baris3: "Kalau sering buat bahagia,",
    baris4: "Hidup jadi lebih bagus.",
  },
  {
    baris1: "Malam hari bintang bersinar,",
    baris2: "Bulan muncul begitu terang.",
    baris3: "Kalau kita selalu sabar,",
    baris4: "Semua masalah pasti hilang.",
  },
  {
    baris1: "Ke taman melihat bunga,",
    baris2: "Bunga merah warna indah.",
    baris3: "Jangan suka banyak drama,",
    baris4: "Nanti orang bisa marah.",
  },
  {
    baris1: "Burung nuri terbang tinggi,",
    baris2: "Melewati sungai dan jembatan.",
    baris3: "Kalau ingin hati tak sedih,",
    baris4: "Jangan simpan banyak beban.",
  },
  {
    baris1: "Beli duku di pasar pagi,",
    baris2: "Duku manis dan segar sekali.",
    baris3: "Kalau hidup selalu berbagi,",
    baris4: "Pasti hati jadi lebih happy.",
  },
  {
    baris1: "Beli durian di pasar Senen,",
    baris2: "Dibawa pulang buat dimakan.",
    baris3: "Jangan lupa banyak senyum,",
    baris4: "Biar hidup jadi menyenangkan.",
  },
  {
    baris1: "Bermain layang-layang di lapangan,",
    baris2: "Layang-layang terbang tinggi di angkasa.",
    baris3: "Jangan lupa banyak kebaikan,",
    baris4: "Biar hidup penuh makna.",
  },
  {
    baris1: "Pergi ke desa naik delman,",
    baris2: "Melewati sawah luas terbentang.",
    baris3: "Kalau ingin hidup nyaman,",
    baris4: "Harus sabar dan banyak tenang.",
  },
  {
    baris1: "Minum kopi di pagi hari,",
    baris2: "Ditemani kue rasa coklat.",
    baris3: "Jangan suka iri hati,",
    baris4: "Lebih baik hidup bersahabat.",
  },
  {
    baris1: "Pulang kampung naik kereta,",
    baris2: "Melihat sawah luas terbentang.",
    baris3: "Kalau ingin banyak harta,",
    baris4: "Harus rajin dan banyak berjuang.",
  },
  {
    baris1: "Di kebun ada banyak mangga,",
    baris2: "Mangga manis dimakan pagi.",
    baris3: "Jangan suka banyak drama,",
    baris4: "Hidup damai lebih berarti.",
  },
  {
    baris1: "Ke warung beli lontong,",
    baris2: "Dimakan hangat dengan rendang.",
    baris3: "Kalau sering iri hati,",
    baris4: "Hidup jadi tidak tenang.",
  },
];

// Ekspor data agar bisa digunakan di file lain
module.exports = {
  validLanguages,
  autoResponses,
  logicQuestions,
  getRandomFakta,
  pantunList,
  daftarKata,
};
