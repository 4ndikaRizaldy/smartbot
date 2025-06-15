require("dotenv").config();

const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  useSingleFileAuthState,
  Browsers,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
// Buat logger yang hanya menampilkan error (atau bahkan tidak sama sekali)
const logger = pino({ level: "error" }); // bisa diganti 'silent' kalau mau tanpa log sama sekali
const moment = require("moment");
require("moment-hijri");
require("moment-timezone");
const axios = require("axios");
const math = require("mathjs");
const translate = require("google-translate-api-x");
const fs = require("fs");

const { autoResponses } = require("./data");

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
  isUserAdmin,
  groupSchedules,
  saveScheduleToFile,

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
  kickNonAdmins,
  setRole,
  mentionRole,
  showRoles,
  deleteRoleMember,
} = require("./grup");
// Konfigurasi bahasa untuk format tanggal Indonesia
moment.locale("id");

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

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger, // tambahkan logger ini
  });

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

    try {
      // Ambil metadata grup sekali saja
      let groupInfo = await sock.groupMetadata(id);
      let groupName = groupInfo.subject || "Grup";

      // Cek status greeting
      let isGreetingEnabled = await getGreetingStatus(id);
      console.log(
        `🔍 Greeting status untuk grup ${groupName}: ${isGreetingEnabled}`
      );

      if (!isGreetingEnabled) {
        console.log(
          `⏳ Greeting dinonaktifkan untuk grup ${groupName}, abaikan...`
        );
        return; // Jangan kirim pesan jika greeting dimatikan
      }

      for (let participant of participants) {
        let eventKey = `${id}_${participant}_${action}`;

        if (recentEvents.has(eventKey)) {
          console.log(`⏳ Event ${eventKey} sudah diproses, abaikan...`);
          continue;
        }

        recentEvents.set(eventKey, Date.now());
        setTimeout(() => recentEvents.delete(eventKey), 5000);

        console.log(
          `🔹 Memproses ${action} untuk ${participant} di ${groupName}`
        );

        if (action === "add") {
          let welcomeMessage = await getWelcomeMessage(
            id,
            participant,
            groupName
          );
          console.log(`🔹 Pesan Selamat Datang: ${welcomeMessage}`);
          if (welcomeMessage) {
            sock.sendMessage(id, {
              text: welcomeMessage,
              mentions: [participant],
            });
          }
        } else if (action === "remove") {
          let leaveMessage = await getLeaveMessage(id, participant, groupName);
          console.log(`🔹 Pesan Perpisahan: ${leaveMessage}`);
          if (leaveMessage) {
            sock.sendMessage(id, {
              text: leaveMessage,
              mentions: [participant],
            });
          }
        }
      }
    } catch (err) {
      console.error(`❌ Terjadi kesalahan: ${err.message}`);
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
    if (textMessage === "!menu") {
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

    // GREETING
    else if (textMessage.startsWith("!setwelcome ")) {
      const message = textMessage.replace("!setwelcome", "").trim();
      if (!message) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Harap masukkan pesan selamat datang.",
        });
        return;
      }
      const response = await setWelcomeMessage(remoteJid, message);
      sock.sendMessage(remoteJid, { text: response });
    } else if (textMessage.startsWith("!setleave ")) {
      const message = textMessage.replace("!setleave", "").trim();
      if (!message) {
        sock.sendMessage(remoteJid, {
          text: "⚠️ Harap masukkan pesan perpisahan.",
        });
        return;
      }
      const response = await setLeaveMessage(remoteJid, message);
      sock.sendMessage(remoteJid, { text: response });
    }  else if (textMessage === "!clearwelcome") {
      const response = await clearWelcomeMessage(remoteJid);
      sock.sendMessage(remoteJid, { text: response });
    } else if (textMessage === "!clearleave") {
      const response = await clearLeaveMessage(remoteJid);
      sock.sendMessage(remoteJid, { text: response });
    } else if (textMessage === "!greeting on") {
      const response = await setGreetingStatus(remoteJid, true);
      console.log(`✅ Perintah !greeting on dijalankan. Response: ${response}`);
      sock.sendMessage(remoteJid, { text: response });
    } else if (textMessage === "!greeting off") {
      const response = await setGreetingStatus(remoteJid, false);
      console.log(
        `✅ Perintah !greeting off dijalankan. Response: ${response}`
      );
      sock.sendMessage(remoteJid, { text: response });
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
    } else if (textMessage.startsWith("!kick ")) {
      const phoneNumbers = textMessage.replace("!kick ", "").trim().split(" ");
      await removeMultipleMembers(remoteJid, sender, sock, phoneNumbers);
    } else if (textMessage === "!kicknonadmin") {
      await kickNonAdmins(remoteJid, sender, sock);
    } else if (textMessage.startsWith("!setrole")) {
      const [_, phone, role] = textMessage.split(" ");
      const targetJid = `${phone.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
      await setRole(remoteJid, sender, sock, targetJid, role);
    } else if (textMessage.startsWith("!tag")) {
      const [_, roleName] = textMessage.split(" ");
      await mentionRole(remoteJid, sock, roleName);
    } else if (textMessage === "!roles") {
      await showRoles(remoteJid, sock);
    } else if (textMessage.startsWith("!delrole")) {
      const args = textMessage.split(" ");
      if (args.length < 3) {
        return sock.sendMessage(remoteJid, {
          text: "❗ Format: `!delrole [role] [nomor]`\nContoh: `!delrole desain 6281234567890`",
        });
      }

      const role = args[1];
      const number = args[2].replace(/[^0-9]/g, ""); // bersihkan format nomor

      await deleteRoleMember(remoteJid, sender, sock, role, number);
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

     else if (textMessage.startsWith("!setnamegc ")) {
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
    } else if (textMessage.startsWith("!member ")) {
      const isGroup = remoteJid.endsWith("@g.us");
      if (!isGroup) {
        return sock.sendMessage(remoteJid, {
          text: "⚠️ Perintah ini hanya bisa digunakan dalam grup.",
        });
      }

      const message = textMessage.slice(8).trim();
      if (!message) {
        return sock.sendMessage(remoteJid, {
          text: "⚠️ Harap masukkan pesan setelah perintah !member",
        });
      }

      try {
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const nonAdmins = groupMetadata.participants
          .filter((member) => !member.admin)
          .map((member) => member.id);

        if (nonAdmins.length === 0) {
          return sock.sendMessage(remoteJid, {
            text: "✅ Semua anggota adalah admin!",
          });
        }

        await sock.sendMessage(remoteJid, {
          text: message,
          mentions: nonAdmins,
        });
      } catch (error) {
        console.error("❌ Error saat menjalankan !member:", error);
        sock.sendMessage(remoteJid, {
          text: "⚠️ Terjadi kesalahan. Pastikan bot adalah admin grup.",
        });
      }
    } else if (textMessage.startsWith("!admin ")) {
      const isGroup = remoteJid.endsWith("@g.us");
      if (!isGroup) {
        return sock.sendMessage(remoteJid, {
          text: "⚠️ Perintah ini hanya bisa digunakan dalam grup.",
        });
      }

      const message = textMessage.slice(7).trim();
      if (!message) {
        return sock.sendMessage(remoteJid, {
          text: "⚠️ Harap masukkan pesan setelah perintah !admin",
        });
      }

      try {
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const admins = groupMetadata.participants
          .filter((member) => member.admin)
          .map((member) => member.id);

        if (admins.length === 0) {
          return sock.sendMessage(remoteJid, {
            text: "⚠️ Tidak ada admin dalam grup ini!",
          });
        }

        await sock.sendMessage(remoteJid, {
          text: message,
          mentions: admins,
        });
      } catch (error) {
        console.error("❌ Error saat menjalankan !admin:", error);
        sock.sendMessage(remoteJid, {
          text: "⚠️ Terjadi kesalahan. Pastikan bot adalah admin grup.",
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

  // **Create: Tambah perintah custom**
  if (textMessage.startsWith("!addcmd ")) {
    let input = textMessage.slice(8).trim();
    let [cmd, response] = input.split("|").map((part) => part.trim());

    if (!cmd || !response) {
      return sock.sendMessage(remoteJid, {
        text: "⚠️ Format: !addcmd <perintah> | <balasan>",
      });
    }

    db[cmd.toLowerCase()] = response;
    saveDatabase(db);
    return sock.sendMessage(remoteJid, {
      text: `✅ Perintah *${cmd}* berhasil ditambahkan!`,
    });
  }

  // **Read: Lihat semua perintah custom**
  if (textMessage === "!listcmd") {
    let commands = Object.keys(db).join("\n");
    return sock.sendMessage(remoteJid, {
      text: `📜 *Daftar perintah custom:*\n${
        commands || "Belum ada perintah."
      }`,
    });
  }

  // **Update: Ubah balasan perintah**
  if (textMessage.startsWith("!updatecmd ")) {
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
  if (textMessage.startsWith("!deletecmd ")) {
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
  if (db[textMessage.toLowerCase()]) {
    return sock.sendMessage(remoteJid, { text: db[textMessage.toLowerCase()] });
  }
}

// FITUR GREETING
const welcomeleave = "welcome_leave.json";

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
  console.log(`Setting welcome message for group ${groupId}: ${message}`);
  data[groupId] = data[groupId] || {};
  data[groupId].welcome = message;
  await saveData(data);
  console.log("Data setelah diupdate:", data);
  return "✅ Pesan selamat datang telah diatur untuk grup ini.";
}

async function setLeaveMessage(groupId, message) {
  let data = await loadData();
  console.log(`Setting leave message for group ${groupId}: ${message}`);
  data[groupId] = data[groupId] || {};
  data[groupId].leave = message;
  await saveData(data);
  console.log("Data setelah diupdate:", data);
  return "✅ Pesan perpisahan telah diatur untuk grup ini.";
}

// Set status greeting (on/off)
async function setGreetingStatus(groupId, status) {
  let data = await loadData();
  data[groupId] = data[groupId] || {};
  data[groupId].greetingEnabled = status;
  await saveData(data);
  return `✅ Greeting telah ${
    status ? "diaktifkan" : "dinonaktifkan"
  } untuk grup ini.`;
}

// Get pesan selamat datang
async function getWelcomeMessage(groupId, participant, groupName) {
  let data = await loadData();
  let userMention = `@${participant.split("@")[0]}`;
  groupName = groupName || "Grup"; // Jika groupName tidak tersedia, gunakan "Grup"

  if (data[groupId]?.welcome) {
    return data[groupId].welcome
      .replace("@user", userMention)
      .replace("@group", groupName);
  }

  return `Selamat datang di ${groupName}, ${userMention}! Semoga betah ya.`;
}

// Get pesan perpisahan
async function getLeaveMessage(groupId, participant, groupName) {
  let data = await loadData();
  let userMention = `@${participant.split("@")[0]}`;
  groupName = groupName || "Grup";

  if (data[groupId]?.leave) {
    return data[groupId].leave
      .replace("@user", userMention)
      .replace("@group", groupName);
  }

  return `Selamat tinggal, ${userMention}! Semoga sukses di tempat baru.`;
}

// Get status greeting
async function getGreetingStatus(groupId) {
  let data = await loadData();
  return data[groupId]?.greetingEnabled !== false;
}

// Clear pesan selamat datang
async function clearWelcomeMessage(groupId) {
  let data = await loadData();
  if (data[groupId]?.welcome) delete data[groupId].welcome;
  await saveData(data);
  return "✅ Pesan selamat datang telah dihapus.";
}

// Clear pesan perpisahan
async function clearLeaveMessage(groupId) {
  let data = await loadData();
  if (data[groupId]?.leave) delete data[groupId].leave;
  await saveData(data);
  return "✅ Pesan perpisahan telah dihapus.";
}

startBot();
