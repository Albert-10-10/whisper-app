//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();



app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

mongoose.set("strictQuery", false);
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});

//encrypt
userSchema.plugin(encrypt, { secret: process.env.SECRET , encryptedFields: ["password"]});

const User = mongoose.model("user", userSchema);




app.get("/", (req,res)=>{
    res.render("Home");
});

app.route("/login")
    .get((req,res)=>{
        res.render("login");
    })
    .post((req,res)=>{
        const username = req.body.username;
        const password = req.body.password;
        User.findOne({email: username}, (err, foundUser)=>{ //find username in db
            if(err){
                console.log(err);
            } else {
                if(foundUser){
                    if(foundUser.password === password){ // find matching pass if username found
                        res.render("secrets");
                    }
                }
            }
        })
    });

app.route("/register")
    .get((req,res)=>{
        res.render("register");
    })
    .post((req,res)=>{
        const newUser = new User({
            email: req.body.username,
            password : req.body.password
        });
        newUser.save((err)=>{
            if(err){
                console.log(err);
            } else {
                res.render("secrets");
            }
        })
    })

app.listen(3000, ()=>{
    console.log("Server started");
});