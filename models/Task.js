const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    priority: { type: String },
    due_date: { type: Date },
    status: { type: String, default: 'pending' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
