import express from 'express';
import {
  getPosts,
  getCategories,
  getPostByIdOrSlug,
  createPost,
  updatePost,
  togglePostStatus,
  deletePost,
  seedDefaultPosts
} from '../controllers/postController.js';

const router = express.Router();

router.get('/', getPosts);
router.get('/categories', getCategories);
router.post('/seed', seedDefaultPosts);
router.get('/:idOrSlug', getPostByIdOrSlug);
router.post('/', createPost);
router.put('/:id', updatePost);
router.patch('/:id/toggle-status', togglePostStatus);
router.delete('/:id', deletePost);

export default router;

