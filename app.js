const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session')

require('dotenv').config();

//init app
const app = express();

//view engine setup
app.set('view engine', 'ejs');

//set public folder
app.use(express.static('public'));

//set global error variable
app.locals.error = null;

//middlewares
app.use(express.urlencoded({
  extended: false
}));
app.use(express.json());
//express-session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}))

//express-messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});





//set routes
const pages = require('./routes/pages')
const adminPages = require('./routes/admin_pages')

app.use('/admin/pages', adminPages);
app.use('/', pages);









//connect to db
mongoose.connect(process.env.DB_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
}, (err) => {
  if (!err) console.log("MONGOOSE IS SUCCESSFULLY CONNECTED!");
});

//start the server
const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on PORT ${port}`);
})