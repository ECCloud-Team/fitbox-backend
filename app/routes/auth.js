const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const config = require("../config/config");
const auth = require("../middleware/auth");
const log = require("../middleware/logger");

const router = express.Router();

// Register user
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }

      user = new User({
        name,
        email,
        password,
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(payload, config.jwtSecret, { expiresIn: "5h" }, (err, token) => {
        if (err) throw err;
        log(`User registered: ${user.email}`, "POST", user.id); // Tambahkan ini
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      log(`User registration error: ${err.message}`, "POST"); // Tambahkan ini
      res.status(500).send("Server error");
    }
  }
);

// Login user
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        log(`Invalid login attempt: ${email}`, "POST"); // Tambahkan ini
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        log(`Invalid login attempt: ${email}`, "POST"); // Tambahkan ini
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(payload, config.jwtSecret, { expiresIn: "5h" }, (err, token) => {
        if (err) throw err;
        log(`User logged in: ${user.email}`, "POST", user.id); // Tambahkan ini
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      log(`User login error: ${err.message}`, "POST"); // Tambahkan ini
      res.status(500).send("Server error");
    }
  }
);

// get user id, name, and email from token
router.get("/user", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    log(`User data retrieved: ${user.email}`, "GET", req.user.id); // Tambahkan ini
    res.json(user);
  } catch (err) {
    console.error(err.message);
    log(`Get user data error: ${err.message}`, "GET", req.user.id); // Tambahkan ini
    res.status(500).send("Server Error");
  }
});

// @route   put /user/plan
// @desc    Update user plan
// @access  Private
router.put("/plan", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.userPlan = req.body.userPlan;
    await user.save();
    // log(`User plan updated: ${user.email}`, "PUT", req.user.id); // Tambahkan ini
    res.json(user);
  } catch (err) {
    console.error(err.message);
    // log(`Update user plan error: ${err.message}`, "PUT", req.user.id); // Tambahkan ini
    res.status(500).send("Server Error");
  }
});

module.exports = router;
