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

const {
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
} = require("./umum");

const {
  // Fitur Permainan
  startGuessingGame,
  checkGuess,
  startLogicGame,
  checkLogicAnswer,
  giveLogicClue,
  startAcakHuruf,
  checkJawaban,
  getLeaderboard,
  showRank,
  challengePlayer,
  startSurvival,
} = require("./permainan");

const {
  // Reminder features
  setReminder,
  listReminders,
  cancelReminder,
  setRepeatReminder,
  stopRepeatReminder,

  // Group & Admin features
  mentionAll,
  announceToAll,
  setGroupRestriction,
  setGroupSchedule,
  checkGroupSchedule,
  addMultipleMembers,
  removeMultipleMembers,
  promoteMember,
  demoteMember,
} = require("./grup");
// Konfigurasi bahasa untuk format tanggal Indonesia
moment.locale("id");

let guessingGame = {};
let logicGame = {};
let botActive = true; //default aktif
let startTime = Date.now(); // Simpan waktu saat bot dihidupkan

// 🔹 Fungsi untuk menangani auto response dengan mention
async function handleAutoResponse(message, remoteJid, sender, sock) {
  if (!autoResponses || autoResponses.length === 0) return; // 🔹 Cek jika autoResponses kosong

  const lowerMessage = message.toLowerCase();

  try {
    const foundAuto = autoResponses.find((auto) =>
      lowerMessage.includes(auto.keyword)
    );

    if (foundAuto) {
      const responseText = `@${sender.split("@")[0]} ${foundAuto.response}`;

      await sock.sendMessage(remoteJid, {
        text: responseText,
        mentions: [sender], // Mentions pengguna
      });
    }
  } catch (error) {
    console.error("❌ Gagal mengirim pesan:", error);
  }
}

