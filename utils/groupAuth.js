// 📄 utils/groupAuth.js
const allowedUsers = require("../allowedUsers");

async function isAdminOrAllowedUser(remoteJid, sender, sock) {
  const metadata = await sock.groupMetadata(remoteJid);
  const adminIds = metadata.participants
    .filter((p) => p.admin)
    .map((p) => p.id);

  return adminIds.includes(sender) || allowedUsers.includes(sender);
}

module.exports = { isAdminOrAllowedUser };
