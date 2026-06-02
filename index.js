const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Conexión segura con Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Página web que ve el usuario
app.get('/', async (req, res) => {
    try {
        const { data: archivos } = await supabase.storage.from('test-bucket').list('', {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
        });

        let listaHTML = '';
        if (archivos && archivos.length > 0) {
            archivos.forEach(item => {
                const { data } = supabase.storage.from('test-bucket').getPublicUrl(item.name);
                listaHTML += `<li><a href="${data.publicUrl}" target="_blank">${item.name}</a></li>`;
            });
        } else {
            listaHTML = '<p style="color: gray;">No hay archivos en la nube aún.</p>';
        }

        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Prueba Exitosa</title>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
                form { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #eee; }
                button { background: #238636; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 16px; }
                a { color: #0969da; text-decoration: none; font-weight: bold; }
                ul { text-align: left; }
            </style>
        </head>
        <body>
            <h2>¡Tu API en Render funciona! 🎉</h2>
            <p>Selecciona un archivo para subirlo a Supabase:</p>
            <form action="/upload" method="POST" enctype="multipart/form-data">
                <input type="file" name="miArchivo" required> <br><br>
                <button type="submit">Subir Archivo</button>
            </form>
            <h3>Archivos en la Nube:</h3>
            <ul>${listaHTML}</ul>
        </body>
        </html>
        `);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

// Ruta para recibir el archivo y mandarlo a Supabase
app.post('/upload', upload.single('miArchivo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No hay archivo.');
        const nombreUnico = `${Date.now()}_${req.file.originalname}`;

        const { error } = await supabase.storage
            .from('test-bucket')
            .upload(nombreUnico, req.file.buffer, { contentType: req.file.mimetype });

        if (error) throw error;
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Error al subir: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Puerto ${PORT}`));
