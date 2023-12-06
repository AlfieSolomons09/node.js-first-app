const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');
// const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const mongoose = require("mongoose");
const { runInNewContext } = require("vm"); 

mongoose
.connect("mongodb://localhost:27017",{
    dbName: "backend",
})
.then(()=>console.log("Database Connected"))
.catch(e=>console.log(e));

const userrSchema = new mongoose.Schema({
    name: String,  
    email: String,
    password: String
})

const User = mongoose.model("User", userrSchema) 

const app = express();
const port = 5400;

const users = []

app.use(express.static(path.join(path.resolve(),"public")));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// app.use(express.json());

const isAuthenticated = async (req, res, next) => {
    const {token} = req.cookies;

    if(token){
        const decoded = jwt.verify(token, "sdfjalgnglkjag")

        req.user = await User.findById(decoded._id);

        next()
    }
    else{
        res.redirect("/login");
    }
}

app.get("/",isAuthenticated , (req, res) => {
    res.render("logout", {name: req.user.name});
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/login", async(req, res) => {
    const {email, password} = req.body;
    let user = await User.findOne({email})
    if(!user) return res.redirect("/register");

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) return res.render("login", {email, message:"Incorrent Password"})

    const token = jwt.sign({_id: user._id}, "sdfjalgnglkjag");

    res.cookie("token",token, {
        httpOnly: true, expires: new Date(Date.now()+60*1000)
    });
    res.redirect("/");
})
 
app.post("/register", async (req, res) => {
    const {name, email, password} = req.body

    let user = await User.findOne({email});

    if(user){
        return res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password, 10);


    user = await User.create({
        name,
        email,
        password: hashedPassword,
    });

    const token = jwt.sign({_id: user._id}, "sdfjalgnglkjag");

    res.cookie("token",token, {
        httpOnly: true, expires: new Date(Date.now()+60*1000)
    });
    res.redirect("/");
})

app.get("/logout", (req, res) => {
    res.cookie("token",null, {
        httpOnly: true, 
        expires: new Date(Date.now())
    });
    res.redirect("/");
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.listen(port, () => {
  console.log(`Server is Woring on port: ${port}`);
});