const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

// Post routes (all protected)
router.post('/', authMiddleware, postController.createPost);          // Create a post
router.get('/', authMiddleware, postController.getPosts);             // Get all posts (feed)
router.put('/:id/like', authMiddleware, postController.toggleLike);   // Like / Unlike a post
router.post('/:id/comment', authMiddleware, postController.addComment); // Add comment

module.exports = router;

