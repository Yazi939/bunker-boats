const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dataType: {
        type: String,
        required: true,
        enum: ['fuel', 'expenses', 'orders', 'shifts', 'users']
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
    version: {
        type: Number,
        default: 1
    }
});

module.exports = mongoose.model('Data', DataSchema); 