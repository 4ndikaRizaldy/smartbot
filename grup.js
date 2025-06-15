require("dotenv").config();
const moment = require("moment");
require("moment-hijri");
require("moment-timezone");
const fs = require("fs");
const { isAdminOrAllowedUser } = require("./utils/groupAuth");
/* AWAL */
/* GRUP DAN ADMIN */
/* ⏰ *PENGINGAT (REMINDER)*  
━━━━━━━━━━━━━━━━━━  
📅 *Setel Pengingat* ➝ *!setremind [tanggal] [jam] [pesan]*  
🏷️ *Setel Pengingat Grup* ➝ *!setgremind [tanggal] [jam] [pesan]*  
📜 *Lihat Pengingat* ➝ *!listremind*  
❌ *Hapus Pengingat* ➝ *!cancelremind [ID]*  
❌ *Stop Reminder Berulang* ➝ *!stopremind*
🔁 *Pengingat Berulang* ➝ *!repeatremind [waktu] [pesan]* | *!stoprepeat* */

// REMINDER
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

  // Simpan pengingat ke file
  const reminders = loadReminders(); // Memuat pengingat yang ada
  reminders.push({ date: reminderTime.toLocaleString(), time: reminderTime, message, isGroup }); // Tambahkan pengingat baru
  saveReminders(reminders); // Simpan kembali ke file

  // Set timeout untuk mengirimkan reminder saat waktunya tiba
  setTimeout(() => {
    sock.sendMessage(remoteJid, { text: `🔔 *Reminder!*\n ${message}` });
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

const cancelReminder = (textMessage, remoteJid, sock) => {
  const args = textMessage.split(" ");
  if (args.length < 2 || isNaN(args[1])) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Gunakan format *!cancelremind <nomor>* untuk menghapus reminder!",
    });
    return;
  }

  const id = parseInt(args[1]) - 1;
  let reminders = loadReminders();

  if (!Array.isArray(reminders)) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Tidak dapat memuat daftar reminder!",
    });
    return;
  }

  if (id < 0 || id >= reminders.length) {
    sock.sendMessage(remoteJid, {
      text: `⚠️ Reminder dengan nomor *${args[1]}* tidak ditemukan!`,
    });
    return;
  }

  reminders.splice(id, 1);
  saveReminders(reminders);

  sock.sendMessage(remoteJid, {
    text: `✅ Reminder nomor *${args[1]}* telah dihapus!`,
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
    clearInterval(repeatReminders[sender].intervalID); // Hentikan pengingat lama
  }

  // Simpan interval baru ke dalam repeatReminders
  repeatReminders[sender] = {
    intervalID: setInterval(() => {
      sock.sendMessage(remoteJid, {
        text: `🔔 *Reminder Berulang!*\n ${message}`,
      });
    }, timeMs),
    message: message, // Simpan pesan untuk referensi
  };

  sock.sendMessage(remoteJid, {
    text: `🔄 Reminder akan diulang setiap *${timeValue}${timeUnit}*: "${message}"\n\nKetik *!stopremind* untuk menghentikan.`,
  });
};

const stopRepeatReminder = (remoteJid, sender, textMessage, sock) => {
  if (!repeatReminders[sender]) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Tidak ada reminder aktif untuk dihentikan!",
    });
    return;
  }

  // Hentikan reminder
  clearInterval(repeatReminders[sender].intervalID);
  delete repeatReminders[sender]; // Hapus user jika tidak ada reminder tersisa

  sock.sendMessage(remoteJid, {
    text: `🛑 Semua reminder untuk ${sender} telah dihentikan!`,
  });
};


/* 👥 *GRUP & ADMIN*  
━━━━━━━━━━━━━━━━━━  
🔔 *Tag Semua* ➝ *!tagall [pesan opsional]*  
📢 *Pengumuman* ➝ *!announce [pesan]*  
🔓 *Buka/Tutup Grup* ➝ *!bukagrup* | *!tutupgrup*  
⏰ *Jadwal Grup* ➝ *!jadwalbuka [jam]* | *!jadwaltutup [jam]* | *!cekjadwal*  
➕ *Tambah Anggota* ➝ *!add [nomor]* | 🚪 *Keluarkan* ➝ *!remove [nomor]*  
👤 *Promote/Demote Admin* ➝ *!promote [@user]* | *!demote [@user]*
*/
// Tag Semua Orang
const mentionAll = async (from, sock, customMessage = "👥 Mention All!") => {
  try {
    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants.map((p) => p.id);

    // Buat daftar mention yang terlihat
    const mentionText = participants
      .map((id) => `@${id.split("@")[0]}`)
      .join(" ");

    await sock.sendMessage(from, {
      text: `*${customMessage}*\n\n${mentionText}`, // Menampilkan mention secara eksplisit
      mentions: participants, // Mention tetap aktif agar notifikasi dikirim
    });
  } catch {
    sock.sendMessage(from, {
      text: "⚠️ Perintah ini hanya bisa digunakan di grup!",
    });
  }
};

