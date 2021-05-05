const express                       = require('express');

//init app
const app                           = express();

//view engine setup
app.set('view engine', 'ejs');

//set public folder
app.use(express.static('public'));

app.get('/', (req,res)=>{
    res.send('Working');
})












//start the server
const port = 5000;
app.listen(port, () => {
    console.log(`Server is running on PORT ${port}`);
})