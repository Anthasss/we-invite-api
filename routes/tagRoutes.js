import express from 'express';
import { 
  createTags, 
  getAllTags, 
  getTagById, 
  updateTag, 
  deleteTag 
} from '../controllers/tagController.js';

const router = express.Router();

// POST /api/tags - Create new tags from comma-separated string
router.post('/', createTags);

// GET /api/tags - Get all tags
router.get('/', getAllTags);

// GET /api/tags/:id - Get a single tag by ID
router.get('/:id', getTagById);

// PUT /api/tags/:id - Update a tag
router.put('/:id', updateTag);

// DELETE /api/tags/:id - Delete a tag
router.delete('/:id', deleteTag);

export default router;
