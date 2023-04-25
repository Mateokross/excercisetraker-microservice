//get packages
require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Basic Configuration
app.use(cors()) //use cors
app.use(express.static('public')) //expose public folder
app.use(bodyParser.urlencoded({ extended: false }));//enable body parsing
app.get('/', (req, res) => { //index page
  res.sendFile(__dirname + '/views/index.html')
});


//Mongo config

//connect to db
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//define schemas
var userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
}, { timestamps: true });

var User = mongoose.model("User", userSchema);

var excerciseSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: false
  },
}, { timestamps: true });

var Excercise = mongoose.model("Excercise", excerciseSchema);


//create users
app.post('/api/users', (req, res) => {

  //get user input
  console.log(req.body)
  var username = req.body.username;

  //validate user input
  //not neccessary

  //send to mongo
  const document = new User({ username: username });
  document
    .save()
    .then((doc) => {
      //respond with id
      res.json({ username: username, _id: doc._id })
    })
    .catch((err) => {
      console.error(err);
    });

});


//get users
app.get('/api/users', (req, res) => {

  //query mongo
  User
    .find()
    .then((doc) => {
      res.json(doc)
    })
    .catch((err) => {
      console.error(err);
    });

});


//log excercises
app.post('/api/users/:_id/exercises', (req, res) => {

  //get user input
  console.log(req.body)
  let {description, duration, date = new Date().toDateString() } = req.body
  let userId = req.params._id

  //format date
  if(typeof date == 'string') { date = new Date(date).toDateString()}

  //validate user input
  //not neccessary

  //send to mongo
  const document = new Excercise({
    user_id: userId,
    description: description,
    duration: duration,
    date: date
  });
  document
    .save()
    .then((doc) => {
      console.log(doc)

      //get user details
      User
        .findOne({ _id: userId })
        .then((doc) => {
          console.log(doc)
          //respond with the user object with the exercise fields added.
          console.log(typeof duration)
          res.json({
            username: doc.username,
            description: description,
            duration: Number(duration),
            date: date,
            _id: userId
          })
        })
        .catch((err) => {
          console.error(err);
        });


    })
    .catch((err) => {
      console.error(err);
    });

});


//get logs
app.get('/api/users/:_id/logs', (req, res) => {

  //get id
  const userId = req.params._id

  //build excercises filter
  const {from, to , limit} = req.query
  const excercisesFilter = {user_id: userId}
  if (typeof from === "string") {excercisesFilter.date = {$gte : from }}
  if (typeof to === "string") {excercisesFilter.date = {$lte : to }}

  //query mongo
  User
    .findOne({ _id: userId }) //find user
    .then((user) => {

      Excercise
        .find(excercisesFilter) //find excercises
        .limit(limit) //limit results
        .then((excerciseLogs) => {

          console.log(excerciseLogs)

          //format dates
          formattedExcerciseLogs = excerciseLogs.map((obj) => {
            obj = obj.toObject(); // convert Mongoose document to plain object
            const formattedDate = obj.date.toDateString();
            return { description: obj.description, duration: obj.duration, date: formattedDate };
          });

          console.log(formattedExcerciseLogs)
          
          //build object to return
          res.json({
            username: user.username,
            count: formattedExcerciseLogs.length,
            _id: user._id,
            log: formattedExcerciseLogs
          })

        })
        .catch((err) => {
          console.error(err);
        });
      
    })
    .catch((err) => {
      console.error(err);
    });


});

//open port 3000
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
