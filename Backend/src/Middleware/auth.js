const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).send("Token não fornecido");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).send("Token inválido");

    req.usuario = decoded;
    next();
  });
}

module.exports = { verificarToken };