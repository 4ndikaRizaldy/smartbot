/* 🎮 *PERMAINAN & TEBAK-TEBAKAN* 
🎲 *Tebak Angka* ➝ *!tebakangka* | *!jangka [angka]*  
🧠 *Tebak Logika* ➝ *!tebaklogika* | *!jlogika [jawaban]* | *!kluelogika*  
🔠 *Acak Huruf* ➝ *!acakhuruf* | *!jhuruf [kata]*  
⚔️ *1vs1 Acak Huruf* ➝ *!tantang @username*  
🔥 *Survival Mode* ➝ *!survival*  
🏆 *Leaderboard* ➝ *!leaderboard*  
🎖 *Rank & Hadiah Virtual* ➝ *!rank*  */
/* AWAL 🎮 *PERMAINAN & TEBAK-TEBAKAN*  */
// TEBAK ANGKA
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

// TEBAK LOGIKA
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

// TEBAK KATA
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
      text: "⚠️ Tidak ada permainan aktif! Mulai dengan *!acakhuruf* atau *!tantang @user*.",
    });
    return;
  }

  let game = gameAcakHuruf[remoteJid];

  if (game.giliran && game.giliran !== sender) {
    sock.sendMessage(remoteJid, {
      text: `⚠️ Sekarang giliran @${
        game.giliran.split("@")[0]
      }! Tunggu giliranmu.`,
      mentions: [game.giliran],
    });
    return;
  }

  let parts = textMessage.split(" ");
  if (parts.length < 2) {
    sock.sendMessage(remoteJid, {
      text: "⚠️ Gunakan *!jhuruf [jawaban]* untuk menjawab!",
    });
    return;
  }

  let jawabanUser = parts[1].toLowerCase();

  if (jawabanUser === game.jawaban) {
    let poin = (poinUser[sender] || 0) + 10;
    poinUser[sender] = poin;
    let level = Math.floor(poin / 50) + 1;
    levelUser[sender] = level;

    sock.sendMessage(remoteJid, {
      text: `✅ *Benar!* 🎉\n+10 Poin untuk *@${
        sender.split("@")[0]
      }*!\nTotal Poin: *${poin}*\n📈 Level: *${level}*`,
      mentions: [sender],
    });

    // 🔥 Pilih soal baru dan ganti giliran ke pemain berikutnya
    let nextPlayer = sender === game.pemain ? game.lawan : game.pemain;
    let { kata, hurufAcak } = pilihKata();

    // Update permainan dengan soal baru
    gameAcakHuruf[remoteJid] = {
      kata,
      jawaban: kata,
      pemain: game.pemain,
      lawan: game.lawan,
      giliran: nextPlayer, // Giliran pindah ke pemain berikutnya
    };

    // 🔥 Kirim soal baru ke pemain selanjutnya dengan mention
    sock.sendMessage(remoteJid, {
      text: `🎭 *Giliran pemain selanjutnya!*  
Susun kata dari huruf berikut: *${hurufAcak}*  
⏳ Jawab dengan *!jhuruf [kata]*`,
      mentions: [nextPlayer],
    });
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
    giliran: sender, // Pemain pertama yang memulai
    pemenang: null,
  };

  sock.sendMessage(remoteJid, {
    text: `🔥 *Duel 1v1 Dimulai!*  
👤 *${sender.split("@")[0]}* vs *${opponentId.split("@")[0]}*  
🎭 Susun kata dari huruf: *${hurufAcak}*  
⏳ Giliran: *${sender.split("@")[0]}*  
Jawab dengan *!jhuruf [kata]*`,
  });

  setTimeout(() => {
    if (gameAcakHuruf[remoteJid] && !gameAcakHuruf[remoteJid].pemenang) {
      sock.sendMessage(remoteJid, {
        text: `⏳ Waktu habis! Tidak ada pemenang! Jawaban: *${gameAcakHuruf[remoteJid].jawaban}*`,
      });
      delete gameAcakHuruf[remoteJid];
    }
  }, 60000);
}

function startSurvival(remoteJid, sender, sock) {
  let { kata, hurufAcak } = pilihKata();
  gameAcakHuruf[remoteJid] = {
    kata,
    jawaban: kata,
    pemain: sender,
    mode: "survival",
    pemenang: null,
  };

  sock.sendMessage(remoteJid, {
    text: `🔥 *Survival Mode!*  \n🎭 Susun kata dari huruf berikut: *${hurufAcak}*  \n⏳ Jawab dengan *!jhuruf [kata]* dalam 20 detik!`,
  });

  setTimeout(() => {
    if (
      gameAcakHuruf[remoteJid] &&
      gameAcakHuruf[remoteJid].mode === "survival" &&
      !gameAcakHuruf[remoteJid].pemenang
    ) {
      sock.sendMessage(remoteJid, {
        text: `⏳ Waktu habis! Permainan selesai! Jawaban: *${gameAcakHuruf[remoteJid].jawaban}*`,
      });
      delete gameAcakHuruf[remoteJid];
    }
  }, 20000);
}

/* AKHIR 🎮 *PERMAINAN & TEBAK-TEBAKAN*  */
module.exports = {
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
};
