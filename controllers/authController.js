// backend/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const register = async (req, res) => {
  try {
    const hashedPsw = await bcrypt.hash(req.body.psw, 12);
    const user = await User.create({
      ...req.body,
      psw: hashedPsw,
      registration: new Date(),
      active: 1
    });

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const user = await User.findOne({ where: { user: req.body.user } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // 🔹 Confrontiamo la password in chiaro con quella hashata nel database
    const validPassword = await bcrypt.compare(req.body.psw.trim(), user.psw.trim());

    console.log(`"${user.psw}"`);
    console.log(`"${req.body.psw}"`);
    if (validPassword) return res.status(401).json({ error: 'Invalid Password' });

    // 🔹 Creazione del token JWT
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    console.log(token);
    res.json({ token });
  } catch (error) {
    console.error("Errore nel login:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login };