// PENGUMUMAN
async function announceToAll(remoteJid, sender, sock, message) {
  try {
    const groupMetadata = await sock.groupMetadata(remoteJid);
    const participants = groupMetadata.participants.map((member) => member.id);

    // Gunakan helper isAdminOrAllowedUser
    if (!(await isAdminOrAllowedUser(remoteJid, sender, sock))) {
      return sock.sendMessage(remoteJid, {
        text: "⚠️ Kamu bukan admin grup!",
      });
    }

    await sock.sendMessage(remoteJid, {
      text: `📢 *Sekilas Info!*\n\n${message}`,
      mentions: participants,
    });

  } catch (error) {
    console.error("Error sending announcement:", error);
    sock.sendMessage(remoteJid, { text: "⚠️ Gagal mengirim pengumuman." });
  }
}



// Mapping zona waktu berdasarkan kode (WIB, WITA, WIT)
const timeZones = {
  WIB: "Asia/Jakarta",
  WITA: "Asia/Makassar",
  WIT: "Asia/Jayapura",
};

// File untuk menyimpan jadwal
const SCHEDULE_FILE = "groupSchedules.json";

// Objek untuk menyimpan jadwal grup
let groupSchedules = {};

// Fungsi untuk menyimpan jadwal ke file JSON
function saveScheduleToFile() {
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(groupSchedules, null, 2));
}

// Fungsi untuk membaca jadwal dari file JSON saat bot dimulai
function loadScheduleFromFile() {
  if (fs.existsSync(SCHEDULE_FILE)) {
    const data = fs.readFileSync(SCHEDULE_FILE);
    groupSchedules = JSON.parse(data);
    console.log("✅ Jadwal grup berhasil dimuat dari file.");
  } else {
    console.log(
      "⚠️ Tidak ditemukan file jadwal, memulai dengan jadwal kosong."
    );
    groupSchedules = {};
  }
}

// Panggil fungsi untuk memuat jadwal saat bot pertama kali dijalankan
loadScheduleFromFile();

// Cek apakah bot adalah admin di grup
async function isBotAdmin(groupId, sock) {
  try {
    const groupMetadata = await sock.groupMetadata(groupId);
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

    return groupMetadata.participants.some(
      (p) =>
        p.id === botNumber && (p.admin === "admin" || p.admin === "superadmin")
    );
  } catch (error) {
    console.log("❌ Gagal mengambil metadata grup:", error);
    return false;
  }
}

// Cek apakah pengguna yang memberikan perintah adalah admin
// Fungsi mengecek apakah user adalah admin grup
async function isUserAdmin(remoteJid, sender, sock) {
  try {
    const groupMetadata = await sock.groupMetadata(remoteJid);
    return groupMetadata.participants.some(
      (p) =>
        p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
    );
  } catch (error) {
    console.log("❌ Gagal mengambil metadata grup:", error);
    return false;
  }
}


// Fungsi Buka/Tutup Grup dengan pengecekan admin
async function setGroupRestriction(groupId, sock, isClosed, sender) {
  try {
    const botIsAdmin = await isBotAdmin(groupId, sock);
    if (!botIsAdmin) {
      sock.sendMessage(groupId, {
        text: "⚠️ Bot harus menjadi admin untuk mengubah pengaturan grup!",
      });
      return;
    }

    const userIsAdmin = await isUserAdmin(groupId, sender, sock);
    if (!userIsAdmin) {
      sock.sendMessage(groupId, {
        text: "⚠️ Kamu harus menjadi admin untuk menjalankan perintah ini!",
      });
      return;
    }

    await sock.groupSettingUpdate(
      groupId,
      isClosed ? "announcement" : "not_announcement"
    );

    console.log(`✅ Grup ${groupId} ${isClosed ? "ditutup" : "dibuka"}`);
    sock.sendMessage(groupId, {
      text: `✅ Grup telah *${isClosed ? "ditutup" : "dibuka"}*`,
    });
  } catch (error) {
    console.error("❌ Gagal mengubah status grup:", error);
    sock.sendMessage(groupId, {
      text: "⚠️ Terjadi kesalahan saat mengubah status grup!",
    });
  }
}

