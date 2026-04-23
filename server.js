const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const fs = require("fs");
const path = require("path");
const expressMongoSanitize = require("@exortek/express-mongo-sanitize");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const carProviders = require("./routes/carProviders");
const auth = require("./routes/auth");
const bookings = require("./routes/bookings");
const profile = require("./routes/profile");

//Load env variables
const envPath = path.join(__dirname, "config", "config.env");
// if (fs.existsSync(envPath)) {
//     dotenv.config({ path: envPath });
// }

//Connect to database
connectDB().catch((err) => {
    console.error("Database connection error:", err.message);
});

const app = express();

app.set("query parser", "extended");

//Body parser
app.use(express.json());

//Mongo sanitize
app.use(
    expressMongoSanitize({
        patterns: [
            /\$/g,
            /[\u0000-\u001F\u007F-\u009F]/g,
            /\{\s*\$|\$?\{(.|\r?\n)*\}/g,
        ],
    }),
);

//Helmet
app.use(helmet());

//Prevent XSS attacks
app.use(xss());

//Prevent parameter pollution
app.use(hpp());

//Enable CORS
app.use(cors());

//Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 100,
});
app.use(limiter);

//Cookie parser
app.use(cookieParser());

const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "Library API",
            version: "1.0.0",
            description: "A simple Express VacQ API",
        },
        servers: [
            {
                url: "http://localhost:5000/api/v1",
            },
        ],
    },
    apis: ["./routes/*.js"],
};


const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

//Route files
app.use("/api/v1/car-providers", carProviders);
app.use("/api/v1/auth", auth);
app.use("/api/v1/bookings", bookings);
app.use("/api/v1/profile", profile);

module.exports = app;

let server;
if (process.env.VERCEL !== "1") {
    const PORT = process.env.PORT || 5000;
    server = app.listen(
        PORT,
        console.log(
            "Server is running in ",
            process.env.NODE_ENV,
            " mode on port ",
            PORT,
        ),
    );
}


//Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
    console.log(`Error: ${err.message}`);
    //Close server & exit process
    if (server) {
        server.close(() => process.exit(1));
    }
});
