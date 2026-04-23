// import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//     },
// });

// export const sendVerificationEmail = async (toEmail, verificationToken) => {
//     const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(toEmail)}`;

//     const mailOptions = {
//         from: process.env.SMTP_FROM,
//         to: toEmail,
//         subject: 'Verify your GIU Facility account',
//         html: `
//       <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 12px;">
//         <h2 style="color: #004e92;">Welcome to GIU Facility Management</h2>
//         <p style="color: #444; font-size: 15px;">
//           Thanks for signing up. Click the button below to verify your email address.
//           This link expires in <strong>24 hours</strong>.
//         </p>
//         <a href="${verifyUrl}"
//           style="display: inline-block; margin-top: 20px; padding: 14px 28px;
//                  background-color: #004e92; color: #fff; border-radius: 8px;
//                  text-decoration: none; font-size: 15px; font-weight: bold;">
//           Verify Email
//         </a>
//         <p style="margin-top: 24px; color: #999; font-size: 12px;">
//           If you didn't create an account, you can safely ignore this email.
//         </p>
//       </div>
//     `,
//     };

//     await transporter.sendMail(mailOptions);
// };