const nodemailer = require('nodemailer')


console.log("ENV CHECK:", {
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS
})


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

exports.sendMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"NEXUS Security" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html
  })
}
