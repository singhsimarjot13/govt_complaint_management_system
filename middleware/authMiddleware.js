import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";

export const protect = (roles = []) => async (req,res,next) => {
  try {
    const token = req.cookies.token;
    if(!token) return res.status(401).json({ message:"Not authorized" });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    if(roles.length && !roles.includes(decoded.role)){
      return res.status(403).json({ message:"Access denied" });
    }

    next();
  } catch(err) {
    console.error(err);
    return res.status(401).json({ message:"Invalid token" });
  }
};
