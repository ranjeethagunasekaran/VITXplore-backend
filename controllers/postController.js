const axios = require("axios");
const User = require('../models/User');
const Post = require('../models/Post');

// ✅ Create Post (supports image & video)
exports.createPost = async (req, res) => {
  try {
    const { text, media, type } = req.body;
    const userId = req.user.id;

    // 🔒 Validation
    if (!text && !media) {
      return res.status(400).json({ message: "Post must have text or media" });
    }

    if (media && !["image", "video"].includes(type)) {
      return res.status(400).json({ message: "Invalid media type. Must be 'image' or 'video'" });
    }

    // 1️⃣ Create Post
    const post = new Post({
      user: userId,
      text: text || "",
      media: media || "",
      type: type || "image"
    });

    await post.save();

    // 2️⃣ 🧠 CALL FASTAPI AI
    try {
      const response = await axios.post("http://127.0.0.1:8000/predict", {
        text: text || "",
        image_base64: type === "image" ? media : null
      });

      const vector = response.data.domain_vector;
      const domain = response.data.dominant_domain;

      console.log("🧠 AI Domain:", domain);
      console.log("🧠 AI Vector:", vector);

      const user = await User.findById(userId);

      if (user) {
        // 3️⃣ Ensure vector exists
        if (!user.domainVector || user.domainVector.length !== vector.length) {
          user.domainVector = new Array(vector.length).fill(0);
        }

        // 4️⃣ Update vector
        for (let i = 0; i < vector.length; i++) {
          user.domainVector[i] += vector[i];
        }

        // 5️⃣ Normalize vector
        const sum = user.domainVector.reduce((a, b) => a + b, 0);
        if (sum > 0) {
          user.domainVector = user.domainVector.map(v => v / sum);
        }

        // 6️⃣ Set dominant domain (from AI directly ✅)
        user.dominantDomain = domain;

        await user.save();

        console.log("✅ Updated User Domain:", domain);
      }

    } catch (aiError) {
      console.log("❌ AI API Error:", aiError.message);
    }

    res.status(201).json({
      message: "Post created successfully",
      post
    });

  } catch (error) {
    console.error("❌ Create Post Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get All Posts (Feed)
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name email pic')
      .populate('comments.user', 'name pic')
      .sort({ createdAt: -1 });

    res.json(posts);

  } catch (error) {
    console.error("❌ Get Posts Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Like / Unlike Post
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.id;

    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json(post);

  } catch (error) {
    console.error("❌ Like Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Add Comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!text) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const comment = {
      user: req.user.id,
      text
    };

    post.comments.push(comment);
    await post.save();

    res.json(post);

  } catch (error) {
    console.error("❌ Comment Error:", error);
    res.status(500).json({ error: error.message });
  }
};