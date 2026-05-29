require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Works whether this file is inside /js_files or in the project root.
const PROJECT_ROOT = fs.existsSync(path.join(__dirname, 'index.html'))
    ? __dirname
    : path.join(__dirname, '..');

const GALLERY_DIR = path.join(PROJECT_ROOT, 'assets', 'Imagenes galería');

// --- middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.static(PROJECT_ROOT));

// API: return list of media files in the gallery folder
app.get('/api/gallery', (req, res) => {
    fs.readdir(GALLERY_DIR, (err, files) => {
        if (err) {
            console.error('Error reading gallery folder:', err);
            return res.status(500).json({ error: 'No se pudo leer la galería.' });
        }

        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const videoExts = ['.mp4', '.webm', '.ogg'];

        const items = files
            .filter(name => !name.startsWith('.'))
            .map(name => {
                const ext = path.extname(name).toLowerCase();
                let type = 'image';

                if (videoExts.includes(ext)) type = 'video';
                else if (!imageExts.includes(ext)) return null;

                return { name, type };
            })
            .filter(Boolean);

        res.json({ items });
    });
});

// Simple API health check
app.get('/api/ping', (req, res) => {
    res.json({ ok: true, message: 'Construcciones GUCA API en línea.' });
});

// --- nodemailer transporter ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Test SMTP connection only when SMTP is configured.
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter.verify((error) => {
        if (error) {
            console.error('Error verificando SMTP:', error);
        } else {
            console.log('Servidor SMTP listo para enviar correos');
        }
    });
}

const isNonEmptyString = (value) =>
    typeof value === 'string' && value.trim().length > 0;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- endpoint de contacto ---
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, projectType, message } = req.body || {};

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

        if (!to || !from) {
            return res
                .status(500)
                .json({ ok: false, error: 'El correo del servidor no está configurado.' });
        }

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

// 404 page: must stay after static files and API routes.
app.use((req, res) => {
    res.status(404).sendFile(path.join(PROJECT_ROOT, '404.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor de Construcciones GUCA corriendo en http://localhost:${PORT}`);
});