// Fungsi untuk mengatur jadwal buka/tutup grup
async function setGroupSchedule(groupId, time, action, timeZone, sender, sock) {
  if (!sock) {
    console.error("❌ Error: sock tidak terdefinisi!");
    return;
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    sock.sendMessage(groupId, {
      text: "⚠️ Format waktu salah! Gunakan HH:MM (contoh: 07:00 WIB)",
    });
    return;
  }

  const validTimeZones = ["WIB", "WITA", "WIT"];
  if (!validTimeZones.includes(timeZone)) {
    sock.sendMessage(groupId, {
      text: "⚠️ Zona waktu tidak valid! Gunakan WIB, WITA, atau WIT.",
    });
    return;
  }

  // Cek apakah pengguna adalah admin
  const userIsAdmin = await isUserAdmin(groupId, sender, sock);
  if (!userIsAdmin) {
    sock.sendMessage(groupId, {
      text: "⚠️ Kamu harus menjadi admin untuk mengatur jadwal grup!",
    });
    return;
  }

  // Simpan jadwal terbaru
  if (!groupSchedules[groupId]) {
    groupSchedules[groupId] = {};
  }

  groupSchedules[groupId][action] = { time, timeZone, sender };

  // Simpan ke file agar tetap ada setelah restart
  saveScheduleToFile();

  sock.sendMessage(groupId, {
    text: `✅ Grup akan *${
      action === "open" ? "dibuka" : "ditutup"
    }* pada ${time} ${timeZone}`,
  });
}

// Fungsi untuk mengecek dan menjalankan jadwal otomatis
async function checkGroupSchedule(sock) {
  setInterval(async () => {
    const nowWIB = moment().tz("Asia/Jakarta").format("HH:mm");
    const nowWITA = moment().tz("Asia/Makassar").format("HH:mm");
    const nowWIT = moment().tz("Asia/Jayapura").format("HH:mm");

    // console.log(`⏰ Mengecek jadwal...`);
    // console.log(`🔹 WIB: ${nowWIB} | WITA: ${nowWITA} | WIT: ${nowWIT}`);

    for (const group in groupSchedules) {
      const schedule = groupSchedules[group];

      // Pastikan `schedule.open` tidak undefined sebelum mengakses propertinya
      if (
        schedule.open &&
        schedule.open.time &&
        schedule.open.timeZone &&
        ((schedule.open.timeZone === "WIB" && schedule.open.time === nowWIB) ||
          (schedule.open.timeZone === "WITA" &&
            schedule.open.time === nowWITA) ||
          (schedule.open.timeZone === "WIT" && schedule.open.time === nowWIT))
      ) {
        console.log(
          `🔓 Membuka grup ${group} pada ${schedule.open.time} ${schedule.open.timeZone}`
        );
        await setGroupRestriction(group, sock, false, schedule.open.sender);
        sock.sendMessage(group, { text: "🔓 Grup telah dibuka otomatis!" });
      }

      // Pastikan `schedule.close` tidak undefined sebelum mengakses propertinya
      if (
        schedule.close &&
        schedule.close.time &&
        schedule.close.timeZone &&
        ((schedule.close.timeZone === "WIB" &&
          schedule.close.time === nowWIB) ||
          (schedule.close.timeZone === "WITA" &&
            schedule.close.time === nowWITA) ||
          (schedule.close.timeZone === "WIT" && schedule.close.time === nowWIT))
      ) {
        console.log(
          `🔒 Menutup grup ${group} pada ${schedule.close.time} ${schedule.close.timeZone}`
        );
        await setGroupRestriction(group, sock, true, schedule.close.sender);
        sock.sendMessage(group, { text: "🔒 Grup telah ditutup otomatis!" });
      }
    }
  }, 60000); // Cek setiap 1 menit
}