// STARTBOT/HIDUPKAN BOT
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

  const recentEvents = new Map(); // Cache event untuk mencegah duplikasi

  sock.ev.on("group-participants.update", async (update) => {
    const { id, participants, action } = update;

    console.log(`📢 Event terdeteksi: ${action} di grup ${id}`);

    for (let participant of participants) {
      let eventKey = `${id}_${participant}_${action}`; // Unik per grup + pengguna + aksi

      // Cek apakah event ini baru saja diproses dalam 5 detik terakhir
      if (recentEvents.has(eventKey)) {
        console.log(`⏳ Event ${eventKey} sudah diproses, abaikan...`);
        continue;
      }

      recentEvents.set(eventKey, Date.now()); // Simpan waktu event
      setTimeout(() => recentEvents.delete(eventKey), 5000); // Hapus dari cache setelah 5 detik

      let userName = `@${participant.split("@")[0]}`;
      let groupInfo = await sock.groupMetadata(id);
      let groupName = groupInfo.subject;

      console.log(`🔹 Memproses ${action} untuk ${userName} di ${groupName}`);

      if (action === "add") {
        let welcomeMessage = await getWelcomeMessage(
          id,
          participant,
          groupName
        );
        sock.sendMessage(id, {
          text: welcomeMessage,
          mentions: [participant],
        });
      } else if (action === "remove") {
        let leaveMessage = await getLeaveMessage(id, participant, groupName);
        sock.sendMessage(id, { text: leaveMessage, mentions: [participant] });
      }
    }
  });
  // Event handler untuk pesan masuk
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
    try {
      console.log(`Pesan dari: ${msg.key.remoteJid}`);
    } catch (err) {
      console.error("⚠️ Gagal mendekripsi pesan:", err);
    }
    const remoteJid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const textMessage =
      msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!textMessage) return;
    // **Filter agar bot tidak merespons dirinya sendiri**
    if (msg.key.fromMe) return;

    // **Dapatkan timestamp pesan**
    const messageTimestamp = msg.messageTimestamp * 1000; // Ubah ke milidetik
    const now = Date.now(); // Waktu sekarang dalam milidetik

    // **Cek apakah pesan dikirim sebelum bot dihidupkan**
    if (messageTimestamp < startTime) {
      console.log("⏳ Mengabaikan pesan lama sebelum bot aktif.");
      return;
    }

    // **Cek apakah pesan lebih lama dari 30 detik**
    if (now - messageTimestamp > 30000) {
      console.log("⏳ Mengabaikan pesan lama (> 30 detik).");
      return;
    }
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

    // **Panggil fungsi CRUD**
    await handleCustomMessages(textMessage, remoteJid, sock);
    // Penanganan respons otomatis (auto-response)
    await handleAutoResponse(textMessage, remoteJid, sender, sock);

    // Penanganan pembelajaran dan respons kustom
    await handleLearning(textMessage, remoteJid, sender, sock);
    await handleCustomResponse(textMessage, remoteJid, sock);

    // Penanganan perintah guru (jika ada)
    await handleTeacherCommands(textMessage, remoteJid, sender, sock);

    // Penanganan perintah umum dan utilitas
    if (textMessage === "!fitur") {
      const isAdmin = false; // Atur isAdmin (bisa cek dari grup)
      showMenu(remoteJid, isAdmin, sock);
    } else if (textMessage === "!ping") {
      sock.sendMessage(remoteJid, { text: "Pong! 🏓" });
    } else if (textMessage.startsWith("!tagall")) {
      const customMessage =
        textMessage.replace("!tagall", "").trim() || "👥 Mention All";
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
    } else if (textMessage === "!survival") {
      startSurvival(remoteJid, sender, sock);
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
    } else if (textMessage.startsWith("!stopremind ")) {
      stopRepeatReminder(remoteJid, sender, textMessage, sock);
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
      await setGroupRestriction(remoteJid, sock, false, sender);
    } else if (textMessage === "!tutupgrup") {
      await setGroupRestriction(remoteJid, sock, true, sender);
    } else if (textMessage.startsWith("!jadwalbuka ")) {
      const args = textMessage.split(" ");
      if (args.length < 3) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Format salah! Gunakan: *!jadwalbuka HH:MM WIB/WITA/WIT*",
        });
        return;
      }

      const time = args[1]; // HH:MM
      const timeZone = args[2]; // WIB, WITA, WIT

      setGroupSchedule(remoteJid, time, "open", timeZone, sender, sock);
    } else if (textMessage.startsWith("!jadwaltutup ")) {
      const args = textMessage.split(" ");
      if (args.length < 3) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Format salah! Gunakan: *!jadwaltutup HH:MM WIB/WITA/WIT*",
        });
        return;
      }

      const time = args[1];
      const timeZone = args[2];

      setGroupSchedule(remoteJid, time, "close", timeZone, sender, sock);
    } else if (textMessage === "!cekjadwal") {
      // Cek apakah pengirim adalah admin
      const userIsAdmin = await isUserAdmin(remoteJid, sender, sock);

      if (!userIsAdmin) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Hanya admin yang dapat mengecek jadwal grup ini!",
        });
        return;
      }

      if (!groupSchedules[remoteJid]) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Tidak ada jadwal yang diset untuk grup ini!",
        });
      } else {
        const schedule = groupSchedules[remoteJid];

        // Pastikan data tersimpan dengan benar
        const openSchedule = schedule.open
          ? `${schedule.open.time} ${schedule.open.timeZone}`
          : "Belum diset";

        const closeSchedule = schedule.close
          ? `${schedule.close.time} ${schedule.close.timeZone}`
          : "Belum diset";

        sock.sendMessage(remoteJid, {
          text: `📅 Jadwal Grup:\n🔓 Buka: ${openSchedule}\n🔒 Tutup: ${closeSchedule}`,
        });
      }
    } else if (textMessage.startsWith("!hapusjadwal")) {
      const args = textMessage.split(" ");
      const target = args[1]; // Ambil kata kedua (buka/tutup)

      const userIsAdmin = await isUserAdmin(remoteJid, sender, sock);
      if (!userIsAdmin) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Hanya admin yang dapat menghapus jadwal grup ini!",
        });
        return;
      }

      if (!groupSchedules[remoteJid]) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Tidak ada jadwal yang tersimpan untuk grup ini!",
        });
        return;
      }

      if (!target) {
        // Jika tidak ada kata kedua, hapus semua jadwal
        delete groupSchedules[remoteJid];
        sock.sendMessage(remoteJid, {
          text: "✅ Semua jadwal grup telah dihapus!",
        });
      } else if (target === "buka" && groupSchedules[remoteJid].open) {
        delete groupSchedules[remoteJid].open;
        sock.sendMessage(remoteJid, { text: "✅ Jadwal buka telah dihapus!" });
      } else if (target === "tutup" && groupSchedules[remoteJid].close) {
        delete groupSchedules[remoteJid].close;
        sock.sendMessage(remoteJid, { text: "✅ Jadwal tutup telah dihapus!" });
      } else {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Gunakan perintah *!hapusjadwal buka* atau *!hapusjadwal tutup*!",
        });
        return;
      }

      saveScheduleToFile(); // Simpan perubahan ke file
    } else if (textMessage.startsWith("!add ")) {
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
    }

    // Menampilkan menu interaksi
    else if (textMessage.startsWith("!tagdivisi")) {
      tagDivisi(remoteJid, sock, textMessage);
    } else if (textMessage.startsWith("!listdivisi")) {
      listDivisi(remoteJid, sock);
    } else if (textMessage.startsWith("!setdivisi")) {
      const [_, user, divisi] = textMessage.split(" ");
      addToDivisi(remoteJid, sock, user, divisi.toLowerCase());
    } else if (textMessage.startsWith("!removedivisi")) {
      const [_, user, divisi] = textMessage.split(" ");
      removeFromDivisi(remoteJid, sock, user, divisi.toLowerCase());
    } else if (textMessage.startsWith("!adddivisi")) {
      const divisi = textMessage.replace("!adddivisi", "").trim().toLowerCase();
      addDivisi(remoteJid, sock, divisi);
    } else if (textMessage.startsWith("!removedivisi")) {
      const args = textMessage.split(" ").slice(1); // Ambil parameter setelah perintah
      if (args.length < 2) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Format salah! Gunakan: *!removedivisi @user [nama_divisi]*",
        });
        return;
      }

      const user = args[0].replace("@", "").trim(); // Ambil user tanpa '@'
      const divisi = args.slice(1).join(" ").toLowerCase(); // Gabungkan kata setelah user sebagai nama divisi

      console.log("📥 Perintah diterima: !removedivisi");
      console.log("🔍 User:", user);
      console.log("📂 Divisi yang ingin dihapus:", divisi);

      if (!divisi) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Nama divisi tidak boleh kosong!",
        });
        return;
      }

      removeFromDivisi(remoteJid, sock, user, divisi);
    }

    // ABSENSI
    else if (textMessage.startsWith("!tambahnama ")) {
      let args = textMessage.replace("!tambahnama ", "").split(" | ");
      if (args.length < 2) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Gunakan format: *!tambahnama [divisi] | [nama]*",
        });
      } else {
        let response = tambahNama(args[0], args[1]);
        sock.sendMessage(remoteJid, { text: response });
      }
    } else if (textMessage.startsWith("!editnama ")) {
      let args = textMessage.replace("!editnama ", "").split(" | ");
      if (args.length < 3) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Gunakan format: *!editnama [divisi] | [nama lama] | [nama baru]*",
        });
      } else {
        let response = editNama(args[0], args[1], args[2]);
        sock.sendMessage(remoteJid, { text: response });
      }
    } else if (textMessage.startsWith("!hapusnama ")) {
      let args = textMessage.replace("!hapusnama ", "").split(" | ");
      if (args.length < 2) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Gunakan format: *!hapusnama [divisi] | [nama]*",
        });
      } else {
        let response = hapusNama(args[0], args[1]);
        sock.sendMessage(remoteJid, { text: response });
      }
    } else if (textMessage.startsWith("!daftarhadir")) {
      let args = textMessage.replace("!daftarhadir", "").trim();
      let response = args ? tampilkanDaftarRapat(args) : tampilkanDaftarRapat();
      sock.sendMessage(remoteJid, { text: response });
    } else if (textMessage.startsWith("!tambahrapat")) {
      let args = textMessage.split("|").map((a) => a.trim()); // Pisahkan dengan "|" dan hapus spasi ekstra

      if (args.length < 2) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Format salah! Gunakan: `!tambahrapat Nama Rapat | YYYY-MM-DD`",
        });
        return;
      }

      let judul = args[0].replace("!tambahrapat", "").trim(); // Ambil judul
      let tanggal = args[1].trim(); // Ambil tanggal
      let jabatan = args[2] ? args[2].trim() : null; // Jika ada jabatan
      let nama = args[3] ? args[3].trim() : null; // Jika ada nama

      let response = tambahRapat(judul, tanggal, jabatan, nama);
      sock.sendMessage(remoteJid, { text: response });
    } else if (textMessage.startsWith("!salinrapat ")) {
      let args = textMessage.replace("!salinrapat ", "").split(" | ");
      if (args.length < 2) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Gunakan format: *!salinrapat [rapat sumber] | [rapat tujuan]*",
        });
      } else {
        let response = salinRapat(args[0], args[1]);
        sock.sendMessage(remoteJid, { text: response });
      }
    } else if (textMessage.startsWith("!absen ")) {
      let args = textMessage.replace("!absen ", "").split(" | ");
      if (args.length < 2) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Gunakan format: *!absen [rapat] | [nama] | (izin/sakit opsional)*",
        });
      } else {
        let status = "✅"; // Default hadir
        if (args.length === 3) {
          status = `❌ (${args[2]})`; // Jika ada izin/sakit
        }
        let response = absen(args[0], args[1], status);
        sock.sendMessage(remoteJid, { text: response });
      }
    }

    // NEW FITUR (VOTING)
    else if (textMessage.startsWith("!vote")) {
      handleVoteCommand(remoteJid, sock, textMessage);
    } else if (textMessage.startsWith("!poll")) {
      handlePollCommand(remoteJid, sock, textMessage);
    } else if (textMessage.startsWith("!setnamegc ")) {
      // Cek apakah pesan dikirim dari grup
      const isGroup = remoteJid.endsWith("@g.us");
      if (!isGroup) {
        return sock.sendMessage(remoteJid, {
          text: "⚠️ Perintah ini hanya bisa digunakan dalam grup.",
        });
      }

      // Ambil metadata grup untuk cek admin
      const groupMetadata = await sock.groupMetadata(remoteJid);
      const participant = groupMetadata.participants.find(
        (p) => p.id === sender
      );
      const isAdmin =
        participant?.admin === "admin" || participant?.admin === "superadmin";

      if (!isAdmin) {
        return sock.sendMessage(remoteJid, {
          text: "❌ Hanya admin yang bisa mengubah nama grup!",
        });
      }

      const newName = textMessage.slice(11).trim(); // Ambil teks setelah "!setnamegc "

      if (!newName) {
        return sock.sendMessage(remoteJid, {
          text: "⚠️ Gunakan format: *!setnamegc [nama baru]*",
        });
      }

      try {
        await sock.groupUpdateSubject(remoteJid, newName);
        sock.sendMessage(remoteJid, {
          text: `✅ Nama grup berhasil diubah menjadi: *${newName}*`,
        });
      } catch (error) {
        console.error("Gagal mengubah nama grup:", error);
        sock.sendMessage(remoteJid, {
          text: "❌ Gagal mengubah nama grup. Pastikan bot adalah admin grup!",
        });
      }
    } else if (textMessage.startsWith("!setdescgc ")) {
      // Cek apakah pesan dikirim dari grup
      const isGroup = remoteJid.endsWith("@g.us");
      if (!isGroup) {
        return sock.sendMessage(remoteJid, {
          text: "⚠️ Perintah ini hanya bisa digunakan dalam grup.",
        });
      }

      // Ambil metadata grup untuk cek admin
      const groupMetadata = await sock.groupMetadata(remoteJid);
      const participant = groupMetadata.participants.find(
        (p) => p.id === sender
      );
      const isAdmin =
        participant?.admin === "admin" || participant?.admin === "superadmin";

      if (!isAdmin) {
        return sock.sendMessage(remoteJid, {
          text: "❌ Hanya admin yang bisa mengubah deskripsi grup!",
        });
      }

      const newDesc = textMessage.slice(11).trim(); // Ambil teks setelah "!setdescgc "

      if (!newDesc) {
        return sock.sendMessage(remoteJid, {
          text: "⚠️ Gunakan format: *!setdescgc [deskripsi baru]*",
        });
      }

      try {
        await sock.groupUpdateDescription(remoteJid, newDesc);
        sock.sendMessage(remoteJid, {
          text: `✅ Deskripsi grup berhasil diubah menjadi:\n\n${newDesc}`,
        });
      } catch (error) {
        console.error("Gagal mengubah deskripsi grup:", error);
        sock.sendMessage(remoteJid, {
          text: "❌ Gagal mengubah deskripsi grup. Pastikan bot adalah admin grup!",
        });
      }
    } else if (textMessage === "!groupinfo") {
      const isGroup = remoteJid.endsWith("@g.us");
      if (!isGroup) {
        return sock.sendMessage(remoteJid, {
          text: "⚠️ Perintah ini hanya bisa digunakan dalam grup.",
        });
      }

      try {
        // Mengambil metadata grup
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const groupName = groupMetadata.subject || "Tidak diketahui";
        const groupDesc = groupMetadata.desc
          ? groupMetadata.desc
          : "Tidak ada deskripsi.";
        const totalMembers = groupMetadata.participants.length;

        // Ambil daftar admin dan ubah format untuk mention
        const admins = groupMetadata.participants
          .filter((member) => member.admin)
          .map((member) => member.id);

        let message = `📌 *Informasi Grup*\n\n`;
        message += `🏷️ *Nama:* ${groupName}\n`;
        message += `📝 *Deskripsi:* ${groupDesc}\n`;
        message += `👥 *Total Anggota:* ${totalMembers}\n`;
        message += `🔰 *Admin:* ${
          admins.length > 0
            ? admins.map((a) => `@${a.split("@")[0]}`).join(", ")
            : "Tidak ada admin"
        }\n`;

        await sock.sendMessage(remoteJid, {
          text: message,
          mentions: admins, // Menggunakan array mentions agar benar-benar mention admin
        });
      } catch (error) {
        console.error("❌ Error saat mengambil informasi grup:", error);
        sock.sendMessage(remoteJid, {
          text: "⚠️ Gagal mengambil informasi grup. Pastikan bot adalah admin!",
        });
      }
    } else if (textMessage.startsWith("!hidetag ")) {
      const isGroup = remoteJid.endsWith("@g.us");
      if (!isGroup) {
        return sock.sendMessage(remoteJid, {
          text: "⚠️ Perintah ini hanya bisa digunakan dalam grup.",
        });
      }

      // Ambil teks setelah perintah
      const message = textMessage.slice(9).trim();
      if (!message) {
        return sock.sendMessage(remoteJid, {
          text: "⚠️ Harap masukkan pesan yang ingin dikirim dengan hidetag.",
        });
      }

      try {
        // Ambil semua anggota grup
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const members = groupMetadata.participants.map((member) => member.id);

        await sock.sendMessage(remoteJid, {
          text: message,
          mentions: members, // Semua anggota ditag, tapi tidak terlihat dalam teks
        });
      } catch (error) {
        console.error("❌ Error saat menjalankan hidetag:", error);
        sock.sendMessage(remoteJid, {
          text: "⚠️ Gagal mengirim pesan dengan hidetag. Pastikan bot adalah admin!",
        });
      }
    } else if (textMessage === "!refreshgroup") {
      const groupMetadata = remoteJid.endsWith("@g.us"); // Mengecek apakah ini grup
      if (!groupMetadata)
        return sock.sendMessage(remoteJid, {
          text: "⚠️ Perintah ini hanya bisa digunakan di grup!",
        });

      await refreshGroup(remoteJid, sock);
    }

    // TEST
    else if (textMessage.startsWith("!roll")) {
      rollDice(remoteJid, sock);
    } else if (textMessage.startsWith("!fact")) {
      getFact(remoteJid, sock);
    } else if (textMessage.startsWith("!joke")) {
      getJoke(remoteJid, sock);
    } else if (textMessage.startsWith("!setwelcome")) {
      if (!remoteJid.endsWith("@g.us")) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Perintah ini hanya bisa digunakan di grup.",
        });
        return;
      }

      const message = textMessage.replace("!setwelcome", "").trim();
      if (!message) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Harap masukkan pesan selamat datang.",
        });
        return;
      }

      setWelcomeMessage(remoteJid, message); // Hapus sock, karena tidak digunakan dalam fungsi
      sock.sendMessage(remoteJid, {
        text: "✅ Pesan selamat datang telah diatur!",
      });
    } else if (textMessage.startsWith("!setleave")) {
      if (!remoteJid.endsWith("@g.us")) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Perintah ini hanya bisa digunakan di grup.",
        });
        return;
      }

      const message = textMessage.replace("!setleave", "").trim();
      if (!message) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Harap masukkan pesan perpisahan.",
        });
        return;
      }

      setLeaveMessage(remoteJid, message); // Hapus sock karena tidak dibutuhkan dalam fungsi
      sock.sendMessage(remoteJid, {
        text: "✅ Pesan perpisahan telah diatur!",
      });
    } else if (textMessage.startsWith("!countdown")) {
      const eventDate = textMessage.replace("!countdown", "").trim(); // Ambil tanggal acara dari input pengguna
      console.log("Event Date Diterima: ", eventDate); // Log tanggal yang diterima dari input pengguna

      // Panggil fungsi countdown
      countdown(remoteJid, sock, eventDate);
    } else "Pilihan yang anda inginkan belum tersedia";
  });

  checkGroupSchedule(sock); // Mulai cek jadwal otomatis
}

