'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');

const cors = require('cors');

const bodyParser = require('body-parser');
const shortid = require('shortid');

const app = express();

mongoose.connect(process.env.DB_URI, function(err) {
    if (err) {
        console.err(err);
    } else {
        console.log('Connected');
    }    
});
const exerciseUserSchema = mongoose.Schema({
  _id: { 'type': String, 'default': shortid.generate },
  username: { 'type': String, 'required': true },
  activity: [ Object ]
});
const ExerciseUser = mongoose.model("ExerciseUser", exerciseUserSchema);

var findUsers = function(next) {
  ExerciseUser.find({}, function(err, result) {
    if (err) return console.error(err);
    next(null, result); 
  });
};

var findUser = function(name, next) {
  ExerciseUser.findOne({username: name}, function(err, result) {
    if (err) return console.error(err);
    next(null, result); 
  });
};

var findUserById = function(userid, next) {
  ExerciseUser.findById(userid, function(err, user) {
    if (err) return console.error(err);
    next(null, user); 
  });
};

var createUser = function(username, next) {
  new ExerciseUser({username: username}).save( function(err, user) {
    if (err) return console.error(err);
    next(null, user); 
  });
};


var updateExercise = function(userid, exercise, next) {
  ExerciseUser.findById(userid, function(err, user) {
    if (err) return console.error(err);
    if (user == null) return next(null, user);
    user.activity.push(exercise);
    user.save((err, data) => {
      if (err) return console.error(err);
      next(null, user); 
    });
  });
};


app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, resp) => {
  const { username } = req.body;
  findUser(username, (err, usr) => {
    console.log("found " + usr);
    if (usr == null) {
      createUser(username, (err, usr) =>  {
        console.log(usr);
        resp.json({ username: username, _id: usr._id }); 
      });
    } else {
        resp.json({ error: `username ${username} already exists` });
    }
  });
});

app.get('/api/exercise/users', (req, resp) => {
  findUsers((err, usrs) => {
    resp.json(usrs);
  });
});

app.post('/api/exercise/add', (req, resp) => {
  const { userId, description, duration, date : ds } = req.body;
  let response = {}, errors = [];
  if (!description) errors.push("Must provide a description");
  if (!duration || duration <= 0 ) errors.push("Must provide a valid duration");
  let date = (!ds) ? new Date() : new Date(ds); 
  if (date.toString() === "Invalid Date") errors.push("If you provide a date it must be a valid date");
  if (!userId) errors.push("Must provide a userId");
  if (errors.length === 0) {
    updateExercise(userId, {description, duration, date}, function(err, usr){
       if (!usr) {
         resp.json( { error: "Unknown user" } )
       } else {
         resp.json( usr )
       }
    });
  } else {
    resp.json( { error: errors } );
  }
});

// app.get('/api/exercise/log', (req, resp) => {
  
// });


/*

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})
*/

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
