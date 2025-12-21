const Post = require('../models/Post');

// Create Post (supports image & video)

exports.createPost = async (req, res) => {
  try {
    const { text, media, type } = req.body;
    const userId = req.user.id;

    if (!text && !media) {
      return res.status(400).json({ message: "Post must have text or media" });
    }

    if (media && !["image", "video"].includes(type)) {
      return res.status(400).json({ message: "Invalid media type. Must be 'image' or 'video'" });
    }

    const post = new Post({ user: userId, text, media, type });
    await post.save();

    res.status(201).json({ message: "Post created", post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Posts (feed)
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name email profilePic')
      .populate('comments.user', 'name profilePic')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Like / Unlike Post
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user.id;

    if (post.likes.includes(userId)) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Comment on Post
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!text) return res.status(400).json({ message: 'Comment cannot be empty' });

    const comment = { user: req.user.id, text };
    post.comments.push(comment);

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
