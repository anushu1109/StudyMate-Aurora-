import express from "express";
import cors from "cors";
import passport from "passport";
import multer from "multer";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { v4 as uuidv4 } from "uuid";
import { verifySessionKey, saveUser,getSessionKeyByUserId,saveSession} from "./databse.js"; // our DB functions
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import axios from "axios";

// Needed for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
const app = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(passport.initialize());

/* ---------------- Google OAuth ---------------- */

passport.use(new GoogleStrategy({
    clientID: "210380299044-6vm4570bl29lg5m48fj9a41fj2v8h5jj.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:5000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
  console.log("User authenticated by Google:", profile.displayName);

  const userData = {
    fullName: profile.displayName,
    email: profile.emails[0].value,
    profilePicture: profile.photos[0].value,
    googleId: profile.id
  };
  
  try {
    await saveUser(userData);
  
      let sessionKey = await getSessionKeyByUserId(profile.id);
      if (!sessionKey) {
        sessionKey = uuidv4();
        await saveSession(sessionKey, profile.id);
        console.log(`Created new session key for ${profile.displayName}: ${sessionKey}`);
      }
      // Instead of returning `profile`, return session key info
      return done(null, { sessionKey, user: userData });
    } catch (err) {
      console.error("Error saving user/session:", err);
      return done(err);
    }
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'], session: false })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173', session: false }),
  async (req, res) => {
    // req.user is the profile because done(null, profile) was used
    const userProfileWrapper = req.user;
    if (!userProfileWrapper) return res.redirect('http://localhost:5173');

    console.log('Google profile:', JSON.stringify(userProfileWrapper, null, 2));

    const userProfile = userProfileWrapper.user; // <-- this is the actual user object
    const sessionKey = userProfileWrapper.sessionKey;

    const userId = userProfile.googleId;        // correct
    const email = userProfile.email;            // correct
    const profilePicture = userProfile.profilePicture; // correct

    if (!email) {
      console.warn('No email returned by Google for', userId);
      return res.redirect('http://localhost:5173/?error=no_email');
    }
    const userData = {
      id: userProfile.googleId,          // use googleId as unique ID
      fullName: userProfile.fullName ?? null,   // fullName comes from your DB wrapper
      email: userProfile.email,          // already extracted
      profilePicture: userProfile.profilePicture ?? null,
      googleId: userProfile.googleId     // same as id for clarity
    };

    try {
      await saveUser(userData);
      let sessionKey = await getSessionKeyByUserId(userId);
      if (!sessionKey) {
        sessionKey = uuidv4();
        await saveSession(sessionKey, userId);
      }
      res.redirect(`http://localhost:5173/?sessionKey=${sessionKey}`);
    } catch (err) {
      console.error(err);
      res.redirect('http://localhost:5173');
    }
  }
);

/* ---------------- Session Verification ---------------- */
app.get("/session/:sessionKey", async (req, res) => {
  try {
    const { sessionKey } = req.params;

    // Use the function you already wrote in databse.js
    const user = await verifySessionKey(sessionKey); //

    if (user) {
      // If the verifySessionKey function returns a user, the key is valid
      res.json({ valid: true });
    } else {
      // If the function returns null, the key is invalid
      res.json({ valid: false });
    }
  } catch (err) {
    console.error("Error during session key verification:", err);
    // Send a clear error response if the database query fails
    res.status(500).json({ valid: false, message: "Server error during validation." });
  }
});

const isAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check presence + structure
  if (!authHeader) {
    return res.status(401).json({ message: "Missing Authorization header." });
  }
  
  const [scheme, token] = authHeader.split(" ").map(s => s.trim());

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Malformed Authorization header." });
  }
  try {
    const user = await verifySessionKey(token);
    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session." });
    }
    req.user = user; // attach to request for downstream handlers
    return next();
  } catch (err) {
    console.error("Session verification error:", err);
    // Only throw 500 if it's a real server-side problem
    return res.status(500).json({ message: "Internal server error during session verification." });
  }
};

// Protected profile route
app.get("/api/profile", isAuthenticated, (req, res) => {
  res.json(req.user);
});

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads folder at:", uploadsDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);  // ✅ use the ensured path
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// POST upload
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, msg: "No file uploaded" });

  res.json({
    success: true,
    filename: req.file.filename,
    url: `http://localhost:${PORT}/uploads/${req.file.filename}`,
  });
});

// GET files
app.get("/api/files", (req, res) => {
  fs.readdir(path.join(__dirname, "uploads"), (err, files) => {
    if (err) return res.status(500).json({ success: false, msg: "Error reading files" });
    const urls = files.map(f => `http://localhost:${PORT}/uploads/${f}`);
    res.json(urls);
  });
});
// --- Define the Python Service URL ---
// Make sure your Python Flask app is running on port 5001 to avoid conflicts
const PYTHON_API_URL = 'http://localhost:5001/process-pdf';

// =================================================================
// --- NEW: Endpoint to connect to the Python RAG Service ---
// This route is protected; only authenticated users can access it.
// =================================================================
app.post("/api/ask", isAuthenticated, async (req, res) => {
    // The `isAuthenticated` middleware ensures we have a valid user.
    // The user's details are in `req.user`.
    console.log(`Authenticated user ${req.user.email} is asking a question.`);

    const { pdfUrl, query } = req.body;

    // Validate the input from the client
    if (!pdfUrl || !query) {
        return res.status(400).json({ success: false, message: "pdfUrl and query are required." });
    }

    try {
        // Forward the request to the Python Flask service
        console.log(`Forwarding request to Python service for URL: ${pdfUrl}`);
        const response = await axios.post(PYTHON_API_URL, {
            pdf_url: pdfUrl,    // Key must match what the Python API expects
            question: query     // Key must match what the Python API expects
        });

        // Send the answer from Python back to the client
        res.json({ success: true, answer: response.data.answer });

    } catch (error) {
        // Handle any errors from the Python service
        console.error('Error calling Python service:', error.response ? error.response.data : error.message);
        const status = error.response ? error.response.status : 500;
        const message = error.response ? (error.response.data.error || "An error occurred with the AI service.") : 'Internal Server Error';
        res.status(status).json({ success: false, message: message });
    }
});
app.listen(5000, () => console.log("Server running at http://localhost:5000"));