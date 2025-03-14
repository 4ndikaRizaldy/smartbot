const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== 401;
            console.log("Koneksi terputus, mencoba lagi...", shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === "open") {
            console.log("✅ Bot siap!");
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;
        const remoteJid = msg.key.remoteJid;
        const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (textMessage === "!ping") {
            await sock.sendMessage(remoteJid, { text: "Pong! 🏓" });
        } else if (textMessage === "!tagall") {
            const groupMetadata = await sock.groupMetadata(remoteJid);
            const participants = groupMetadata.participants.map((p) => p.id);
            await sock.sendMessage(remoteJid, {
                text: "Mention All:\n" + participants.map((id) => `@${id.split("@")[0]}`).join("\n"),
                mentions: participants,
            });
        }
    });
}

startBot();
