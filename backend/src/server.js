const app = require("./app");
require("dotenv").config();
const authRoutes = require("./routes/auth.routes");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`TriageSync server running on port ${PORT}`);
});