/* 📚 *MANAJEMEN GURU & AUTO-RESPONSE*  
━━━━━━━━━━━━━━━━━━  
👨‍🏫 *MANAJEMEN GURU*  
✍️ *Tambah Guru* ➝ *!tambahguru [nomor]*  
📜 *Daftar Guru* ➝ *!listguru*  
❌ *Hapus Guru* ➝ *!hapusguru [nomor]*  

📖 *MANAJEMEN AUTO-RESPONSE*  
🤖 *Ajarkan Bot* ➝ *!ajarin [pertanyaan] = [jawaban]*  
📖 *Lihat Auto-Response* ➝ *!listajarin [halaman]*  
🗑 *Hapus Auto-Response* ➝ *!hapusajarin [pertanyaan]* */

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


/* 📩 *SARAN & MASUKAN*  
━━━━━━━━━━━━━━━━━━  
✍️ *Kirim Kritik* ➝ *!kritik*  
📜 *Lihat Kritik* ➝ *!lihatkritik* 
 */

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

async function rollDice(remoteJid, sock) {
  // Hasil roll dadu (1 sampai 6)
  const result = Math.floor(Math.random() * 6) + 1;

  // Cek apakah sock adalah instance dari WhatsApp client
  if (sock && sock.sendMessage) {
    await sock.sendMessage(remoteJid, {
      text: `🎲 *Hasil Roll Dadu*: ${result}`,
    });
  } else {
    console.log("Error: sock.sendMessage tidak ditemukan");
  }
}

