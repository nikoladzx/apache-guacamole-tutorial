import jwt from "jsonwebtoken";

const generateToken = (res, ip, roomNumber, pcNumber) => {
  console.log("generateToken called with IP:", ip);
  
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set in environment variables");
    return null;
  }

  const token = jwt.sign({ ip }, process.env.JWT_SECRET, {
    expiresIn: "365d",
  });

  console.log("JWT Token generated:", token);

  try {
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false, 
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000, 
      path: "/"
    });
    res.cookie("roomNumber", roomNumber, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: "/"
    });

    res.cookie("pcNumber", pcNumber, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: "/"
    });
    console.log("Cookie settings:", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
    const cookies = res.getHeader('Set-Cookie');
    if (cookies) {
      console.log("Set-Cookie header:", cookies);
    } else {
      console.log("Set-Cookie header not found");
    }

    console.log("Cookie set successfully");
  } catch (error) {
    console.error("Error setting cookie:", error);
  }
  
  return token;
};

export default generateToken;