// Fungsi untuk menambahkan anggota ke grup
async function addMultipleMembers(remoteJid, sender, sock, phoneNumbers) {
  // Cek apakah pengirim adalah admin atau termasuk allowedUsers
  if (!(await isAdminOrAllowedUser(remoteJid, sender, sock))) {
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Hanya admin yang bisa menambahkan anggota!",
    });
    return;
  }

  // Cek apakah bot adalah admin
  if (!(await isBotAdmin(remoteJid, sock))) {
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Bot harus menjadi admin untuk menambahkan anggota!",
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
  // Cek apakah pengirim adalah admin atau termasuk allowedUsers
  if (!(await isAdminOrAllowedUser(remoteJid, sender, sock))) {
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Hanya admin yang bisa mengeluarkan anggota!",
    });
    return;
  }

  // Cek apakah bot adalah admin
  if (!(await isBotAdmin(remoteJid, sock))) {
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Bot harus menjadi admin untuk mengeluarkan anggota!",
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
// Fungsi promote member
async function promoteMember(remoteJid, sender, sock, mentionedJid) {
  try {
    // Cek apakah sender admin atau termasuk allowedUsers
    if (!(await isAdminOrAllowedUser(remoteJid, sender, sock))) {
      return sock.sendMessage(remoteJid, {
        text: "⚠️ Kamu bukan admin grup!",
      });
    }

    // Cek apakah bot adalah admin
    const botIsAdmin = await isBotAdmin(remoteJid, sock);
    if (!botIsAdmin) {
      return sock.sendMessage(remoteJid, {
        text: "⚠️ Bot harus menjadi admin untuk mempromosikan anggota!",
      });
    }

    await sock.groupParticipantsUpdate(remoteJid, mentionedJid, "promote");
    sock.sendMessage(remoteJid, {
      text: `✅ Berhasil promote ${mentionedJid.join(", ")} menjadi admin.`,
    });
  } catch (error) {
    console.error("❌ Error promoting member:", error);
    sock.sendMessage(remoteJid, { text: "⚠️ Gagal promote member." });
  }
}


// Fungsi demote member
async function demoteMember(remoteJid, sender, sock, mentionedJid) {
  try {
    // Cek apakah sender admin atau termasuk allowedUsers
    if (!(await isAdminOrAllowedUser(remoteJid, sender, sock))) {
      return sock.sendMessage(remoteJid, {
        text: "⚠️ Kamu bukan admin grup!",
      });
    }

    // Cek apakah bot adalah admin
    const botIsAdmin = await isBotAdmin(remoteJid, sock);
    if (!botIsAdmin) {
      return sock.sendMessage(remoteJid, {
        text: "⚠️ Bot harus menjadi admin untuk mendemote anggota!",
      });
    }

    await sock.groupParticipantsUpdate(remoteJid, mentionedJid, "demote");
    sock.sendMessage(remoteJid, {
      text: `✅ Berhasil demote ${mentionedJid.join(", ")} menjadi anggota biasa.`,
    });
  } catch (error) {
    console.error("❌ Error demoting member:", error);
    sock.sendMessage(remoteJid, { text: "⚠️ Gagal demote member." });
  }
}

const allowedUsers = ["6285253435963@s.whatsapp.net"];
const BOT_JID = "6285956000668@s.whatsapp.net"; // isi dengan nomor bot kamu

async function kickNonAdmins(remoteJid, sender, sock) {
  try {
    const groupMetadata = await sock.groupMetadata(remoteJid);

    const participants = groupMetadata.participants;
    const groupAdmins = participants
      .filter((p) => p.admin)
      .map((p) => p.id);

    const isAdmin = groupAdmins.includes(sender);
    const isAllowed = allowedUsers.includes(sender);

    // Hanya admin atau allowed user yang boleh pakai
    if (!isAdmin && !isAllowed) {
      return sock.sendMessage(remoteJid, {
        text: "⚠️ Kamu tidak punya izin untuk menjalankan perintah ini.",
      });
    }

    // Pastikan bot adalah admin
    const botIsAdmin = await isBotAdmin(remoteJid, sock);
    if (!botIsAdmin) {
      return sock.sendMessage(remoteJid, {
        text: "⚠️ Bot harus jadi admin untuk mengeluarkan anggota.",
      });
    }

    // Ambil semua member yang bukan admin dan bukan bot
    const toKick = participants
      .filter((p) => !p.admin && p.id !== BOT_JID)
      .map((p) => p.id);

    if (toKick.length === 0) {
      return sock.sendMessage(remoteJid, {
        text: "✅ Tidak ada anggota biasa yang perlu dikeluarkan.",
      });
    }

    // Eksekusi kick
    await sock.groupParticipantsUpdate(remoteJid, toKick, "remove");

    await sock.sendMessage(remoteJid, {
      text: `❌ Berhasil mengeluarkan ${toKick.length} anggota non-admin.`,
    });
  } catch (error) {
    console.error("❌ Error saat mengeluarkan non-admin:", error);
    await sock.sendMessage(remoteJid, {
      text: "⚠️ Gagal mengeluarkan anggota.",
    });
  }
}

const path = "./roles.json";

// Baca data roles
function loadRoles() {
  if (!fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path));
}

