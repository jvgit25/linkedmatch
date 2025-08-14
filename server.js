import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import companyEmployeesRoute from "./routes/companyEmployees.js";
import refreshCompanyRoute from "./routes/refreshCompany.js";
import suggestionsRoute from "./routes/suggestions.js";
import userRoute from "./routes/user.js";
import paypalRoute from "./routes/paypal.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/company-employees", companyEmployeesRoute);
app.use("/api/refresh-company", refreshCompanyRoute);
app.use("/api/suggestions", suggestionsRoute);
app.use("/api/user", userRoute);
app.use("/api/paypal", paypalRoute);
app.use("/api/user", userRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

export default app;
