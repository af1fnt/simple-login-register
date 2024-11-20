const express = require('express');
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

const router = express.Router();


router.get('/register', (req, res) => res.render('register'));
router.get('/login', (req, res) => res.render('login'));


router.post('/register', register);
router.post('/login', login);

// Forgot Password
router.post('/forgot-password', forgotPassword);

router.get('/reset-password/:token', (req, res) => {
    const { token } = req.params;
    res.render('reset-password', { token });
});


router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

router.post('/reset-password/:token', resetPassword);

module.exports = router;
