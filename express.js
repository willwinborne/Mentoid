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
  // redirect after logout
  res.writeHead(302, { 'Location': 'http://localhost:3000/mentoidLogin.html', });
  res.end();
})

// login to the app
app.post('/authenticate', bodyParser.urlencoded({ extended: true }), async (req, res, next) => {

  const connection = mysql.createConnection({
    host: '107.180.1.16',
    user: 'springog2022team',
    password: 'springog2022team4',
    database: 'springog2022team4',
    port: 3306
  });

  connection.connect();

  // is the user logging in as a mentor or mentee?
  let table = "";
  if (req.body.mentor == "on") {
    table = "mentor";
  } else {
    table = "mentee";
  }

  connection.query(`SELECT Password FROM ${table}sTable WHERE ${table}Username ='${req.body.username}'`, function (err, results) {
    if (err) throw err.code;

    if (results[0].Password == req.body.password) {
      console.log("Authenticate: password check passed.")
      res.locals.username = req.body.username;
      req.session.loggedIn = true;
      req.session.username = res.locals.username;
      req.session.profileType = table;
      res.redirect("http://localhost:3000/mentoidSwipe.html");
    } else {
      console.log("Authenticate: password check failed.");
      res.writeHead(302, { 'Location': `http://localhost:3000/mentoidLogin.html?passwordIncorrect=true&attemptedLogin=${req.body.username}`, });
      res.end();
    }

  });
  connection.end();
});

// currently gets ALL mentors, we need to eventually change this to only retrieve the mentors the user "matched" with
// TODO: only show people that do not have the client in their Skips
// TODO: only show people that the client does NOT have in their Matches
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

    let desiredType = "mentee";

    if (req.session.profileType == "mentee") {
      desiredType = "mentor";
    }

    // WHERE interests ???
    connection.query(`SELECT * FROM ${desiredType}sTable`, function (err, results) {
      if (err) throw err.code;

      res.send(results);

    });

    connection.end();

  } else {
    console.log("Authenticate: user is not logged in.")
    res.send("You're not logged in.")
  }

});

app.get('/getuser', (req, res) => {

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

    let desiredType = "mentee";
    
    if (req.session.profileType == "mentee") {
      desiredType = "mentor";
    }

    // WHERE interests ???
    connection.query(`SELECT * FROM ${desiredType}sTable WHERE ${desiredType}Username = '${req.body.username}'`, function (err, results) {
      if (err) throw err.code;

      res.send(results);

    });

    connection.end();

  } else {
    console.log("Authenticate: user is not logged in.")
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

// a user swiped left.
app.post('/swipeLeft', (req, res) => {

  let matchType = "mentor";
  let clientSkips = "";
  let targetSkips = "";

  if (req.session.profileType == "mentor") {
    matchType = "mentee";
  }

  const connection = mysql.createConnection({
    host: '107.180.1.16',
    user: 'springog2022team',
    password: 'springog2022team4',
    database: 'springog2022team4',
    port: 3306
  });

  connection.connect();

  // get the current skips of the client
  connection.query(`SELECT Skips FROM ${req.session.profileType}sTable WHERE ${req.session.profileType}username = '${req.body.username}';`, function (err, results) {
    if (err) throw err.code;
    clientSkips = results[0].Skips;
  });

  // get the current skips of the target
  connection.query(`SELECT Skips FROM ${matchType}sTable WHERE ${matchType}username = '${req.body.match}';`, function (err, results) {
    if (err) throw err.code;
    targetSkips = results[0].Skips;
  });

  // first, skip the target for the client so this person won't be shown again
  if (!clientSkips.includes(req.body.match)) {
    clientSkips += `'${req.body.match}', `;
    connection.query(`UPDATE ${req.session.profileType}sTable SET Skips = '${clientSkips}' WHERE mentorUsername = '${req.body.username}';`, function (err, results) {
      if (err) throw err.code;
    });
  }

  // next, skip the client for the target so it won't show them
  if (!targetSkips.includes(req.body.username)) {
    targetSkips += `'${req.body.username}', `;
    connection.query(`UPDATE ${matchType}sTable SET Skips = '${targetSkips}' WHERE mentorUsername = '${req.body.match}';`, function (err, results) {
      if (err) throw err.code;
    });
  }

  connection.end();

});

// a user swiped right.
app.post('/swipeRight', (req, res) => {

  let matchType = "mentor";
  let clientMatches = "";
  let targetMatches = "";

  if (req.session.profileType == "mentor") {
    matchType = "mentee";
  }

  const connection = mysql.createConnection({
    host: '107.180.1.16',
    user: 'springog2022team',
    password: 'springog2022team4',
    database: 'springog2022team4',
    port: 3306
  });

  connection.connect();

  // get the current matches of the client
  connection.query(`SELECT Matches FROM ${req.session.profileType}sTable WHERE ${req.session.profileType}username = '${req.body.username}';`, function (err, results) {
    if (err) throw err.code;
    clientMatches = results[0].Matches;
  });

  // get the current matches of the target
  connection.query(`SELECT Matches FROM ${matchType}sTable WHERE ${matchType}username = '${req.body.match}';`, function (err, results) {
    if (err) throw err.code;
    targetMatches = results[0].Matches;
  });

  // first, match the target for the client
  if (!clientMatches.includes(req.body.match)) {
    clientMatches += `'${req.body.match}', `;
    connection.query(`UPDATE ${req.session.profileType}sTable SET Matches = '${clientMatches}' WHERE mentorUsername = '${req.body.username}';`, function (err, results) {
      if (err) throw err.code;
    });
  }

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
  console.log(`getUsername: profileType is ${req.session.profileType}`)

  let values = { username: "tom", profileType: "jim" };
  values.profileType = req.session.profileType;
  values.username = req.session.username;
  res.json(values);

});

// create a new mentor's profile in the database
// upload.single('img') uploads the file input with the name 'img' to the /profile_pictures directory on the webserver (multer)
app.post('/makenewprofile', upload.single('img'), async (req, res) => {

  let interestsString = "";
  if (req.body.interest1 != undefined) {
    interestsString += "accounting, "
  }
  if (req.body.interest2 != undefined) {
    interestsString += "entrepreneurship, "
  }
  if (req.body.interest3 != undefined) {
    interestsString += "businessStrategy, "
  }
  if (req.body.interest4 != undefined) {
    interestsString += "informationSystems, "
  }
  if (req.body.interest5 != undefined) {
    interestsString += "humanResources, "
  }
  if (req.body.interest6 != undefined) {
    interestsString += "talentAcquisition, "
  }
  if (req.body.interest7 != undefined) {
    interestsString += "performanceManagement, "
  }
  if (req.body.interest8 != undefined) {
    interestsString += "supplyChain, "
  }
  if (req.body.interest9 != undefined) {
    interestsString += "marketing"
  }

  const connection = mysql.createConnection({
    host: '107.180.1.16',
    user: 'springog2022team',
    password: 'springog2022team4',
    database: 'springog2022team4',
    port: 3306
  });

  connection.connect();

  connection.query(`INSERT INTO ${req.body.profileType} VALUES ('${req.body.username}','${req.body.fname}', '${req.body.lname}', '${req.body.password}', '${req.body.email}', '${interestsString}', '${req.body.description}', '${req.file.filename}', '');`, (err) => {
    if (err) throw err.code;

    connection.end();
  });

  // redirect after creation of the account
  res.writeHead(302, { 'Location': 'http://localhost:3000/mentoidLogin.html', });
  res.end();

});

// don't mess with this
app.listen(port, () => {
  console.log(`Mentoid app listening on port ${port}. Visit http://localhost:${port}/`);
});
