import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router: IRouter = Router();
const JWT_SECRET = process.env["JWT_SECRET"] || "default_secret";

router.post("/register", async (req, res) => {
  try {
    console.log("Registration attempt:", req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log("Registration failed: Missing fields");
      return res.status(400).json({ error: "All fields (name, email, password) are required" });
    }

    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existingUser.length > 0) {
      console.log("Registration failed: User exists", email);
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      name,
      email,
      password: hashedPassword,
      role: email.includes("admin") ? "admin" : "user"
    }).returning();

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ 
      user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
      token 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Registration failed" });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ 
      user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
      token 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.id));
    if (!user) return res.status(404).json({ error: "User not found" });
    
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

export default router;
