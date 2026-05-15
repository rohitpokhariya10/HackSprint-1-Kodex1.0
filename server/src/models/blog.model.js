const mongoose = require("mongoose");
const slugify = require("../utils/slugify");

const isValidUrlOrEmpty = (value) => {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return value;

  return [
    ...new Set(
      value
        .filter(Boolean)
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
};

const calculateReadTime = (content) => {
  if (!content) return 1;

  const wordsPerMinute = 200;
  const totalWords = content.trim().split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(totalWords / wordsPerMinute));
};

const blogSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Blog author is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      minlength: [5, "Blog title must be at least 5 characters long"],
      maxlength: [150, "Blog title cannot be more than 150 characters"],
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    excerpt: {
      type: String,
      trim: true,
      maxlength: [250, "Excerpt cannot be more than 250 characters"],
      default: "",
    },

    content: {
      type: String,
      required: [true, "Blog content is required"],
      trim: true,
      minlength: [30, "Blog content must be at least 30 characters long"],
    },

    contentFormat: {
      type: String,
      enum: {
        values: ["markdown", "plainText"],
        message: "Content format must be either markdown or plainText",
      },
      default: "markdown",
    },

    coverImage: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: isValidUrlOrEmpty,
        message: "Please provide a valid cover image URL",
      },
    },

    coverImageFileId: {
      type: String,
      trim: true,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
      set: normalizeStringArray,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length <= 10;
        },
        message: "You can add maximum 10 tags",
      },
    },

    category: {
      type: String,
      required: [true, "Blog category is required"],
      trim: true,
      lowercase: true,
      maxlength: [50, "Category cannot be more than 50 characters"],
    },

    status: {
      type: String,
      enum: {
        values: ["draft", "published"],
        message: "Status must be either draft or published",
      },
      default: "published",
      index: true,
    },

    readTime: {
      type: Number,
      default: 1,
      min: [1, "Read time must be at least 1 minute"],
    },

    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
    },

    likesCount: {
      type: Number,
      default: 0,
      min: [0, "Likes count cannot be negative"],
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

blogSchema.pre("validate", function () {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title);
  }

  if (this.content && this.isModified("content")) {
    this.readTime = calculateReadTime(this.content);
  }

  if (!this.excerpt && this.content) {
    this.excerpt = this.content.replace(/\s+/g, " ").slice(0, 180).trim();
  }

  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  if (this.status === "draft") {
    this.publishedAt = null;
  }
});

// Search index
blogSchema.index({
  title: "text",
  excerpt: "text",
  content: "text",
  tags: "text",
  category: "text",
});

// Fast filtering/sorting indexes
blogSchema.index({ author: 1, createdAt: -1 });
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ views: -1, likesCount: -1 });
blogSchema.index({ isFeatured: 1, createdAt: -1 });
blogSchema.index({ slug: 1, status: 1 });

const blogModel = mongoose.model("Blog", blogSchema);

module.exports = blogModel;