async function getFact(remoteJid, sock) {
  try {
    const response = await fetch(
      "https://uselessfacts.jsph.pl/random.json?language=id"
    );
    const data = await response.json();

    // Kirimkan fakta menarik ke pengguna
    sock.sendMessage(remoteJid, {
      text: `🧠 *Fakta Menarik*:\n\n${data.text}`,
    });
  } catch (error) {
    sock.sendMessage(remoteJid, { text: "⚠️ Gagal mengambil fakta menarik." });
  }
}

async function getJoke(remoteJid, sock) {
  try {
    // Request ke API Dad Jokes
    const response = await fetch("https://icanhazdadjoke.com/", {
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();

    // Mengirimkan lelucon ke pengguna
    sock.sendMessage(remoteJid, {
      text: `😂 *Lelucon Ayah Hari Ini*:\n\n${data.joke}`,
    });
  } catch (error) {
    sock.sendMessage(remoteJid, { text: "⚠️ Gagal mengambil lelucon ayah." });
  }
}

// COUNTDOWN
const countdown = (remoteJid, sock, eventDate) => {
  const now = new Date(); // Mendapatkan waktu sekarang
  const event = new Date(eventDate); // Mengubah tanggal event yang diterima ke dalam bentuk Date object

  console.log("Waktu Sekarang: ", now); // Log waktu saat ini
  console.log("Waktu Acara: ", event); // Log waktu acara yang dimasukkan

  // Cek apakah eventDate valid
  if (isNaN(event)) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Format tanggal salah! Pastikan formatnya adalah YYYY-MM-DDTHH:MM:SS.",
    });
    return;
  }

  const timeDiff = event - now; // Selisih waktu dalam milidetik
  console.log("Selisih Waktu: ", timeDiff); // Log selisih waktu

  if (timeDiff <= 0) {
    // Jika acara sudah dimulai atau lewat (selisih waktu <= 0)
    sock.sendMessage(remoteJid, { text: "🎉 Acara sudah dimulai!" });
    return;
  }

  // Mengatur interval untuk countdown tiap detik
  let countdownInterval = setInterval(() => {
    const now = new Date(); // Waktu saat ini
    const timeDiff = event - now; // Selisih waktu dalam milidetik

    // Jika acara sudah dimulai, hentikan interval dan kirim pesan
    if (timeDiff <= 0) {
      clearInterval(countdownInterval); // Hentikan interval
      sock.sendMessage(remoteJid, { text: "🎉 Acara sudah dimulai!" });
      return;
    }

    // Hitung waktu sisa (hari, jam, menit, detik)
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000); // Ambil detik sisa waktu
    const minutes = Math.floor(seconds / 60); // Mengambil menit dari sisa detik
    const remainingSeconds = seconds % 60; // Sisa detik setelah dihitung menit

    // Menampilkan countdown setiap interval 30 detik
    if (minutes > 0 && remainingSeconds === 0) {
      sock.sendMessage(remoteJid, {
        text: `⏳ *Acara akan dimulai:* \n${minutes} menit lagi`,
      });
    } else if (remainingSeconds % 30 === 0 && remainingSeconds !== 0) {
      sock.sendMessage(remoteJid, {
        text: `⏳ *Acara akan dimulai:* \n${remainingSeconds} detik lagi`,
      });
    }

    // Tampilkan countdown untuk detik 3, 2, 1
    if (remainingSeconds <= 3 && remainingSeconds > 0) {
      sock.sendMessage(remoteJid, {
        text: `⏳ *Hitung Mundur:* \n${remainingSeconds}...`,
      });
    }

    // Jika countdown sudah mencapai 0 detik, kirim pesan "Acara Dimulai"
    if (remainingSeconds <= 0) {
      clearInterval(countdownInterval); // Hentikan interval
      sock.sendMessage(remoteJid, { text: "🎉 Acara sudah dimulai!" });
    }
  }, 1000); // Setiap detik (1000 ms)
};

