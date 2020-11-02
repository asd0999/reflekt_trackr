const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    name: { type: String, required: true },
    user: { type: String },
    category: { type: String }
});

const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit;