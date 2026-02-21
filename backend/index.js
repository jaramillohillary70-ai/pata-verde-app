const express = require('express');

const app = express();
const PORT = 4000;

app.get('/', (_req, res) => {
  res.send('Servidor Pata Verde funcionando');
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
