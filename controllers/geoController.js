// controllers/geoController.js
const { Anagrafica } = require('../models');
const { calculateDistance } = require('../utils/geoUtils');

exports.findNearbyOfficine = async (req, res) => {
  try {
    const { lat, lon, radius } = req.query;
    const allOfficine = await Anagrafica.findAll();

    const nearby = allOfficine.filter(officina => {
      const distance = calculateDistance(
        lat,
        lon,
        officina['Latitudine Sede'],
        officina['Longitudine Sede']
      );
      return distance <= radius;
    });

    res.json(nearby);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};