
const express = require('express');
const path = require('path');
const fs = require('fs');              // <-- add this
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the project root
app.use(express.static(path.join(__dirname, '..')));
// Folder where gallery images/videos live
const GALLERY_DIR = path.join(__dirname, '..', 'assets', 'Imagenes galería');

// API: return list of media files in the gallery folder
app.get('/api/gallery', (req, res) => {
    fs.readdir(GALLERY_DIR, (err, files) => {
        if (err) {
            console.error('Error reading gallery folder:', err);
            return res.status(500).json({ error: 'No se pudo leer la galería.' });
        }

        // Allowed extensions
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const videoExts = ['.mp4', '.webm', '.ogg'];

        const items = files
            .filter(name => !name.startsWith('.')) // ignore hidden files
            .map(name => {
                const ext = path.extname(name).toLowerCase();
                let type = 'image';
                if (videoExts.includes(ext)) type = 'video';
                else if (!imageExts.includes(ext)) return null; // skip unsupported

                return { name, type };
            })
            .filter(Boolean);

        res.json({ items });
    });
});

// Simple API example (you can adapt this later)
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'Construcciones GUCA API en línea.' });
});

app.listen(PORT, () => {
  console.log(`Servidor de Construcciones GUCA corriendo en http://localhost:${PORT}`);
});
require('dotenv').config();

const cors = require('cors');
const nodemailer = require('nodemailer');


// --- middlewares ---
app.use(cors());                  // ajústalo si backend y frontend están en dominios distintos
app.use(express.json());          // parsea JSON en req.body

// (Opcional) servir frontend estático si lo tienes en /public:
// app.use(express.static('public'));

// --- nodemailer transporter ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Test de conexión SMTP al arrancar
transporter.verify(function (error, success) {
    if (error) {
        console.error('Error verificando SMTP:', error);
    } else {
        console.log('Servidor SMTP listo para enviar correos');
    }
});

// --- ayuda simple de validación ---
const isNonEmptyString = (v) =>
    typeof v === 'string' && v.trim().length > 0;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- endpoint de contacto ---
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, projectType, message } = req.body || {};

        // Validación básica
        if (
            !isNonEmptyString(name) ||
            !isNonEmptyString(email) ||
            !isNonEmptyString(message)
        ) {
            return res
                .status(400)
                .json({ ok: false, error: 'Campos obligatorios faltantes.' });
        }

        if (!EMAIL_REGEX.test(email)) {
            return res
                .status(400)
                .json({ ok: false, error: 'Correo electrónico inválido.' });
        }

        const safeName = String(name).trim();
        const safeEmail = String(email).trim();
        const safePhone = String(phone || '').trim();
        const safeProjectType = String(projectType || 'No especificado').trim();
        const safeMessage = String(message).trim();

        const to = process.env.CONTACT_TO || process.env.SMTP_USER;
        const from = process.env.CONTACT_FROM || process.env.SMTP_USER;

        const subject = `Nuevo mensaje de contacto: ${safeName}`;

        const textBody = `
Nuevo mensaje desde el formulario de contacto:

Nombre: ${safeName}
Correo: ${safeEmail}
Teléfono: ${safePhone || 'No proporcionado'}
Tipo de proyecto: ${safeProjectType}

Mensaje:
${safeMessage}
        `.trim();

        const htmlBody = `
            <h2>Nuevo mensaje desde el sitio web</h2>
            <p><strong>Nombre:</strong> ${safeName}</p>
            <p><strong>Correo:</strong> ${safeEmail}</p>
            <p><strong>Teléfono:</strong> ${safePhone || 'No proporcionado'}</p>
            <p><strong>Tipo de proyecto:</strong> ${safeProjectType}</p>
            <p><strong>Mensaje:</strong></p>
            <p style="white-space:pre-line;">${safeMessage}</p>
        `;

        await transporter.sendMail({
            from,
            to,
            subject,
            text: textBody,
            html: htmlBody,
        });

        return res.json({ ok: true });
    } catch (err) {
        console.error('Error en /api/contact:', err);
        return res
            .status(500)
            .json({ ok: false, error: 'Error interno al enviar el mensaje.' });
    }
});

