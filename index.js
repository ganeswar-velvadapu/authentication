const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const User = require("./models/user.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

async function main() {
    await mongoose.connect("mongodb://localhost:27017/auth-test");
}

main().then(() => console.log("Connected")).catch((err) => console.log(err));


app.get("/",checkToken, (req, res) => {
    res.send("Home");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", async (req, res) => {
    let { email, username, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
        return res.send("User already exists");
    } else {
        const hashPassword = await bcrypt.hash(password, 10);
       const user = await User.create({
            email: email,
            password: hashPassword,
            username: username
        });
        console.log("Signup successful");
        const payload = {
            id:user.id,
            email:user.email
        }
        const token = generateToken(payload)
        res.cookie('token', token, { httpOnly: true });
        res.redirect("/login");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    let { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (user) {
        const passcode = await bcrypt.compare(password, user.password);
        if (passcode) {
            const payload = {
                id:user.id,
                email:user.email
            }
            const token = generateToken(payload)
            res.cookie('token', token, { httpOnly: true });
            return res.redirect("/");
        } else {
            return res.send("Password wrong");
        }
    } else {
        return res.send("User not found");
    }
});



//Functions
function generateToken(userData){
    return jwt.sign(userData,"secret")
}

function checkToken(req,res,next){
    const token = req.cookies.token
    if(!token){
        res.redirect("/login")
    }
    try {
        const decode = jwt.verify(token,"secret")
        console.log(decode)
        req.user = decode
        next()
    } catch (error) {
        console.log(error)
    }
}   

app.listen(3000, () => {
    console.log("Server listening on port 3000");
});
