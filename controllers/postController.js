const User = require('../models/User');
const { analyzeContent, convertAIResponseToVector } = require('../utils/aiService');
const { DOMAINS } = require('../utils/domainConfig');
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

    // 1️⃣ Create Post
    const post = new Post({ user: userId, text, media, type });
    await post.save();

    // 2️⃣ Run AI Analysis (Non-blocking safe logic)
    try {
      const aiResponse = await analyzeContent(text || "", media || "");
      const newVector = convertAIResponseToVector(aiResponse);

      const user = await User.findById(userId);

      if (user) {
        // 3️⃣ Update domainVector
        for (let i = 0; i < user.domainVector.length; i++) {
          user.domainVector[i] += newVector[i];
        }

        // 4️⃣ Normalize Vector (Professional Approach)
        const sum = user.domainVector.reduce((a, b) => a + b, 0);
        if (sum > 0) {
          user.domainVector = user.domainVector.map(v => v / sum);
        }

        // 5️⃣ Recalculate dominantDomain
        const maxIndex = user.domainVector.indexOf(
          Math.max(...user.domainVector)
        );

        user.dominantDomain = DOMAINS[maxIndex];

        await user.save();
      }

    } catch (aiError) {
      console.log("AI analysis failed:", aiError.message);
      // Post is still created even if AI fails
    }

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
