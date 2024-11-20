const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


const prisma = new PrismaClient();

exports.register = async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { email, password: hashedPassword },
        });
        res.status(201).redirect('/auth/login');
    } catch (error) {
        res.status(400).send('Error creating user');
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).send('User not found');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).send('Invalid password');

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).send('Error logging in');
    }
};


exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).send('User not found');

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

        // Save token in database
        await prisma.user.update({
            where: { email },
            data: {
                resetToken,
                resetTokenExpires,
            },
        });

        // Send reset link via email
        const resetUrl = `http://localhost:${process.env.PORT || 3000}/auth/reset-password/${resetToken}`;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset',
            text: `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
            html: `<p>You requested a password reset. Click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`,
        });

        res.status(200).send('Password reset link sent');
    } catch (error) {
        res.status(500).send('Error processing password reset');
    }
};


exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        const user = await prisma.user.findFirst({
            where: { resetToken: token, resetTokenExpires: { gte: new Date() } },
        });

        if (!user) return res.status(400).send('Invalid or expired token');

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { email: user.email },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null,
            },
        });

        res.status(200).send('Password reset successful');
    } catch (error) {
        res.status(500).send('Error resetting password');
    }
};
