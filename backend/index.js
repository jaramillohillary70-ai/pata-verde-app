const express = require('express');

const app = express();
const PORT = 4000;
const usuarios = [];
const solicitudesRecoleccion = [];

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

app.post('/login', (req, res) => {
  const { email, contraseña } = req.body;

  if (!email || !contraseña) {
    return res.status(400).json({
      error: 'Los campos email y contraseña son obligatorios',
    });
  }

  const usuario = usuarios.find((item) => item.email === email);

  if (!usuario) {
    return res.status(404).json({
      error: 'Usuario no encontrado',
    });
  }

  if (usuario.contraseña !== contraseña) {
    return res.status(401).json({
      error: 'Contraseña incorrecta',
    });
  }

  return res.status(200).json({
    mensaje: 'Login exitoso',
  });
});

app.post('/recoleccion', (req, res) => {
  const { userId, direccion } = req.body;

  if (!userId || !direccion) {
    return res.status(400).json({
      error: 'Los campos userId y direccion son obligatorios',
    });
  }

  const nuevaSolicitud = {
    id: solicitudesRecoleccion.length + 1,
    userId,
    direccion,
    estado: 'pendiente',
  };

  solicitudesRecoleccion.push(nuevaSolicitud);

  return res.status(201).json(nuevaSolicitud);
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
