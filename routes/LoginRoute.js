
const express = require('express');
const { loginUser, loginUserCallback } = require('../controllers/loginController');

const router = express.Router();

router.route("/").get(loginUser);
router.route("/callback").post(loginUserCallback);

module.exports = router;
