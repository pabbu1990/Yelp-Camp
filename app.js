var express = require("express"),
    app = express(),
    request = require("request"),
    mongoose = require("mongoose"),
    methodOverride = require("method-override"),
    Campground = require("./models/campground"),
    Comment =  require("./models/comment"),
    seedDB = require("./seeds"),
    flash = require("connect-flash"),
    passport = require("passport"),
    localAuth = require("passport-local"),
    localMongoose = require("passport-local-mongoose"),
    User = require("./models/user"),
    expressJwt = require("express-jwt"),
    jwt = require("jsonwebtoken");
    
//var url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp"
//mongoose.connect(url);
mongoose.connect("mongodb://pabbu:yelpcamp@ds125113.mlab.com:25113/angular-yelpcamp");
app.set("view engine", "ejs");
var bodyParser = require("body-parser");

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS, HEAD');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json,Authorization');
    next();
});
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressJwt({secret: 'pabbudamustang'}).unless({path:['/login', '/signup', '/campgrounds']}));
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(flash());



 app.use(require("express-session")({
        secret: "What is your name",
        resave: false,
        saveUninitialized: false
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());
    
    passport.use(new localAuth(User.authenticate()));
    
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
    
    app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.oopss = req.flash("oops");
    res.locals.success = req.flash("success");
    next();
    })

//ROUTES
app.get("/campgrounds", function(req, res){
    Campground.find({}, function(err, body){
       if(err){
           console.log("An error occured: "+err);
       } 
       else{
           res.setHeader('Content-Type', 'application/json');
           res.send(JSON.stringify({campgrounds: body}));
       }
    });
        
});

app.post("/campgrounds", function(req, res){
    Campground.create({name: req.body.name, image: req.body.image, description: req.body.description}, function(err, campground){
       if(err){
           console.log("An error occured: "+err);
           res.send(err);
       } 
       else{
           campground.save();
           console.log("campground from angular UI created"+campground);
       }
    });
    
});

app.get("/campgrounds/new", isLoggedIn, function(req, res){
    res.render("new");
});

app.post("/campgrounds/:id", isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err)
        {
            console.log(err);
            
        }
        else
        {
            Comment.create({author:req.user, content: req.body.cont}, function(err, newComment){
        if(err)
        {
            console.log(err);
        }
        else
        {
            newComment.author.id = req.user._id;
            newComment.author.username = req.user.username;
            newComment.save();
            foundCampground.comments.push(newComment);
            foundCampground.save();
            res.redirect("/campgrounds/"+req.params.id);
        }
    })
        }
    })
    
});

app.put("/campgrounds/:id", function(req, res){
    console.log(req.body);
     Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, foundCampground){
        if(err)
        {
            console.log(err);
            
        }
        else
        {
        res.redirect("/campgrounds/"+req.params.id);
        }
     });
    
});

app.delete("/campgrounds/:id", function(req, res){
    console.log(req.params.id);
     Campground.findById(req.params.id, function(err, foundCampground){
        if(err)
        {
            console.log(err);
            
        }
        else
        {
                foundCampground.remove();
                console.log("campground removed");
        }
     });
    
});

//SIGN UP ROUTES

app.post("/signup", function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err)
        {
            console.log(err);
            res.render("signup");
        }
        else
        {
            res.render("login");
        }
    });
});

//LOGIN ROUTES

app.post('/login', passport.authenticate('local'), function(req, res) {
    console.log('valid nigga');
    var myToken = jwt.sign({username: req.body.username}, 'pabbudamustang');
    res.status(200).json(myToken);
});

function isLoggedIn(req, res, next)
{
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("oops", "Please login!");
    res.redirect("/login");
}

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("YelpCamp server has started");
})

