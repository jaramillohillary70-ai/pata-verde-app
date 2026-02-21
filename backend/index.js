const express = require('express');

const app = express();
const PORT = 4000;
const usuarios = [];

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Servidor Pata Verde funcionando');
});

app.post('/registro', (req, res) => {
  const { nombre, email, contraseña } = req.body;

  if (!nombre || !email || !contraseña) {
    return res.status(400).json({
      error: 'Los campos nombre, email y contraseña son obligatorios',
    });
  }

  const nuevoUsuario = {
    id: usuarios.length + 1,
    nombre,
    email,
    contraseña,
  };

  usuarios.push(nuevoUsuario);

  return res.status(201).json({
    mensaje: 'Usuario registrado correctamente',
    usuario: nuevoUsuario,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
