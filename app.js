const express = require('express');
const { urlencoded } = require('express');
const { isLoggedIn } = require('./middleware');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocal = require('passport-local');
const path = require('path');
const app = express();
const ejsMate = require('ejs-mate');
const session = require('express-session');
const MongoDBS = require('connect-mongo');
const methodOverride = require('method-override');
const Post = require('./models/postSchema')
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
const dburl = 'mongodb://localhost:27017/assigment';
const User = require('./models/userSchema');

mongoose.connect(dburl)
    .then(() => {
        console.log('connected');

    })
    .catch((err) => {
        console.log('error');
        console.log(err);
    });
const store = new MongoDBS({
    mongoUrl: dburl,
    secret: 'thisis',
    touchAfter: 24 * 60 * 60
})
const sessionConfig = {
    store: store,
    secret: 'thisis',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(express.static('public'))
app.use((req, res, next) => {
    

    res.locals.currentUser = req.user;

    next();
})


app.get('/', async (req, res) => {
  
    const Posts = await Post.find().populate('author');
    console.log(Posts);
    res.render('home', { Posts });
})
app.get('/login', (req, res) => {
    res.render('user/login')
})
app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    res.redirect('/');
})
app.get('/logout', isLoggedIn, (req, res) => {
    req.logout(function (err) {
        if (err) {
            console.log('error')
            return res.redirect('/login');
        }
        res.redirect('/');
    });

})
app.get('/register', (req, res) => {
    res.render('user/register')
})
app.get('/users', async (req, res) => {
    const users = await User.find({});
    res.render('user/show', { users });

})
app.post('/users', async (req, res) => {
    try {
       
        const { username, email, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            res.redirect('/');
        })
       
    } catch (e) {
        
        res.redirect('/register');
    }
})
app.get('/users/:username', async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    res.render('user/showUser', { user });
})
app.get('/users/:username/followers', async (req, res) => {
    const user = await User.findOne({ username: req.params.username }).populate('followers');
    user.followers.forEach(function (arrayItem) {
    });
    res.send(user.followers);
})
app.get('/users/:username/following', async (req, res) => {
    const user = await User.findOne({ username: req.params.username }).populate('following');
    res.send(user.following);
})
app.get('/users/:username/follow', isLoggedIn, async (req, res) => {

    const user1 = await User.findOne({ username: req.params.username }).populate('followers');

    const user2 = await User.findOne({ username: req.user.username }).populate('following');
    var user1Check = true;

    user1.followers.forEach(function (arrayItem) {

        if (arrayItem.username == user2.username) {
            user1Check = false;
            console.log('follower alread present')
        }
    });
    var user2Check = true;
    user2.following.forEach(function (arrayItem) {
        if (arrayItem.username == user1.username) {
            user2Check = false;
            console.log('following alread present')
        }
    });
    if (user1Check) {
        user1.followers.push(user2._id)
        await user1.save();
    }
    if (user2Check) {
        user2.following.push(user1._id);
        await user2.save();
    }
    res.redirect('/followList');


})
app.get('/followList', async (req, res) => {
    const users = await User.findOne({ username: req.user.username }).populate('following');
    res.render('following', { users });
})
app.get('/followingList', async (req, res) => {
    const users = await User.findOne({ username: req.user.username }).populate('followers');
    res.render('follow', { users });
})
app.delete('/users/:username/follow', async (req, res) => {
    const follower = await User.findOne({ username: req.user.username }).populate('following');
    const followed = await User.findOne({ username: req.params.username }).populate('followers');
    const newFollower = follower.following.filter((item) => item.username !== req.params.username);
    follower.following = newFollower;
    const newFollowed = followed.followers.filter((item) => item.username !== req.user.username);
    followed.followers = newFollowed;
    await followed.save();
    await follower.save();

    res.redirect('/followList');



})
app.get('/post', isLoggedIn, (req, res) => {
    res.render('post');
})
app.post('/newPost', isLoggedIn, async (req, res) => {

    const newPost = await Post(req.body);
    newPost.author = req.user._id;
    await newPost.save();
    res.redirect('/post');


})

app.listen(3000, () => {
    console.log('connected!!');
})