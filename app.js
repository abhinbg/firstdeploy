require('dotenv').config();
const bodyParser = require("body-parser");
const express=require("express");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate =require("mongoose-findorcreate");

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




mongoose.connect("mongodb://127.0.0.1:27017/security");


const userschema=new mongoose.Schema( {
    username:String,
    password:String,
    photo:String,
    name:String,
    googleId:String
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
// passport.use(new GoogleStrategy({
//     clientID: process.env.client_ID,
//     clientSecret: process.env.client_Secret,
//     callbackURL: "http://localhost:3000/auth/google/secrets",
//     // UserProfileURL:"https://www.googleapis.com/oauth20/v3/userinfo",
//     userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
//     scope: ['profile', 'email', 'openid']
// },
//     (accessToken, refreshToken, profile, done) => {
//        const userData={
       
//            photo: profile.photos,
//          name: profile.displayName
//        };

   

//         usermodel.findOrCreate({ googleId: profile.id, photo:profile.photos[0].value,name:profile.displayName});
           
//             return done(null,userData);
//     }
// ));
// ---------------------------------------------------

passport.use(new GoogleStrategy({
    clientID: process.env.client_ID,
    clientSecret: process.env.client_Secret,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scope: ['profile', 'email', 'openid']
},
    (accessToken, refreshToken, profile, done) => {
        const userData = {
            photo: profile.photos[0].value, 
            name: profile.displayName
        };

        // Depending on your implementation, you should handle the user creation logic here
        // Example using Mongoose
        usermodel.findOne({ googleId: profile.id })
            .then(user=>{
               
                if (!user) {
                    // If the user doesn't exist, create a new user
                    const newUser = new usermodel({
                        googleId: profile.id,
                        photo: userData.photo,
                        name: userData.name
                    });
                    newUser.save();
                
                } else {
                    // If the user already exists, return the userData
                    return done(null, userData);
                }
            })
            .catch(err=>{
                console.log(err);
            })
        
                
                
          
        
    }));
    

// item1.save();

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
        console.log(user.name);
        console.log(user.photo);

           
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





app.listen(3000,function(req,res){
    console.log("server has started on port 3000");
});


