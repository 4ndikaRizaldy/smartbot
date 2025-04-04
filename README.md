Berikut adalah file **README.md** yang mencakup beberapa error yang kamu alami saat menjalankan proyek bot menggunakan Node.js dan Baileys:  

---

# SmartBot  

SmartBot adalah bot berbasis **Node.js** yang menggunakan **Baileys** untuk berinteraksi dengan WhatsApp Web.  

## Instalasi  

### 1. Clone Repository  

```sh
git clone https://github.com/username/smartbot.git
cd smartbot
```

### 2. Install Dependencies  

Pastikan semua dependency telah terinstall sebelum menjalankan bot. Jalankan perintah berikut:  

```sh
npm install
```

Jika masih ada error terkait module yang hilang, install manual:  

```sh
npm install dotenv moment moment-hijri @whiskeysockets/baileys
```

---

## Error dan Solusi  

### ❌ Error: Cannot find module 'dotenv'  

**Penyebab:** Module `dotenv` belum terinstall.  
**Solusi:**  

```sh
npm install dotenv
```

---

### ❌ Error: Cannot find module 'moment' atau 'moment-hijri'  

**Penyebab:** Module `moment` atau `moment-hijri` belum terinstall.  
**Solusi:**  

```sh
npm install moment moment-hijri
```

---

### ❌ Error: Cannot find module '@whiskeysockets/baileys'  

**Penyebab:** Module `@whiskeysockets/baileys` belum terinstall.  
**Solusi:**  

```sh
npm install @whiskeysockets/baileys
```

---

### ❌ Error: `rm -rf node_modules package-lock.json` tidak berfungsi di PowerShell  

**Penyebab:** Perintah `rm -rf` hanya berlaku di Linux/Mac.  
**Solusi (Windows - PowerShell):**  

```sh
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
```

Lalu install ulang dependencies:  

```sh
npm install
```

---

### ❌ Error: QR code terminal not added as dependency  

**Penyebab:** Baileys tidak dapat menampilkan QR Code di terminal.  
**Solusi:** Gunakan **whatsapp-web.js** untuk menampilkan QR Code atau pastikan semua dependency sudah terinstall.  

```sh
npm install qrcode-terminal
```

Lalu tambahkan di `index.js`:  

```js
const qrcode = require('qrcode-terminal');
```

---

## Menjalankan Bot  

Setelah semua dependency terinstall, jalankan bot dengan:  

```sh
node index.js
```