// Nama file untuk menyimpan data divisi
const divisiFile = "divisiData.json";

// Menyimpan data divisi ke dalam file JSON
const saveDivisiData = (divisiList) => {
  fs.writeFileSync(divisiFile, JSON.stringify(divisiList, null, 2));
};

// Membaca data divisi dari file JSON
const loadDivisiData = () => {
  if (fs.existsSync(divisiFile)) {
    const data = fs.readFileSync(divisiFile);
    return JSON.parse(data);
  }
  return {}; // Jika file tidak ada, kembalikan objek kosong
};

// Menambahkan divisi baru
const addDivisi = (remoteJid, sock, divisi) => {
  let divisiList = loadDivisiData();

  if (divisiList[divisi]) {
    sock.sendMessage(remoteJid, { text: `⚠️ Divisi *${divisi}* sudah ada.` });
    return;
  }

  divisiList[divisi] = [];
  saveDivisiData(divisiList);
  sock.sendMessage(remoteJid, {
    text: `✅ Divisi *${divisi}* berhasil dibuat.`,
  });
};

// Menandai semua anggota dalam divisi tertentu
const tagDivisi = async (remoteJid, sock, textMessage) => {
  const args = textMessage.split(" ").slice(1);
  if (args.length === 0) {
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Format salah! Gunakan: *!tagdivisi [nama_divisi]*",
    });
    return;
  }

  const divisi = args.join(" ").toLowerCase();
  let divisiList = loadDivisiData();

  if (!divisiList[divisi]) {
    await sock.sendMessage(remoteJid, {
      text: `⚠️ Divisi *${divisi.toUpperCase()}* tidak ditemukan.`,
    });
    return;
  }

  const anggota = divisiList[divisi];
  if (!anggota || anggota.length === 0) {
    await sock.sendMessage(remoteJid, {
      text: `⚠️ Divisi *${divisi.toUpperCase()}* belum memiliki anggota.`,
    });
    return;
  }

  // **Format hanya menampilkan nomor atau username, tapi tetap bisa mention**
  const mentions = anggota.map(
    (user) => `${user.replace(/\D/g, "")}@s.whatsapp.net`
  );
  const displayNames = anggota.map((user) =>
    user.replace("@s.whatsapp.net", "")
  ); // Hapus @s.whatsapp.net dari tampilan

  // **Format pesan utama**
  let response = `📢 *Panggilan untuk Divisi ${divisi.toUpperCase()}*\n━━━━━━━━━━━━━━━━━━\n`;
  response += `👥 *Anggota ${divisi.toUpperCase()}:*\n`;
  response += displayNames.join("\n"); // **Tampilkan hanya nomor/username**
  response += `\n━━━━━━━━━━━━━━━━━━`;

  // **Kirim pesan ke WhatsApp dengan mentions**
  sock
    .sendMessage(remoteJid, {
      text: response,
      mentions: mentions, // Mention tetap pakai format WhatsApp
    })
    .catch((err) => {
      sock.sendMessage(remoteJid, { text: `❌ Gagal Mengirim Pesan: ${err}` });
    });
};

// Menampilkan anggota dalam semua divisi
const listDivisi = (remoteJid, sock) => {
  let divisiList = loadDivisiData();

  console.log("📥 Perintah diterima: !listdivisi");
  console.log("📂 Data divisi yang tersimpan:", divisiList);

  if (Object.keys(divisiList).length === 0) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Tidak ada divisi yang tersedia. Tambahkan dengan *!adddivisi [nama_divisi]*",
    });
    return;
  }

  let response = "📋 *Daftar Divisi yang Tersedia:*\n━━━━━━━━━━━━━━━━━━";
  for (let divisi in divisiList) {
    const anggotaCount = divisiList[divisi].length;
    response += `\n🔹 *${divisi.toUpperCase()}* (${anggotaCount} anggota)`;
  }
  response += "\n━━━━━━━━━━━━━━━━━━";

  sock.sendMessage(remoteJid, { text: response });
};

// Menambahkan anggota ke dalam divisi
const addToDivisi = (remoteJid, sock, user, divisi) => {
  let divisiList = loadDivisiData();

  if (!divisiList[divisi]) {
    divisiList[divisi] = [];
  }

  if (!divisiList[divisi].includes(user)) {
    divisiList[divisi].push(user);
    sock.sendMessage(remoteJid, {
      text: `✅ *${user}* telah ditambahkan ke divisi *${divisi}*.`,
    });
    saveDivisiData(divisiList); // Simpan data setelah perubahan
  } else {
    sock.sendMessage(remoteJid, {
      text: `⚠️ *${user}* sudah ada dalam divisi *${divisi}*.`,
    });
  }
};

