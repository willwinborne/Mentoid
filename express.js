
// ############## Project 2 JS ##############
// Express branch: serverside JS
// this is based on sprint2.js from our first project.

// run this file with the node command to host the server on http://localhost:3000
const express = require('express');
// express-session allows login and sessions
const session = require('express-session');
// multer middleware allows multipart forms to be read by the server
const multer = require('multer');
const bodyParser = require('body-parser');
const upload = multer({ dest: 'profile_pictures/' });
const mysql = require('mysql');
const app = express();
const port = 3000;
// middleware init
app.use(express.json());
app.use(session({ secret: 'cis440group2project2', name: 'uniqueSessionID', resave: false, saveUninitialized: false }))

// all this does is allow access to all files in the public folder. put all JS, CSS, and HTML files in there
// these are accessed by a URL, localhost:3000/name_of_file_or_command
app.use(express.static('public'));
// this will make all profile pictures seperate, but also public and visible to the client so we can download them
app.use(express.static('profile_pictures'));

// logout of the app
// not accessible without login, so no check required
app.get('/logout', (req, res) => {
  req.session.destroy((err) => { })
  // TODO: more graceful logout
  res.send('Thank you! Visit again');
})

// login to the app
app.post('/authenticate', bodyParser.urlencoded({extended: true}), async (req, res, next) => {

  const connection = mysql.createConnection({
    host: '107.180.1.16',
    user: 'springog2022team',
    password: 'springog2022team4',
    database: 'springog2022team4',
    port: 3306
  });

  connection.connect();

  console.log(req.body.mentor)
  connection.query(`SELECT Password FROM mentorsTable WHERE mentorUsername ='${req.body.username}'`, function (err, results) {
    if (err) throw err.code;

    if (results[0].Password == req.body.password) {
      console.log("password check passed.")
      res.locals.username = req.body.username;
      req.session.loggedIn = true;
      req.session.username = res.locals.username;
      res.redirect("http://localhost:3000/mentoidSwipe.html");
    } else {
      console.log("password check failed.");
      res.sendStatus(401);
    }

  });
  connection.end();

});

// currently gets ALL mentors, we need to eventually change this to only retrieve the mentors the user "matched" with
// login is required for this. 
app.get('/getmentors', (req, res) => {

  //check if this user is logged in (standard for most functions!)
  if (req.session.loggedIn) {

    const connection = mysql.createConnection({
      host: '107.180.1.16',
      user: 'springog2022team',
      password: 'springog2022team4',
      database: 'springog2022team4',
      port: 3306
    });

    connection.connect();

    // WHERE interests ???
    connection.query('SELECT * FROM mentorsTable', function (err, results) {
      if (err) throw err.code;

      res.send(results);

    });

    connection.end();

  } else {
    console.log("USER IS NOT LOGGED IN")
    res.send("You're not logged in.")
  }

});

// dynamically check a given username's availability
// no login check required
app.post('/checkUsername', (req, res) => {

  const connection = mysql.createConnection({
    host: '107.180.1.16',
    user: 'springog2022team',
    password: 'springog2022team4',
    database: 'springog2022team4',
    port: 3306
  });

  connection.connect();

  // check for existing usernames
  connection.query(`SELECT mentorUsername FROM mentorsTable WHERE mentorUsername = '${req.body.username}';`, function (err, results) {
    if (err) throw err.code;
    if (typeof results[0] !== 'undefined') {
      res.json({ usernameTaken: 'true' });
    } else {
      res.json({ usernameTaken: 'false' });
    }

  });

  connection.end();

});

// dynamically check for a match between two people
app.post('/checkForMatch', (req, res) => {

  user = req.session.username;

  const connection = mysql.createConnection({
    host: '107.180.1.16',
    user: 'springog2022team',
    password: 'springog2022team4',
    database: 'springog2022team4',
    port: 3306
  });

  connection.connect();

  // check for existing usernames
  connection.query(`SELECT mentorUsername FROM mentorsTable WHERE mentorUsername = '${req.body.username}';`, function (err, results) {
    if (err) throw err.code;
    if (typeof results[0] !== 'undefined') {
      res.json({ usernameTaken: 'true' });
    } else {
      res.json({ usernameTaken: 'false' });
    }

  });

  connection.end();

});


// return the username of the user
// not accessible without login, so no check required
app.post('/getUsername', (req, res) => {
  console.log(`getUsername: ${req.session.username}`)

  let values = {username: "tom"};
  values.username = req.session.username;
  res.json(values);

});

// create a new mentor's profile in the database
// TODO: generate a comma-separated interests string from the selections on the profile page, and store in place of 'accounting'
// upload.single('img') uploads the file input with the name 'img' to the /profile_pictures directory on the webserver (multer)
app.post('/makenewprofile', upload.single('img'), async (req, res) => {

  const connection = mysql.createConnection({
    host: '107.180.1.16',
    user: 'springog2022team',
    password: 'springog2022team4',
    database: 'springog2022team4',
    port: 3306
  });

  connection.connect();

  connection.query(`INSERT INTO mentorsTable VALUES ('${req.body.username}','${req.body.fname}', '${req.body.lname}', '${req.body.password}', '${req.body.email}', 'accounting', '${req.body.description}', '${req.file.filename}');`, (err) => {
    if (err) throw err.code;

    connection.end();
  });

  // redirect after creation of the account
  res.writeHead(302, { 'Location': 'http://localhost:3000/mentoidSwipe.html', });
  res.end();

});

// don't mess with this
app.listen(port, () => {
  console.log(`Mentoid app listening on port ${port}. Visit http://localhost:${port}/`);
});