// Simpan data roles
function saveRoles(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

async function setRole(remoteJid, sender, sock, targetJid, roleName) {
  const allowedUsers = ["6285253435963@s.whatsapp.net"];
  const isAdmin = await isUserAdmin(remoteJid, sender, sock);
  const isAllowed = allowedUsers.includes(sender);
  if (!isAdmin && !isAllowed) {
    return sock.sendMessage(remoteJid, { text: "⚠️ Kamu tidak punya izin!" });
  }

  const data = loadRoles();
  if (!data[remoteJid]) data[remoteJid] = {};
  if (!data[remoteJid][roleName]) data[remoteJid][roleName] = [];

  if (!data[remoteJid][roleName].includes(targetJid)) {
    data[remoteJid][roleName].push(targetJid);
    saveRoles(data);
    return sock.sendMessage(remoteJid, {
      text: `✅ ${targetJid.split("@")[0]} ditambahkan ke role *${roleName}*`,
    });
  } else {
    return sock.sendMessage(remoteJid, {
      text: `ℹ️ Sudah termasuk dalam role *${roleName}*`,
    });
  }
}

async function showRoles(remoteJid, sock) {
  const data = loadRoles();

  if (!data[remoteJid] || Object.keys(data[remoteJid]).length === 0) {
    return sock.sendMessage(remoteJid, {
      text: "📭 Belum ada role yang ditentukan di grup ini.",
    });
  }

  let replyText = "📌 *Daftar Role di Grup Ini:*\n\n";

  for (const [role, members] of Object.entries(data[remoteJid])) {
    const formatted = members.map((m) => "• @" + m.split("@")[0]).join("\n");
    replyText += `🔹 *${role}*:\n${formatted}\n\n`;
  }

  const allMentions = Object.values(data[remoteJid]).flat();

  await sock.sendMessage(remoteJid, {
    text: replyText.trim(),
    mentions: allMentions,
  });
}


async function mentionRole(remoteJid, sock, roleName) {
  const data = loadRoles();
  if (!data[remoteJid] || !data[remoteJid][roleName]) {
    return sock.sendMessage(remoteJid, {
      text: `❌ Role *${roleName}* tidak ditemukan.`,
    });
  }

  const members = data[remoteJid][roleName];
  await sock.sendMessage(remoteJid, {
    text: `🔔 Mention untuk *${roleName}*:\n\n${members.map((m) => "@" + m.split("@")[0]).join(" ")}`,
    mentions: members,
  });
}

async function deleteRoleMember(remoteJid, sender, sock, role, phoneNumber) {
  const roles = loadRoles();

  const allowedUsers = ["6285253435963@s.whatsapp.net"];
  const groupMetadata = await sock.groupMetadata(remoteJid);
  const groupAdmins = groupMetadata.participants
    .filter((member) => member.admin)
    .map((admin) => admin.id);

  const isAdmin = groupAdmins.includes(sender);
  const isAllowed = allowedUsers.includes(sender);

  if (!isAdmin && !isAllowed) {
    return sock.sendMessage(remoteJid, {
      text: "⚠️ Hanya admin atau pengguna yang diizinkan yang bisa menghapus role.",
    });
  }

  const jid = `${phoneNumber}@s.whatsapp.net`;

  if (
    !roles[remoteJid] ||
    !roles[remoteJid][role] ||
    !roles[remoteJid][role].includes(jid)
  ) {
    return sock.sendMessage(remoteJid, {
      text: `❌ Pengguna tersebut tidak terdaftar dalam role *${role}*.`,
    });
  }

  roles[remoteJid][role] = roles[remoteJid][role].filter((id) => id !== jid);

  if (roles[remoteJid][role].length === 0) {
    delete roles[remoteJid][role]; // Hapus role jika kosong
  }

  saveRoles(roles);

  return sock.sendMessage(remoteJid, {
    text: `✅ Berhasil menghapus @${phoneNumber} dari role *${role}*.`,
    mentions: [jid],
  });
}

module.exports = {
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
};
