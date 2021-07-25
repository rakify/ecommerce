const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: 'rakibs', 
  api_key: '359778781159941', 
  api_secret: 'Zff48bRkbiDhHx2cMhxvo4q62a4',
  secure: true
});


//connect to db
mongoose.connect(process.env.DB_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
}, (err) => {
  if (!err) console.log("MONGOOSE IS SUCCESSFULLY CONNECTED!");
});

//init app
const app = express();

//view engine setup
app.set('view engine', 'ejs');

//set public folder
app.use(express.static('public'));

//set global error variable
app.locals.error = null;

// Get Page Model
let Page = require('./models/Page');

// Get all pages to pass to header.ejs
Page.find({}).sort({
  sorting: 1
}).exec((err, pages) => {
  if(err) console.log(err);
  if(pages) app.locals.pages = pages;
});

// Get Category Model
let Category = require('./models/Category');

// Get all categories to pass to header.ejs
Category.find((err, categories)=> {
    if (err) console.log(err);
    if(categories)app.locals.categories = categories;
});

// Get User Model
let User = require('./models/User');

// Get sellers name to pass to header.ejs
User.find({admin: 2},(_err,user)=>{
app.locals.seller = user; 
}); 

//multer middleware
const multer = require('multer');
//default error handler & multer
app.use((err, req, res, next) => {
  if (err) {
    if (err instanceof multer.MulterError) {
      res.status(500).send('Rule #1 Only .jpg .jpeg .png format allowed.<br>Rule #2 File size must be below 5mb.<br>Rule #3 You can select max 5 images to upload at the same time.')
    }
  }
})
//express.json() middlewares
app.use(express.urlencoded({
  extended: false
}));
app.use(express.json());
//express-session middleware just to store the flash messages
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}));

//express-messages middleware
app.use(require('connect-flash')());
app.use((req, res, next)=> {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Passport config
require('./config/passport')(passport);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', (req,res,next)=>{
  res.locals.cart = req.session.cart;
  res.locals.user = req.user || null;
  next();
})




//set routes
let user = require('./routes/user');
let pages = require('./routes/pages');
let products = require('./routes/products');
let users = require('./routes/users');
let adminPages = require('./routes/admin_pages');
let adminCategories = require(`./routes/admin_categories`);
let adminProducts = require('./routes/admin_products');
let cart = require('./routes/cart');

app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/products', products);
app.use('/cart', cart);
app.use('/users', users);
app.use('/user', user);
app.use('/', pages);


//start the server 
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on PORT ${port}`);
})