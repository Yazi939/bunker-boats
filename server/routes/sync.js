const express = require('express');
const router = express.Router();
const Data = require('../models/Data');
const auth = require('../middleware/auth');

// Получение данных для синхронизации
router.get('/:dataType', auth, async (req, res) => {
    try {
        const data = await Data.findOne({
            userId: req.user.id,
            dataType: req.params.dataType
        }).sort({ version: -1 });

        if (!data) {
            return res.status(404).json({ message: 'Data not found' });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Отправка данных для синхронизации
router.post('/:dataType', auth, async (req, res) => {
    try {
        const { data } = req.body;
        
        const existingData = await Data.findOne({
            userId: req.user.id,
            dataType: req.params.dataType
        }).sort({ version: -1 });

        const newVersion = existingData ? existingData.version + 1 : 1;

        const newData = new Data({
            userId: req.user.id,
            dataType: req.params.dataType,
            data,
            version: newVersion
        });

        await newData.save();
        res.json(newData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 