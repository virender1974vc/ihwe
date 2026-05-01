import express from 'express';
import { createSpeaker, getAllSpeakers, getSpeakerById, updateSpeakerStatus, deleteSpeaker } from '../controllers/speakerController.js';

const router = express.Router();

router.post('/', createSpeaker);
router.get('/', getAllSpeakers);
router.get('/:id', getSpeakerById);
router.put('/:id/status', updateSpeakerStatus);
router.delete('/:id', deleteSpeaker);

export default router;