// Menghapus anggota dari divisi
const removeFromDivisi = (remoteJid, sock, user, divisi) => {
  let divisiList = loadDivisiData();

  if (!divisiList[divisi]) {
    sock.sendMessage(remoteJid, {
      text: `⚠️ Divisi *${divisi}* tidak ditemukan.`,
    });
    return;
  }

  if (!divisiList[divisi].includes(user)) {
    sock.sendMessage(remoteJid, {
      text: `⚠️ *${user}* tidak terdaftar dalam divisi *${divisi}*.`,
    });
    return;
  }

  // Hapus user dari divisi
  divisiList[divisi] = divisiList[divisi].filter((member) => member !== user);
  saveDivisiData(divisiList);

  sock.sendMessage(remoteJid, {
    text: `✅ *${user}* telah dihapus dari divisi *${divisi}*.`,
  });
  console.log(`✅ ${user} dihapus dari divisi ${divisi}`);
};

//ABSENSI
const FILE_PATH = "./daftar_hadir.json"; // Lokasi penyimpanan

// 🔹 Load data dari file JSON
function loadData() {
  if (!fs.existsSync(FILE_PATH)) return {}; // Jika file belum ada, return objek kosong
  let rawData = fs.readFileSync(FILE_PATH);
  return JSON.parse(rawData);
}

// 🔹 Simpan data ke file JSON
function saveData(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

function tambahNama(divisi, nama) {
  let data = loadData(); // Load daftar hadir

  if (!data[divisi]) {
    data[divisi] = []; // Buat divisi jika belum ada
  }

  if (!data[divisi].includes(nama)) {
    data[divisi].push(nama); // Tambah nama ke divisi
    saveData(data);
    return `✅ ${nama} berhasil ditambahkan ke divisi *${divisi}*!`;
  } else {
    return `⚠️ ${nama} sudah ada dalam daftar divisi *${divisi}*!`;
  }
}

function editNama(divisi, namaLama, namaBaru) {
  let data = loadData();

  if (!data[divisi] || !data[divisi].includes(namaLama)) {
    return `⚠️ Nama *${namaLama}* tidak ditemukan di divisi *${divisi}*!`;
  }

  let index = data[divisi].indexOf(namaLama);
  data[divisi][index] = namaBaru; // Ganti nama
  saveData(data);

  return `✅ Nama *${namaLama}* telah diganti menjadi *${namaBaru}* dalam divisi *${divisi}*!`;
}

function hapusNama(divisi, nama) {
  let data = loadData();

  if (!data[divisi] || !data[divisi].includes(nama)) {
    return `⚠️ Nama *${nama}* tidak ditemukan di divisi *${divisi}*!`;
  }

  data[divisi] = data[divisi].filter((n) => n !== nama); // Hapus nama
  saveData(data);

  return `🗑️ Nama *${nama}* telah dihapus dari divisi *${divisi}*!`;
}

function tambahRapat(judul, tanggal, jabatan = null, nama = null) {
  let data = loadData();

  if (!data[judul]) {
    data[judul] = {}; // Buat rapat jika belum ada
  }

  if (!tanggal) {
    return "⚠️ Harap sertakan tanggal dalam format YYYY-MM-DD.";
  }

  if (!data[judul][tanggal]) {
    data[judul][tanggal] = {}; // Pastikan ada tempat untuk tanggal
  }

  if (jabatan && nama) {
    if (!data[judul][tanggal][jabatan]) {
      data[judul][tanggal][jabatan] = [];
    }

    if (!data[judul][tanggal][jabatan].includes(nama)) {
      data[judul][tanggal][jabatan].push(nama);
    }
  }

  saveData(data);
  return `✅ Rapat *${judul}* pada *${tanggal}* berhasil ditambahkan!`;
}

function tampilkanDaftarRapat(judul, tanggal = null) {
  let data = loadData();
  if (!data[judul]) {
    return `⚠️ Rapat *${judul}* tidak ditemukan.`;
  }

  let pesan = `📋 *Daftar Hadir Rapat: ${judul}*\n\n`;

  if (tanggal) {
    if (!data[judul][tanggal]) {
      return `⚠️ Tidak ada data untuk *${judul}* pada *${tanggal}*.`;
    }

    pesan += `📆 *Tanggal: ${tanggal}*\n`;

    for (let jabatan in data[judul][tanggal]) {
      pesan += `\n🛑 *${jabatan}*\n`;
      data[judul][tanggal][jabatan].forEach((nama) => {
        pesan += `🪄 ${nama}\n`;
      });
    }
    return pesan;
  }

  for (let tanggalRapat in data[judul]) {
    pesan += `📆 *${tanggalRapat}*\n`;
    for (let jabatan in data[judul][tanggalRapat]) {
      pesan += `\n🛑 *${jabatan}*\n`;
      data[judul][tanggalRapat][jabatan].forEach((nama) => {
        pesan += `🪄 ${nama}\n`;
      });
    }
    pesan += "\n";
  }

  return pesan;
}

function salinRapat(sumber, tujuan) {
  let data = loadData();

  // Pastikan rapat sumber ada
  if (!data[sumber]) {
    return `⚠️ Rapat *${sumber}* tidak ditemukan.`;
  }

  // Jika rapat tujuan belum ada, buat baru
  if (!data[tujuan]) {
    data[tujuan] = {};
  }

  // Salin data dari sumber ke tujuan
  for (let jabatan in data[sumber]) {
    if (!data[tujuan][jabatan]) {
      data[tujuan][jabatan] = [];
    }

    // Gabungkan daftar nama tanpa duplikasi
    data[sumber][jabatan].forEach((nama) => {
      if (!data[tujuan][jabatan].includes(nama)) {
        data[tujuan][jabatan].push(nama);
      }
    });
  }

  saveData(data);
  return `✅ Daftar hadir dari *${sumber}* berhasil disalin ke *${tujuan}*!`;
}

function absen(judul, tanggal, nama, status = "✅") {
  let data = loadData();

  if (!data[judul] || !data[judul][tanggal]) {
    return `⚠️ Rapat *${judul}* pada *${tanggal}* tidak ditemukan.`;
  }

  let ditemukan = false;

  for (let jabatan in data[judul][tanggal]) {
    let daftarNama = data[judul][tanggal][jabatan];

    for (let i = 0; i < daftarNama.length; i++) {
      if (typeof daftarNama[i] === "string" && daftarNama[i].startsWith(nama)) {
        daftarNama[i] = `${nama} ${status}`;
        ditemukan = true;
      }
    }
  }

  if (!ditemukan) {
    return `⚠️ ${nama} tidak ditemukan dalam daftar hadir *${judul}* pada *${tanggal}*.`;
  }

  saveData(data);
  return `✅ ${nama} telah absen di *${judul}* pada *${tanggal}* dengan status: *${status}*`;
}

// NEW FITUR
// VOting
const activeVotes = {}; // Menyimpan voting yang sedang berjalan

async function handleVoteCommand(remoteJid, sock, textMessage) {
  try {
    const args = textMessage.split(" ").slice(1);
    const command = args[0];

    if (command === "mulai") {
      // Memulai voting
      const voteData = textMessage.slice("!vote mulai".length).trim();
      const [question, ...options] = voteData.split("|").map((s) => s.trim());

      if (!question || options.length < 2) {
        return await sock.sendMessage(remoteJid, {
          text: "⚠️ Format salah! Gunakan: *!vote mulai Pertanyaan | Opsi1 | Opsi2 | ...*",
        });
      }

      activeVotes[remoteJid] = { question, options, votes: {} };

      let voteMessage = `📊 *Voting Dimulai!*\n\n❓ *${question}*\n`;
      options.forEach((opt, i) => {
        voteMessage += `\n${i + 1}. ${opt}`;
      });
      voteMessage += `\n\nKetik *!vote pilih [nomor opsi]* untuk memilih!`;

      return await sock.sendMessage(remoteJid, { text: voteMessage });
    } else if (command === "pilih") {
      // Memberikan suara
      const voteNumber = parseInt(args[1]);

      if (!activeVotes[remoteJid]) {
        return await sock.sendMessage(remoteJid, {
          text: "⚠️ Tidak ada voting yang aktif!",
        });
      }

      if (
        isNaN(voteNumber) ||
        voteNumber < 1 ||
        voteNumber > activeVotes[remoteJid].options.length
      ) {
        return await sock.sendMessage(remoteJid, {
          text: "⚠️ Pilihan tidak valid! Gunakan nomor opsi yang tersedia.",
        });
      }

      const sender = remoteJid.split("@")[0]; // Menggunakan nomor sebagai ID pemilih
      activeVotes[remoteJid].votes[sender] = voteNumber;

      return await sock.sendMessage(remoteJid, {
        text: "✅ Suara Anda telah tercatat!",
      });
    } else if (command === "hasil") {
      // Menampilkan hasil voting
      if (!activeVotes[remoteJid]) {
        return await sock.sendMessage(remoteJid, {
          text: "⚠️ Tidak ada voting yang aktif!",
        });
      }

      const voteData = activeVotes[remoteJid];
      const voteCounts = voteData.options.map(() => 0);

      Object.values(voteData.votes).forEach((vote) => {
        voteCounts[vote - 1]++;
      });

      let resultMessage = `📊 *Hasil Voting:*\n\n❓ *${voteData.question}*\n`;
      voteData.options.forEach((opt, i) => {
        resultMessage += `\n${i + 1}. ${opt} - ${voteCounts[i]} suara`;
      });

      return await sock.sendMessage(remoteJid, { text: resultMessage });
    } else if (command === "hapus") {
      // Menghapus voting
      if (!activeVotes[remoteJid]) {
        return await sock.sendMessage(remoteJid, {
          text: "⚠️ Tidak ada voting yang aktif!",
        });
      }

      delete activeVotes[remoteJid];
      return await sock.sendMessage(remoteJid, {
        text: "🗑️ Voting telah dihapus!",
      });
    } else {
      return await sock.sendMessage(remoteJid, {
        text: "⚠️ Perintah tidak dikenali. Gunakan *!vote mulai/pilih/hasil/hapus*",
      });
    }
  } catch (error) {
    console.error("Error handling vote command:", error.message);
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Terjadi kesalahan dalam fitur voting.",
    });
  }
}
// POLING
const activePolls = {}; // Menyimpan polling yang sedang berlangsung

