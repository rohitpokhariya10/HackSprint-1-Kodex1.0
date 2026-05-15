const mongoose = require("mongoose");

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
const normalizeUrlArray = (value) => {
  if (!Array.isArray(value)) return value;

  return [
    ...new Set(
      value
        .filter(Boolean)
        .map((item) => String(item).trim())
        .filter(Boolean)
    ),
  ];
};

const createSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project owner is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      minlength: [3, "Project title must be at least 3 characters long"],
      maxlength: [100, "Project title cannot be more than 100 characters"],
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
      minlength: [10, "Project description must be at least 10 characters long"],
      maxlength: [1000, "Project description cannot be more than 1000 characters"],
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: [200, "Short description cannot be more than 200 characters"],
      default: "",
    },

    techStack: {
      type: [String],
      required: [true, "Tech stack is required"],
      set: normalizeStringArray,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one tech stack is required",
      },
    },

    githubLink: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: isValidUrlOrEmpty,
        message: "Please provide a valid GitHub URL",
      },
    },

    liveLink: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: isValidUrlOrEmpty,
        message: "Please provide a valid live project URL",
      },
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

    images: {
      type: [String],
      default: [],
      set: normalizeUrlArray,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.every((url) => isValidUrlOrEmpty(url));
        },
        message: "All image URLs must be valid",
      },
    },

    imageFileIds: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      trim: true,
      lowercase: true,
      default: "web app",
      maxlength: [50, "Category cannot be more than 50 characters"],
    },

    status: {
      type: String,
      enum: {
        values: ["draft", "published"],
        message: "Status must be either draft or published",
      },
      default: "published",
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

projectSchema.pre("validate", function () {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = createSlug(this.title);
  }
});

// Search ke liye text index
projectSchema.index({
  title: "text",
  description: "text",
  shortDescription: "text",
  techStack: "text",
  category: "text",
});

// Fast filtering/sorting indexes
projectSchema.index({ techStack: 1 });
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ views: -1, likesCount: -1 });
projectSchema.index({ status: 1, createdAt: -1 });

const projectModel = mongoose.model("Project", projectSchema);

module.exports = projectModel;
