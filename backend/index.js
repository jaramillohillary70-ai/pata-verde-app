const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const DATA_FILE = path.join(__dirname, 'data.json');
const ESTADOS_VALIDOS = ['pendiente', 'en_proceso', 'completada', 'cancelada'];

app.use(express.json());

const defaultData = {
  usuarios: [],
  solicitudesRecoleccion: [],
  cupones: [],
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function sanitizeData(data) {
  return {
    usuarios: Array.isArray(data?.usuarios) ? data.usuarios : [],
    solicitudesRecoleccion: Array.isArray(data?.solicitudesRecoleccion)
      ? data.solicitudesRecoleccion
      : [],
    cupones: Array.isArray(data?.cupones) ? data.cupones : [],
  };
}

function readData() {
  ensureDataFile();

  try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');

    if (!rawData.trim()) {
      return { ...defaultData };
    }

    const parsedData = JSON.parse(rawData);
    return sanitizeData(parsedData);
  } catch (error) {
    throw new Error(`No se pudo leer data.json: ${error.message}`);
  }
}

function writeData(data) {
  const sanitizedData = sanitizeData(data);

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(sanitizedData, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`No se pudo escribir data.json: ${error.message}`);
  }
}

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

  const normalizedEmail = String(email).trim().toLowerCase();

  if (!normalizedEmail.includes('@')) {
    return res.status(400).json({
      error: 'El email no es válido',
    });
  }

  try {
    const data = readData();

    const existingUser = data.usuarios.find(
      (item) => item.email.toLowerCase() === normalizedEmail,
    );

    if (existingUser) {
      return res.status(409).json({
        error: 'Ya existe un usuario registrado con ese email',
      });
    }

    const nuevoUsuario = {
      id: data.usuarios.length + 1,
      nombre: String(nombre).trim(),
      email: normalizedEmail,
      contraseña: String(contraseña),
      puntos: 0,
    };

    data.usuarios.push(nuevoUsuario);
    writeData(data);

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario: nuevoUsuario,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

app.post('/login', (req, res) => {
  const { email, contraseña } = req.body;

  if (!email || !contraseña) {
    return res.status(400).json({
      error: 'Los campos email y contraseña son obligatorios',
    });
  }

  try {
    const data = readData();
    const normalizedEmail = String(email).trim().toLowerCase();
    const usuario = data.usuarios.find((item) => item.email === normalizedEmail);

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }

    if (usuario.contraseña !== String(contraseña)) {
      return res.status(401).json({
        error: 'Contraseña incorrecta',
      });
    }

    return res.status(200).json({
      mensaje: 'Login exitoso',
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

app.post('/recoleccion', (req, res) => {
  const { userId, direccion } = req.body;

  if (!userId || !direccion) {
    return res.status(400).json({
      error: 'Los campos userId y direccion son obligatorios',
    });
  }

  const parsedUserId = Number(userId);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    return res.status(400).json({
      error: 'El userId debe ser un número entero positivo',
    });
  }

  try {
    const data = readData();
    const usuario = data.usuarios.find((item) => item.id === parsedUserId);

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }

    const nuevaSolicitud = {
      id: data.solicitudesRecoleccion.length + 1,
      userId: parsedUserId,
      direccion: String(direccion).trim(),
      estado: 'pendiente',
    };

    data.solicitudesRecoleccion.push(nuevaSolicitud);
    writeData(data);

    return res.status(201).json(nuevaSolicitud);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

app.put('/recoleccion/:id', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({
      error: 'El campo estado es obligatorio',
    });
  }

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({
      error: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`,
    });
  }

  try {
    const data = readData();
    const solicitud = data.solicitudesRecoleccion.find(
      (item) => item.id === Number(id),
    );

    if (!solicitud) {
      return res.status(404).json({
        error: 'Solicitud de recolección no encontrada',
      });
    }

    const estadoAnterior = solicitud.estado;
    solicitud.estado = estado;

    if (estadoAnterior !== 'completada' && estado === 'completada') {
      const usuario = data.usuarios.find((item) => item.id === solicitud.userId);

      if (usuario) {
        usuario.puntos += 10;
      }
    }

    writeData(data);

    return res.status(200).json(solicitud);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

app.post('/canjear-cupon', (req, res) => {
  const { userId, tipo } = req.body;

  if (!userId || !tipo) {
    return res.status(400).json({
      error: 'Los campos userId y tipo son obligatorios',
    });
  }

  const parsedUserId = Number(userId);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    return res.status(400).json({
      error: 'El userId debe ser un número entero positivo',
    });
  }

  try {
    const data = readData();
    const usuario = data.usuarios.find((item) => item.id === parsedUserId);

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }

    if (usuario.puntos < 20) {
      return res.status(400).json({
        error: 'No tienes puntos suficientes para canjear un cupón',
      });
    }

    usuario.puntos -= 20;

    const nuevoCupon = {
      id: data.cupones.length + 1,
      userId: usuario.id,
      tipo: String(tipo).trim(),
      puntosCanjeados: 20,
    };

    data.cupones.push(nuevoCupon);
    writeData(data);

    return res.status(201).json(nuevoCupon);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

ensureDataFile();

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
