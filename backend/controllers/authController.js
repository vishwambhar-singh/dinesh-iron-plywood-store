import * as authService from "../services/authServices.js";

export const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const authData = await authService.authenticateEmployee(email, password);

    res.status(200).json({
      message: "Login successful",
      ...authData,
    });
  } catch (error) {
    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