async function handlePollCommand(remoteJid, sock, textMessage) {
  try {
    const args = textMessage.split(" ").slice(1);
    const command = args[0];

    if (command === "mulai") {
      // Memulai polling
      const pollData = textMessage.slice("!poll mulai".length).trim();
      const [question, ...options] = pollData.split("|").map((s) => s.trim());

      if (!question || options.length < 2) {
        return await sock.sendMessage(remoteJid, {
          text: "⚠️ Format salah! Gunakan: *!poll mulai Pertanyaan | Opsi1 | Opsi2 | ...*",
        });
      }

      activePolls[remoteJid] = { question, options, votes: {} };

      let pollMessage = `📊 *Polling Dimulai!*\n\n❓ *${question}*\n`;
      options.forEach((opt, i) => {
        pollMessage += `\n${i + 1}. ${opt}`;
      });
      pollMessage += `\n\nKetik *!poll pilih [nomor opsi]* untuk memberikan suara (bisa memilih lebih dari satu)!`;

      return await sock.sendMessage(remoteJid, { text: pollMessage });
    } else if (command === "pilih") {
      // Memberikan suara pada polling
      const voteNumber = parseInt(args[1]);

      if (!activePolls[remoteJid]) {
        return await sock.sendMessage(remoteJid, {
          text: "⚠️ Tidak ada polling yang aktif!",
        });
      }

      if (
        isNaN(voteNumber) ||
        voteNumber < 1 ||
        voteNumber > activePolls[remoteJid].options.length
      ) {
        return await sock.sendMessage(remoteJid, {
          text: "⚠️ Pilihan tidak valid! Gunakan nomor opsi yang tersedia.",
        });
      }

      const sender = remoteJid.split("@")[0]; // Menggunakan nomor sebagai ID pemilih
      if (!activePolls[remoteJid].votes[sender]) {
        activePolls[remoteJid].votes[sender] = [];
      }

      if (!activePolls[remoteJid].votes[sender].includes(voteNumber)) {
        activePolls[remoteJid].votes[sender].push(voteNumber);
      }

      return await sock.sendMessage(remoteJid, {
        text: "✅ Suara Anda telah tercatat!",
      });
    } else if (command === "hasil") {
      // Menampilkan hasil polling
      if (!activePolls[remoteJid]) {
        return await sock.sendMessage(remoteJid, {
          text: "⚠️ Tidak ada polling yang aktif!",
        });
      }

      const pollData = activePolls[remoteJid];
      const voteCounts = pollData.options.map(() => 0);
      let totalVotes = 0;

      Object.values(pollData.votes).forEach((votes) => {
        votes.forEach((vote) => {
          voteCounts[vote - 1]++;
          totalVotes++;
        });
      });

      let resultMessage = `📊 *Hasil Polling:*\n\n❓ *${pollData.question}*\n`;
      pollData.options.forEach((opt, i) => {
        const percentage =
          totalVotes === 0
            ? 0
            : ((voteCounts[i] / totalVotes) * 100).toFixed(1);
        resultMessage += `\n${i + 1}. ${opt} - ${
          voteCounts[i]
        } suara (${percentage}%)`;
      });

      return await sock.sendMessage(remoteJid, { text: resultMessage });
    } else if (command === "hapus") {
      // Menghapus polling
      if (!activePolls[remoteJid]) {
        return await sock.sendMessage(remoteJid, {
          text: "⚠️ Tidak ada polling yang aktif!",
        });
      }

      delete activePolls[remoteJid];
      return await sock.sendMessage(remoteJid, {
        text: "🗑️ Polling telah dihapus!",
      });
    } else {
      return await sock.sendMessage(remoteJid, {
        text: "⚠️ Perintah tidak dikenali. Gunakan *!poll mulai/pilih/hasil/hapus*",
      });
    }
  } catch (error) {
    console.error("Error handling poll command:", error.message);
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Terjadi kesalahan dalam fitur polling.",
    });
  }
}

