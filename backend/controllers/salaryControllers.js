import { getSalarySummary, paySalary } from "../services/salaryServices.js";

export const fetchSalarySummary = async (req, res, next) => {
  try {
    const { month, year } = req.params;
    const data = await getSalarySummary(parseInt(month), parseInt(year));
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const handlePaySalary = async (req, res, next) => {
  try {
    const result = await paySalary(req.body, req.user.userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
