require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.set("strictQuery", false);
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    secret : String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

app.get("/", (req,res)=>{
    res.render("Home");
});

app.route("/login")
    .get((req,res)=>{
        res.render("login");
    })
    .post((req,res)=>{
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
    
        req.login(user, (err)=> {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, ()=>{
                    res.redirect("/secrets");
                })
            }
          });
    });

app.get("/secrets", (req, res)=>{
   User.find({"secret": {$ne : null}}, (err, foundUsers)=>{
    if (err){
        console.log(err);
    } else {
        if (foundUsers) {
            res.render("secrets", {usersWithSecrets : foundUsers});
        }
    }
   })
});

app.route("/submit")
    .get((req, res)=>{
        if (req.isAuthenticated()){
            res.render("submit");
        } else {
            res.redirect("/login");
        }
    })
    .post((req,res)=>{
        const submittedSecret = req.body.secret;
        console.log(req.user.id);

        User.findById(req.user.id, (err, foundUser)=>{
            if(err){
                console.log(err)
            } else {
                if (foundUser) {
                    foundUser.secret = submittedSecret;
                    foundUser.save( ()=>{
                        res.redirect("/secrets");
                    });
                }
            }
        });
    }) 

app.get("/logout", (req,res)=>{
    req.logout((err)=> {
        if (err) {
            return next(err);
        } else {
            res.redirect('/');
        }
        
      });
});

app.route("/register")
    .get((req,res)=>{
        res.render("register");
    })
    .post((req,res)=>{
        User.register({username: req.body.username}, req.body.password, (err, user)=>{
            if(err){
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, ()=>{
                    res.redirect("/secrets");
                })
            }
        });
    })

app.listen(3000, ()=>{
    console.log("Server started");
});