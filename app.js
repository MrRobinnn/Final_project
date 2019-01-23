const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const Blog = require('./models/blog');
const Comment = require("./models/comment");
const User = require("./models/user");
const methodOverride = require('method-override');

const PORT = process.env.PORT || 3000;

//==========db config==============
const uri = 'mongodb://localhost:27017/zfinalproject';

mongoose.connect(uri, { useNewUrlParser: true });
// var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//  console.log("done!");

// });




//==========APP config==============
app.use(bodyParser.urlencoded({extended:true}));
//===serving directories
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
//==

//Passport configuration
app.use(require("express-session")({
	secret: "who to kill some one ",
	resave: true,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(methodOverride("_method"));








//==middleware for currentUser to work on every route
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	next();
});



// //======================RESTFUL ROUTES====================================
app.get("/", function(req, res){
	res.redirect("/blogs");
});

//===== INDEX ROUTE
app.get("/blogs", function(req, res){
	console.log(req.header);

	Blog.find({}, function(err, blogs){
		if(err){
			console.log("ERROR!");
		} else {
			res.render("blogs/index", {blogsVar: blogs});
		}
	});
});

//===== NEW ROUTE
app.get("/blogs/new", isLoggedIn, function(req, res){



	res.render("blogs/new");
});

// ===== CREATE ROUTE
app.post("/blogs", isLoggedIn, function(req, res){
	//create blog



	let data = req.body.blog
	Blog.create(data, function(err, newBlog){
		if(err){
			res.render("blogs/new");
		} else {
			//redirect tot he index
			res.redirect("/blogs");
		}
	});
});

//===== SHOW ROUTE
app.get("/blogs/:id", function(req, res){
	Blog.findById(req.params.id).populate("comments").exec(function(err, foundBlog){
		if(err){
			console.log(err);
		} else {
			res.render("blogs/show", {blogInfo: foundBlog});
		}
	});
});


















app.get("/editprofile", isLoggedIn, function(req, res){
	User.findById(req.user._id, function(err, foundUser){
		if(err){
			console.log("nashod!");

		} else {
			res.render("editprofile", {userInfo: foundUser});
			// console.log("founduser!"+foundUser);


		}
	});

// console.log("user!"+req.user);


});

//===== UPDATE ROUTE
app.put("/editprofile", isLoggedIn, function(req, res){
	console.log("1: " +req.body);
	console.log("2: " +req.body.user);
	// let id2 = req.user._id;
	console.log(req.session.passport);
	// User.findOneAndDelete({ username: req.session.passport.user }, function(err, result){
	// 	if(err){
	// 		console.log("pak nashod!");

	// 		// res.redirect("/blogs");
	// 	} else {
	// 		console.log("pak shod!");
	// 	}
	// });
	User.findOneAndUpdate({ username: req.session.passport.user }, {$set:req.body}, function(err, result){
		if(err){
			console.log("bazam nashod!");

			// res.redirect("/blogs");
		} else {
			console.log("RESULT: " + result);
			res.redirect("/login" );

			// console.log(req.user._id);

		}
	});
});














//==== EDIT ROUTE
app.get("/blogs/:id/edit", isLoggedIn, function(req, res){
	Blog.findById(req.params.id, function(err, foundBlog){
		if(err){
			res.redirect("/blogs");
		} else {
			res.render("blogs/edit", {blogInfo: foundBlog});
		}
	});
});

//===== UPDATE ROUTE
app.put("/blogs/:id", isLoggedIn, function(req, res){

	let id = req.params.id;
	Blog.findByIdAndUpdate(id, req.body.blog, function(err, updatedBlog){
		if(err){
			res.redirect("/blogs");
		} else {
			res.redirect("/blogs/" + id);

			console.log(req.params.id);

		}
	});
});

//===== DELETE ROUTE
app.delete("/blogs/:id", isLoggedIn, function(req, res){
	// res.send("the delete route!"); to test
	//delete the blog
	Blog.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/blogs");
		} else {
			//redirect somewhere
			res.redirect("/blogs");
		}
	});
});


//=== New COMMENTS
app.get("/blogs/:id/comments/new", isLoggedIn, function(req, res){
	// res.send("This will be the comment form!");
	// find blog by id
	Blog.findById(req.params.id, function(err, blog){
		if(err){
			console.log(err);
		} else {
			res.render("comments/new", {blogComt: blog});
		}
	});
});


//==Create route
app.post("/blogs/:id/comments", isLoggedIn, function(req, res){
	Blog.findById(req.params.id, function(err, blog){
		if(err){
			console.log(err);
			res.redirect("/blogs");
		} else{
			// console.log(req.body.comment); to see whats on the comment object
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					console.log(err);
				} else {

					//add username and id to comment
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					console.log("New " + req.user.username);
					//save comment
					comment.save();
					blog.comments.push(comment);
					blog.save();
					console.log(comment);
					res.redirect("/blogs/" + blog._id);
				}
			})
		}
	})
});


// //===============Auth ROUTES for users
// //===Show Register Form
app.get("/register", function(req, res){
	res.render("register");
});
//handle register sign up logic
app.post("/register", function(req, res){
	var newUser = new User({
        username: req.body.username,
        name:req.body.name,
        lastname:req.body.lastname,
        gender:req.body.gender,
        phone:req.body.phone


    });
	console.log("This is the username:" + newUser);
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			console.log(err);
			return res.render("register")
		}
		passport.authenticate("local")(req, res, function(){
			res.redirect("/blogs");
		});
	});
});

//===Show Login Form
app.get("/login", function(req, res){
	res.render("login");
});
//handle login logic
app.post("/login", passport.authenticate("local",
	{
		successRedirect: "/blogs",
		failureRedirect: "/login"
	}), function(req, res){
	// res.send("loggedIN!"); do this line to test first
});

//===Logout Route
app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/blogs");
});

//====Middleware for user is logged in
function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
};

//====== To delete all the blogs and comments
// function deleteDB(){
// 	//Remove all blogs
// 	Blog.remove({}, function(err){
// 		if(err){
// 			console.log(err);
// 		}
// 		console.log("removed all blogs!");
// 		Comment.remove({}, function(err) {
// 			if(err){
// 				console.log(err);
// 			}
// 			console.log("removed comments!");
// 		});
// 	});
// };









app.listen(PORT, function() {console.log("Listening on: " + PORT )});
