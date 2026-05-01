const express = require('express');
const { createSpeaker, getAllSpeakers, getSpeakerById, updateSpeakerStatus, deleteSpeaker } = require('../controllers/speakerController.js');

const router = express.Router();

router.post('/', createSpeaker);
router.get('/', getAllSpeakers);
router.get('/:id', getSpeakerById);
router.put('/:id/status', updateSpeakerStatus);
router.delete('/:id', deleteSpeaker);

module.exports = router;