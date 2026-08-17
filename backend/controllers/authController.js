const bcrypt = require("bcryptjs");
const db = require("../config/db");
const generateToken = require("../utils/generateToken");
const transporter =
  require("../config/mailConfig");

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role_id } = req.body;

    if (!name || !email || !password || !role_id) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql =
      "INSERT INTO users (name,email,password,role_id) VALUES (?,?,?,?)";

    db.query(
      sql,
      [name, email, hashedPassword, role_id],
      (err, result) => {
        if (err) {
          return res.status(500).json(err);
        }

        res.status(201).json({
          success: true,
          message: "User registered successfully",
        });
      }
    );
  } catch (error) {
    res.status(500).json(error);
  }
};

const loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email/Employee ID and Password are required"
    });
  }

  const identifier = email.trim();
  const isEmployeeId = /^EM\d{4}SS$/i.test(identifier);

  let sql = "";
  let queryParam = "";

  if (isEmployeeId) {
    sql = `
      SELECT users.*, roles.role_name, employees.status AS emp_status
      FROM users
      JOIN roles ON users.role_id = roles.id
      LEFT JOIN employees ON users.login_id = employees.employee_id OR users.email = employees.email
      WHERE users.login_id = ?
    `;
    queryParam = identifier.toUpperCase();
  } else {
    sql = `
      SELECT users.*, roles.role_name, employees.status AS emp_status
      FROM users
      JOIN roles ON users.role_id = roles.id
      LEFT JOIN employees ON users.login_id = employees.employee_id OR users.email = employees.email
      WHERE users.email = ?
    `;
    queryParam = identifier.toLowerCase();
  }

  db.query(sql, [queryParam], async (err, result) => {

    if (err) {
      return res.status(500).json({
        success: false,
        message: "Server Error"
      });
    }

    if (result.length === 0) {
      return res.status(401).json({
        success: false,
        message: isEmployeeId ? "Invalid Employee ID or password" : "Invalid email or password"
      });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: isEmployeeId ? "Invalid Employee ID or password" : "Invalid email or password"
      });
    }

    if (user.emp_status && user.emp_status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact administration."
      });
    }

    const token = generateToken(
      user.id,
      user.role_name,
      user.login_id,
      user.email,
      user.name
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name,
        must_change_password: user.must_change_password,
        login_id: user.login_id,
        employee_id: user.login_id
      }
    });

  });
};

const getProfile = (req, res) => {

  res.status(200).json({
    success: true,
    user: req.user
  });

};

const changePassword = async (req, res) => {

  try {

    const { currentPassword, newPassword } =
      req.body;

    const userId = req.user.id;

    const [users] = await db.promise().query(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    const user = users[0];

    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User Not Found"
      });

    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {

      return res.status(400).json({
        success: false,
        message: "Current Password Incorrect"
      });

    }

    const hashedPassword =
      await bcrypt.hash(newPassword, 10);

    await db.promise().query(
      "UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?",
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: "Password Changed Successfully"
    });

  }
  catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }

};

const forgotPassword = async (req, res) => {

  const { email } = req.body;

  try {

    const [users] =
      await db.promise().query(
        "SELECT * FROM users WHERE email=?",
        [email]
      );

    if (users.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Email Not Found"
      });

    }

    const otp =
      Math.floor(
        100000 + Math.random() * 900000
      ).toString();

    await transporter.sendMail({

      from: process.env.EMAIL_USER,

      to: email,

      subject: "Staffspire Password Reset OTP",

      html: `
        <h2>Password Reset Request</h2>

        <p>Your OTP is:</p>

        <h1>${otp}</h1>

        <p>
            Valid for 10 minutes.
        </p>
    `

    });

    await db.promise().query(

      `
            UPDATE users
            SET
                reset_otp=?,
                otp_expiry=
                DATE_ADD(
                    NOW(),
                    INTERVAL 10 MINUTE
                )
            WHERE email=?
            `,

      [
        otp,
        email
      ]

    );

    res.status(200).json({

      success: true,
      message: "OTP Sent To Email"

    });

  }
  catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }

};

const resetPassword = async (req, res) => {

  const {
    email,
    newPassword
  } = req.body;

  try {

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    await db.promise().query(

      `
      UPDATE users
      SET
          password=?,
          reset_otp=NULL,
          otp_expiry=NULL
      WHERE email=?
      `,

      [
        hashedPassword,
        email
      ]

    );

    res.json({
      success: true,
      message: "Password Reset Successfully"
    });

  }
  catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }

};

const verifyOTP = async (req, res) => {

  const {
    email,
    otp
  } = req.body;

  try {

    const [users] =
      await db.promise().query(

        `
            SELECT *
            FROM users
            WHERE email=?
            `,

        [email]

      );

    if (users.length === 0) {

      return res.status(404).json({
        success: false,
        message: "User Not Found"
      });

    }

    const user = users[0];

    if (String(user.reset_otp).trim() !== String(otp).trim()) {

      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });

    }

    if (
      new Date() >
      new Date(user.otp_expiry)
    ) {

      return res.status(400).json({
        success: false,
        message: "OTP Expired"
      });

    }

    res.status(200).json({

      success: true,
      message: "OTP Verified"

    });

  }
  catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }

};

const checkAdminExists = async (req, res) => {
  try {
    const [admins] = await db.promise().query(
      "SELECT * FROM users WHERE role_id = 1"
    );
    res.status(200).json({
      success: true,
      exists: admins.length > 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, authEmail, authPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if any admin already exists in the system
    const [admins] = await db.promise().query(
      "SELECT * FROM users WHERE role_id = 1"
    );

    if (admins.length > 0) {
      // If admin already exists, require authorizing credentials
      if (!authEmail || !authPassword) {
        return res.status(401).json({
          success: false,
          message: "An existing admin's credentials are required to authorize this registration."
        });
      }

      const cleanAuthEmail = authEmail.trim().toLowerCase();

      // Find the authorizing user by email
      const [authUsers] = await db.promise().query(
        "SELECT * FROM users WHERE email = ? AND role_id = 1",
        [cleanAuthEmail]
      );

      if (authUsers.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid authorizing admin credentials."
        });
      }

      const authUser = authUsers[0];

      // Compare passwords
      const isMatch = await bcrypt.compare(authPassword, authUser.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid authorizing admin password."
        });
      }
    }

    // Check if the email is already registered
    const [existing] = await db.promise().query(
      "SELECT * FROM users WHERE email = ?",
      [cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user with role_id = 1 (Admin)
    await db.promise().query(
      "INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, 1)",
      [name, cleanEmail, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Admin registered successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

const { sendEmail } = require("../utils/emailHelper");

const contactUs = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: "All fields are required."
    });
  }

  try {
    const emailBody = `
      <h3>New Contact Message Received</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `;

    await sendEmail({
      to: "shreyash.softspiresolutions@gmail.com",
      subject: `Staffspire Contact Form: ${subject}`,
      html: emailBody,
      text: `New message from ${name} (${email}): ${message}`
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully"
    });
  } catch (error) {
    console.error("Contact message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message"
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyOTP,
  registerAdmin,
  checkAdminExists,
  contactUs
};