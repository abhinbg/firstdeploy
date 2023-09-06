require('dotenv').config();
const bodyParser = require("body-parser");
const express=require("express");
const mongoose=require("mongoose");
const session=require('express-session');


const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate =require("mongoose-findorcreate");
const PORT=process.env.PORT || 3000;


const app=express();





app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine','ejs');
app.use(express.static("public"));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
   

}));

app.use(passport.initialize());
app.use(passport.session());




mongoose.connect("mongodb+srv://chotu:ak123@cluster0.lurrdal.mongodb.net/UserDetails");
// mongoose.connect("mongodb://127.0.0.1:27017/UserDetails");


const userschema=new mongoose.Schema( {
    username:String,
    password:String,
    photo:
    {
        data: Buffer,
        contentType: String
    },
    name:String,
    googleId:String,
    mobile:String
});
userschema.plugin(passportLocalMongoose);
userschema.plugin(findOrCreate);


const usermodel= new mongoose.model("usermodel",userschema);

passport.use(usermodel.createStrategy());
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username, name: user.name });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.Client_ID,
    clientSecret: process.env.Client_secret,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scope: ['profile', 'email', 'openid']
   
},
    (accessToken, refreshToken, profile, done) => {

        const userData = {
            photo: profile.photos[0].value,
            name: profile.displayName,
            mobile: "8210150752"
        };
        

        usermodel.findOne({ googleId: profile.id })
            .then(user => {
                if (!user) {
                    const newUser = new usermodel({
                        googleId: profile.id,
                        photo: userData.photo,
                        name: userData.name,
                        mobile: userData.mobile
                    });

                    return newUser.save();
                } else {
                    return Promise.resolve(user); // Resolve with the existing user
                }
            })
            .then(savedUser => {
               return done(null, savedUser);
            })
            .catch(err => {
                console.log(err);
               return done(err, null);
            });
        
    }));




    
app.get("/",function(req,res){
    res.render('home');
});


app.get('/auth/google',
    passport.authenticate('google', {
scope: ['profile', 'email', 'openid']
}),
);

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });
app.get("/Register",function(req,res){
    res.render('Register');

});

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
      
       const user=req.user;
       console.log(user.mobile);
       
    console.log(user);
       res.render('profile',{user});
   

           
            
         
        
        
    }
    else{
        res.redirect('/login');
    }
});

app.post("/Register",function(req,res){
   usermodel.register({username:req.body.username},req.body.password,function(err,usermodel){
    if(err){
        console.log(err);
        // res.send(err.message);
        res.redirect("/Register");
    }
    else{
        passport.authenticate('local')(req,res,function(){
            res.redirect("/secrets");
          

        })
          
    }

    
    
   });
   
    // if(err)
    // {
    //     console.log(err);
    //     res.redirect("/Register");
    // }
    // else{
    //     passport.authenticate("local")(req,res,function(){
    //         res.redirect("/secrets");
    //         console.log(usermodel);
    //     });
    // }
   

});


app.get("/login",function(req,res){
    res.render("login");
});
app.post("/login",function(req,res){
   
    const user=new usermodel({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user,function(err){
        if(err)
        {
            console.log(err);
        }
        else{
            passport.authenticate('local')(req,res,function(){
                res.redirect("/secrets");
            });
        }
    })
});

app.post("/logout",function(req,res){
   req.logout(function(err){
    if(err)
    {
        console.log(err);
    }
    else{
        res.redirect("/");
        console.log("successfully logout");
    }
   });
   
});




app.listen(PORT,function(req,res){
    console.log("server started on port"+PORT);
});




