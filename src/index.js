const express = require('express');
var bodyParser = require('body-parser');
const multer = require("multer")

const route = require('./routes/route.js');

const app = express();
app.use(multer().any())


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));




const mongoose = require('mongoose')

mongoose.connect("mongodb+srv://amir-thorium:NSE7ZdUlu4no9WRF@cluster0.gchuo.mongodb.net/Group19-Data-base?authSource=admin&replicaSet=atlas-cw2o95-shard-0&w=majority&readPreference=primary&retryWrites=true&ssl=true", {useNewUrlParser: true})
    .then(() => console.log('mongodb running on '))
    .catch(err => console.log(err))

    app.use('/', route);

app.listen(process.env.PORT || 3000, function() {
	console.log('Express app running on port ' + (process.env.PORT || 3000))
});


