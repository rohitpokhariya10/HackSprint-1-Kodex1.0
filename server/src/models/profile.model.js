const mongoose = require("mongoose");

// Small helper: empty string allowed, but if value exists then it should be valid URL
const isValidUrlOrEmpty = (value) => {
  if (!value) return true;

  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
};

const socialLinksSchema = new mongoose.Schema(
  {
    github: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: isValidUrlOrEmpty,
        message: "GitHub link must be a valid URL",
      },
    },

    linkedin: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: isValidUrlOrEmpty,
        message: "LinkedIn link must be a valid URL",
      },
    },

    twitter: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: isValidUrlOrEmpty,
        message: "Twitter link must be a valid URL",
      },
    },

    portfolio: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: isValidUrlOrEmpty,
        message: "Portfolio link must be a valid URL",
      },
    },
  },
  {
    _id: false,
  }
);

const portfolioShowcaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Portfolio title is required"],
      trim: true,
      maxlength: [80, "Portfolio title cannot exceed 80 characters"],
    },

    link: {
      type: String,
      required: [true, "Portfolio link is required"],
      trim: true,
      validate: {
        validator: isValidUrlOrEmpty,
        message: "Portfolio showcase link must be a valid URL",
      },
    },
  },
  {
    _id: false,
  }
);
//
const profileSchema = new mongoose.Schema(
  {
    // One profile belongs to one user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      unique: true,
      index: true,
    },

    headline: {
      type: String,
      trim: true,
      maxlength: [120, "Headline cannot exceed 120 characters"],
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },

    avatar: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: isValidUrlOrEmpty,
        message: "Avatar must be a valid URL",
      },
    },

    avatarFileId: {
      type: String,
      trim: true,
      default: "",
    },

    banner: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: isValidUrlOrEmpty,
        message: "Banner must be a valid URL",
      },
    },

    bannerFileId: {
      type: String,
      trim: true,
      default: "",
    },

    skills: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
        },
      ],
      default: [],
      validate: {
        validator: function (skills) {
          return skills.length <= 20;
        },
        message: "You can add maximum 20 skills",
      },
    },

    githubUsername: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
      default: "",
    },

    socialLinks: {
      type: socialLinksSchema,
      default: () => ({}),
    },

    portfolioShowcase: {
      type: [portfolioShowcaseSchema],
      default: [],
      validate: {
        validator: function (items) {
          return items.length <= 5;
        },
        message: "You can add maximum 5 portfolio showcase links",
      },
    },

    isOpenToWork: {
      type: Boolean,
      default: false,
    },

    profileVisibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Useful for search feature later
profileSchema.index({
  headline: "text",
  bio: "text",
  skills: "text",
  githubUsername: "text",
  location: "text",
});

const profileModel = mongoose.model("Profile", profileSchema);

module.exports = profileModel;