async function refreshGroup(remoteJid, sock) {
  try {
    // Ambil metadata grup
    const groupMetadata = await sock.groupMetadata(remoteJid);

    // Periksa apakah bot adalah admin
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const isBotAdmin = groupMetadata.participants.some(
      (participant) => participant.id === botNumber && participant.admin
    );

    if (!isBotAdmin) {
      return sock.sendMessage(remoteJid, {
        text: "⚠️ Bot bukan admin! Berikan akses admin untuk menggunakan fitur ini.",
      });
    }

    // Lakukan pembaruan grup (misalnya refresh data)
    await sock.sendMessage(remoteJid, { text: "🔄 Grup berhasil diperbarui!" });
  } catch (error) {
    console.error("Error saat memperbarui grup:", error);
    sock.sendMessage(remoteJid, {
      text: "⚠️ Gagal memperbarui grup. Pastikan bot adalah admin!",
    });
  }
}

const welcomeleave = "./welcome_leave.json";

// Cache untuk mencegah duplikasi event
const recentEvents = new Set();

// Load data dari file JSON
async function loadData() {
  if (!fs.existsSync(welcomeleave)) return {};
  let rawData = await fs.promises.readFile(welcomeleave, "utf-8");
  return JSON.parse(rawData);
}

// Simpan data ke file JSON
async function saveData(data) {
  await fs.promises.writeFile(welcomeleave, JSON.stringify(data, null, 2));
}

// Set pesan selamat datang
async function setWelcomeMessage(groupId, message) {
  let data = await loadData();
  data[groupId] = data[groupId] || {};
  data[groupId].welcome = message;
  await saveData(data);
  return `✅ Pesan selamat datang telah diatur untuk grup ini.`;
}

// Set pesan perpisahan
async function setLeaveMessage(groupId, message) {
  let data = await loadData();
  data[groupId] = data[groupId] || {};
  data[groupId].leave = message;
  await saveData(data);
  return `✅ Pesan perpisahan telah diatur untuk grup ini.`;
}

// Mendapatkan pesan selamat datang
async function getWelcomeMessage(groupId, participant, groupName) {
  let data = await loadData();
  let userMention = `@${participant.split("@")[0]}`;
  return data[groupId]?.welcome
    ? data[groupId].welcome
        .replace("@user", userMention)
        .replace("@group", groupName)
    : `Selamat datang di ${groupName}, ${userMention}!`;
}

// Mendapatkan pesan perpisahan
async function getLeaveMessage(groupId, participant, groupName) {
  let data = await loadData();
  let userMention = `@${participant.split("@")[0]}`;
  return data[groupId]?.leave
    ? data[groupId].leave
        .replace("@user", userMention)
        .replace("@group", groupName)
    : `Selamat tinggal, ${userMention}!`;
}

const dbFile = "custom_messages.json";

// **Load database dari file JSON**
function loadDatabase() {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({}, null, 2));
  }
  return JSON.parse(fs.readFileSync(dbFile));
}

// **Simpan database ke file JSON**
function saveDatabase(db) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

// **Fungsi CRUD untuk pesan custom**
async function handleCustomMessages(textMessage, remoteJid, sock) {
  let db = loadDatabase();

  // **Create: Tambah perintah baru**
  if (textMessage.startsWith("!add ")) {
    let [cmd, ...response] = textMessage.slice(5).split(" ");
    if (!cmd || response.length === 0) {
      return sock.sendMessage(remoteJid, {
        text: "⚠️ Format: !add <perintah> <balasan>",
      });
    }
    db[cmd] = response.join(" ");
    saveDatabase(db);
    return sock.sendMessage(remoteJid, {
      text: `✅ Perintah *${cmd}* ditambahkan!`,
    });
  }

  // **Read: Lihat semua perintah custom**
  if (textMessage === "!list") {
    let commands = Object.keys(db).join("\n");
    return sock.sendMessage(remoteJid, {
      text: `📜 *Daftar perintah custom:*\n${
        commands || "Belum ada perintah."
      }`,
    });
  }

  // **Update: Ubah balasan perintah**
  if (textMessage.startsWith("!update ")) {
    let [cmd, ...response] = textMessage.slice(8).split(" ");
    if (!db[cmd]) {
      return sock.sendMessage(remoteJid, {
        text: `⚠️ Perintah *${cmd}* tidak ditemukan!`,
      });
    }
    db[cmd] = response.join(" ");
    saveDatabase(db);
    return sock.sendMessage(remoteJid, {
      text: `🔄 Perintah *${cmd}* diperbarui!`,
    });
  }

  // **Delete: Hapus perintah**
  if (textMessage.startsWith("!delete ")) {
    let cmd = textMessage.split(" ")[1];
    if (!db[cmd]) {
      return sock.sendMessage(remoteJid, {
        text: `⚠️ Perintah *${cmd}* tidak ditemukan!`,
      });
    }
    delete db[cmd];
    saveDatabase(db);
    return sock.sendMessage(remoteJid, {
      text: `🗑️ Perintah *${cmd}* dihapus!`,
    });
  }

  // **Balas jika perintah ada di database**
  if (db[textMessage]) {
    return sock.sendMessage(remoteJid, { text: db[textMessage] });
  }
}


startBot();
