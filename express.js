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
const path = require('path');
const { redirect } = require('express/lib/response');
const app = express();
const port = 3000;
// middleware init
app.use(express.json());
app.use(session({ secret: 'cis440group4project2', name: 'uniqueSessionID', resave: false, saveUninitialized: false }))

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

  req.session.profileType = "mentor";

  const options = { connectionLimit: 2, user: 'springog2022team', password: 'springog2022team4', database: 'springog2022team4', host: '107.180.1.16', port: 3306 }
  const pool = mysql.createPool(options);

  // pool.on('release', function (connection) {
  //   console.log(" it's okay if authenticate doesn't release two connections");
  //   console.log('authenticate: connection %d released (2)', connection.threadId);
  // });

  // try to find the account as a mentor first
  pool.query(`SELECT Password from mentorsTable WHERE mentorUsername ='${req.body.username}'`, function (err, results) {
    if (err) throw err.code;
    try {
      if (results[0].Password == req.body.password) {
        req.session.profileType = "mentor";
        res.locals.username = req.body.username;
        req.session.loggedIn = true;
        req.session.username = res.locals.username;
        res.redirect("http://localhost:3000/mentoidSwipe.html");
      } else {
        res.writeHead(302, { 'Location': `http://localhost:3000/mentoidLogin.html?passwordIncorrect=true&attemptedLogin=${req.body.username}`, });
        res.end();
      }
      // this will happen if the account is not found as a mentor
    } catch (TypeError) {
      pool.query(`SELECT Password from menteesTable WHERE menteeUsername ='${req.body.username}'`, function (err, results) {
        if (err) throw err.code;
        try {
          if (results[0].Password == req.body.password) {
            req.session.profileType = "mentee";
            res.locals.username = req.body.username;
            req.session.loggedIn = true;
            req.session.username = res.locals.username;
            res.redirect("http://localhost:3000/mentoidSwipe.html");
          } else {
            res.writeHead(302, { 'Location': `http://localhost:3000/mentoidLogin.html?passwordIncorrect=true&attemptedLogin=${req.body.username}`, });
            res.end();
          }
        } catch (TypeError) {
          res.writeHead(302, { 'Location': `http://localhost:3000/mentoidLogin.html?noUsername=true&attemptedLogin=${req.body.username}`, });
          res.end();
        }
      });
    }
  });
});

// TODO: only show people whose interests match the client's
// login is required for this. 
app.get('/getmentors', (req, res) => {

  let exclusionQuery = "";
  let exclusion = [];
  let desiredType = "mentee";
  const options = { connectionLimit: 4, user: 'springog2022team', password: 'springog2022team4', database: 'springog2022team4', host: '107.180.1.16', port: 3306 }
  const pool = mysql.createPool(options);

  //check if this user is logged in (standard for most functions!)
  if (req.session.loggedIn) {

    // pool.on('release', function (connection) {
    //   console.log('getMentors: connection %d released (4)', connection.threadId);
    // });

    if (req.session.profileType == "mentee") {
      desiredType = "mentor";
    }

    let skipExclusions = 0;
    let potentialMatches = 0;
    let actualMatches = 0;

    console.log();
    console.log("-------------------------------MAIN QUERY-----------------------------------");
    console.log("Skips are when desired type swipe is 0 OR client type swipe is 0");
    console.log("Potential matches are when desired type swipe is NULL AND client type swipe is 1");
    console.log("Actual matches are when desired type swipe is 1 AND client type swipe is 1");
    console.log("----------------------------------------------------------------------------");

    // first, get all skips (people who have swiped left on us, OR people we have swiped left on)
    //console.log(`SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.session.username}' AND ${desiredType}Swipe = '0' OR ${req.session.profileType}Username = '${req.session.username}' AND ${req.session.profileType}Swipe = '0';`)
    pool.query(`SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.session.username}' AND ${desiredType}Swipe = '0' OR ${req.session.profileType}Username = '${req.session.username}' AND ${req.session.profileType}Swipe = '0';`, function (err, results) {
      if (err) throw err.code;
      if (results.length > 0) {
        for (let i = 0; i < results.length; i++) {
          if (desiredType == "mentor") {
            exclusion.push(results[i].mentorUsername);
            skipExclusions++;
          } else {
            exclusion.push(results[i].menteeUsername);
            skipExclusions++;
          }
        }
      }

      // get all potential matches (client has already swiped right, waiting on target)
      //console.log(`SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.session.username}' AND ${desiredType}Swipe IS NULL AND ${req.session.profileType}Swipe = '1'`)
      pool.query(`SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.session.username}' AND ${desiredType}Swipe IS NULL AND ${req.session.profileType}Swipe = '1'`, function (err, results) {
        if (err) throw err.code;
        if (results.length > 0) {
          for (let i = 0; i < results.length; i++) {
            if (desiredType == "mentor") {
              if (!exclusion.includes(results[i].mentorUsername)) {
                exclusion.push(results[i].mentorUsername);
                potentialMatches++;
              }
            } else {
              if (!exclusion.includes(results[i].menteeUsername)) {
                exclusion.push(results[i].menteeUsername);
                potentialMatches++;
              }
            }
          }
        }

        // next, get all actual matches (we have swiped right on each other)
        //console.log(`SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.session.username}' AND ${desiredType}Swipe = '1' AND ${req.session.profileType}Swipe = '1'`)
        pool.query(`SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.session.username}' AND ${desiredType}Swipe = '1' AND ${req.session.profileType}Swipe = '1'`, function (err, results) {
          if (err) throw err.code;
          if (results.length > 0) {
            for (let i = 0; i < results.length; i++) {
              if (desiredType == "mentor") {
                if (!exclusion.includes(results[i].mentorUsername)) {
                  exclusion.push(results[i].mentorUsername)
                  actualMatches++;
                }
              } else {
                if (!exclusion.includes(results[i].menteeUsername)) {
                  exclusion.push(results[i].menteeUsername);
                  actualMatches++;
                }
              }
            }
          }

          console.log(`           skip exclusions: ${skipExclusions}` );
          console.log(`potential match exclusions: ${potentialMatches}`);
          console.log(`   actual match exclusions: ${actualMatches}`); 
          console.log(`          total exclusions: ${exclusion.length}`);

          // then, get all mentors minus the ones we have matched with, ones we skipped, or ones that skipped us
          if (exclusion.length > 0) {
            exclusionQuery = " WHERE ";
          }
          // generate WHERE clause of the query to skip all excluded people
          for (let i = 0; i < exclusion.length; i++) {
            if (desiredType == "mentee") {
              if (i == exclusion.length - 1) {
                exclusionQuery += `${desiredType}Username != '${exclusion[i]}';`
              } else {
                exclusionQuery += `${desiredType}Username != '${exclusion[i]}' AND `
              }
            } else {
              if (i == exclusion.length - 1) {
                exclusionQuery += `${desiredType}Username != '${exclusion[i]}';`
              } else {
                exclusionQuery += `${desiredType}Username != '${exclusion[i]}' AND `
              }
            }
          }

          // run query with WHERE clause
          //console.log(`final query: SELECT * FROM ${desiredType}sTable${exclusionQuery}`);
          pool.query(`SELECT * FROM ${desiredType}sTable${exclusionQuery}`, function (err, results) {
            if (err) throw err.code;
            console.log("----------------------------------------------------------------------------");
            console.log(`Main query found ${results.length} possible matche(s) for ${req.session.username}`);
            console.log("----------------------------------------------------------------------------");
            console.log();
            res.send(results);
          });
        });
      });
    });

  } else {
    console.log("user is not logged in");
  }
});

app.get('/getUser', (req, res) => {

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
    console.log(`SELECT * FROM ${req.session.profileType}sTable WHERE ${req.session.profileType}Username = '${req.session.username}'`)
    connection.query(`SELECT * FROM ${req.session.profileType}sTable WHERE ${req.session.profileType}Username = '${req.session.username}'`, function (err, results) {
      if (err) throw err.code;

      res.json(results);

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
  connection.query(`SELECT ${req.body.role}Username FROM ${req.body.role}sTable WHERE ${req.body.role}Username = '${req.body.username}';`, function (err, results) {
    if (err) throw err.code;
    if (typeof results[0] !== 'undefined') {
      res.json({ usernameTaken: 'true' });
    } else {
      res.json({ usernameTaken: 'false' });
    }

  });

  connection.end();

});

// send a chat to the database
app.post('/sendChat', (req, res) => {

  const connection = mysql.createConnection({
    host: '107.180.1.16',
    user: 'springog2022team',
    password: 'springog2022team4',
    database: 'springog2022team4',
    port: 3306
  });

  connection.connect();

  // check for existing usernames
  console.log(`NEW CHAT QUERY: INSERT INTO ChatTable (Content, SenderUsername, ReceiverUsername) VALUES ('${req.body.chat}', '${req.body.client}', '${req.body.target}');`)
  connection.query(`INSERT INTO ChatTable (Content, SenderUsername, ReceiverUsername) VALUES ('${req.body.chat}', '${req.body.client}', '${req.body.target}');`, function (err, results) {
    if (err) throw err.code;
    res.json({});
  });

  connection.end();
});

// send all relevant chats to the client
app.get('/getChats', (req, res) => {

  const connection = mysql.createConnection({
    host: '107.180.1.16',
    user: 'springog2022team',
    password: 'springog2022team4',
    database: 'springog2022team4',
    port: 3306
  });

  connection.connect();

  // check for existing usernames
  // console.log(`NEW CHAT QUERY: SELECT * FROM ChatTable WHERE SenderUsername = '${req.session.username}' AND ReceiverUsername = '${req.query.activeChat}' OR SenderUsername = '${req.query.activeChat}' AND ReceiverUsername = '${req.session.username}';`);
  connection.query(`SELECT * FROM ChatTable WHERE SenderUsername = '${req.session.username}' AND ReceiverUsername = '${req.query.activeChat}' OR SenderUsername = '${req.query.activeChat}' AND ReceiverUsername = '${req.session.username}';`, function (err, results) {
    if (err) throw err.code;
    res.send(results);
  });

  connection.end();
});

// a user swiped left.
app.post('/swipeLeft', (req, res) => {
  const options = { connectionLimit: 4, user: 'springog2022team', password: 'springog2022team4', database: 'springog2022team4', host: '107.180.1.16', port: 3306 }
  const pool = mysql.createPool(options);

  
  console.log();
  console.log("-----------------------------SWIPE LEFT QUERY-------------------------------");

  // insert a skip record
  if (req.session.profileType == "mentor") {
    // insert a record with mentorSwipe = 0
    console.log(`INSERT INTO matchingTable (mentorUsername, menteeUsername, mentorSwipe) VALUES ('${req.session.username}', '${req.body.match}', '0');`);
    pool.query(`INSERT INTO matchingTable (mentorUsername, menteeUsername, mentorSwipe) VALUES ('${req.session.username}', '${req.body.match}', '0');`, function (err, results) {
      if (err) throw err.code;
    });
  } else {
    // insert a record with menteeSwipe = 0
    console.log(`INSERT INTO matchingTable (mentorUsername, menteeUsername, menteeSwipe) VALUES ('${req.body.match}', '${req.session.username}', '0');`);
    pool.query(`INSERT INTO matchingTable (mentorUsername, menteeUsername, menteeSwipe) VALUES ('${req.body.match}', '${req.session.username}', '0');`, function (err, results) {
      if (err) throw err.code;
    });
  }
  console.log("----------------------------------------------------------------------------");
  console.log();
  res.end();
});

// a user swiped right.
app.post('/swipeRight', async (req, res) => {
  const options = { connectionLimit: 4, user: 'springog2022team', password: 'springog2022team4', database: 'springog2022team4', host: '107.180.1.16', port: 3306 }
  const pool = mysql.createPool(options);

  let desiredType = "mentor";

  if (req.session.profileType == "mentor") {
    desiredType = "mentee";
  }

  console.log();
  console.log("----------------------------SWIPE RIGHT QUERY-------------------------------");

  // try to get any swipe history
  console.log(`SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.session.username}' AND ${req.session.profileType}Username = '${req.body.match}' AND ${desiredType}Swipe = '1' AND ${req.session.profileType}Swipe IS NULL;`)
  pool.query(`SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.session.username}' AND ${req.session.profileType}Username = '${req.body.match}' AND ${desiredType}Swipe = '1' AND ${req.session.profileType}Swipe IS NULL;`, function (err, results) {
    if (err) throw err.code;
    try {
      if (results[0].matchID != undefined) {
        // a potential match was found. update it so the client swipe is 1 
        console.log(`UPDATE matchingTable SET ${req.session.profileType}Swipe = '1' WHERE ${req.session.profileType}Username = '${req.session.username}' AND ${desiredType}Username = '${req.body.match}';`);
        pool.query(`UPDATE matchingTable SET ${req.session.profileType}Swipe = '1' WHERE ${req.session.profileType}Username = '${req.session.username}' AND ${desiredType}Username = '${req.body.match}';`, function (err, results) {
          if (err) throw err.code;
          console.log("New match! Sending notification to client.");
          res.send({ newMatch: true });
        });
      }
    } catch (TypeError) {
      // a potential match was not found. create one with the client swipe as 1, target swipe is NULL
      console.log(`INSERT INTO matchingTable (${req.session.profileType}Swipe, ${req.session.profileType}Username, ${desiredType}Username) VALUES ('1', '${req.session.username}', '${req.body.match}');`);
      pool.query(`INSERT INTO matchingTable (${req.session.profileType}Swipe, ${req.session.profileType}Username, ${desiredType}Username) VALUES ('1', '${req.session.username}', '${req.body.match}');`, function (err, results) {
        if (err) throw err.code;
      });
    }
    console.log("----------------------------------------------------------------------------");
    console.log();
  });
});

// dynamically check for a match between two people
// TODO: do we even use this anymore?
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

// login is required for this. 
app.get('/getmatches', (req, res) => {

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

    // Select all matches for the client
    // console.log(`GETTING MATCHES: SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.session.username}' AND menteeSwipe = '1' AND mentorSwipe = '1';`)
    connection.query(`SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.session.username}' AND menteeSwipe = '1' AND mentorSwipe = '1';`, function (err, results) {
      if (err) throw err.code;

      res.send(results);

    });

    connection.end();

  } else {
    console.log("Authenticate: user is not logged in.")
    res.send("You're not logged in.")
  }

});

// return the username of the user
// not accessible without login, so no check required
app.post('/getUsername', (req, res) => {

  let values = { username: "tom", profileType: "jim" };
  values.profileType = req.session.profileType;
  values.username = req.session.username;
  res.json(values);

});

// get the client's data to pass back to the edit page
app.post('/getClientData', (req, res) => {
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

    // Send all data about the client
    connection.query(`SELECT * FROM ${req.session.profileType}sTable WHERE ${req.session.profileType}Username = '${req.session.username}';`, function (err, results) {
      if (err) throw err.code;
      let values = {};
      if (req.session.profileType == "mentee") {
        values = { menteeUsername: "", FName: "", LName: "", Password: "", Email: "", Interests: "", Description: "", profilePictureID: "" };
        values.menteeUsername = results[0].menteeUsername;
      } else {
        values = { mentorUsername: "", FName: "", LName: "", Password: "", Email: "", Interests: "", Description: "", profilePictureID: "" };
        values.mentorUsername = results[0].mentorUsername;
      }
      values.FName = results[0].FName;
      values.LName = results[0].LName;
      values.Password = results[0].Password;
      values.Email = results[0].Email;
      values.Interests = results[0].Interests
      values.Description = results[0].Description;
      values.profilePictureID = results[0].profilePictureID;
      res.json(values);

    });

    connection.end();

  } else {
    console.log("Authenticate: user is not logged in.")
    res.send("You're not logged in.")
  }

});

// get the client's data to pass back to the edit page
app.post('/getSpecificClientData', (req, res) => {
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

    // Send all data about the client
    connection.query(`SELECT * FROM ${desiredType}sTable WHERE ${desiredType}Username = '${req.body.target}';`, function (err, results) {
      if (err) throw err.code;
      let values = {};
      values.FName = results[0].FName;
      values.LName = results[0].LName;
      values.Password = results[0].Password;
      values.Email = results[0].Email;
      values.Interests = results[0].Interests
      values.Description = results[0].Description;
      values.profilePictureID = results[0].profilePictureID;
      res.json(values);

    });

    connection.end();

  } else {
    console.log("Authenticate: user is not logged in.")
    res.send("You're not logged in.")
  }

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

// edit an existing mentor's profile in the database
// upload.single('img') uploads the file input with the name 'img' to the /profile_pictures directory on the webserver (multer)
app.post('/editprofile', upload.single('img'), async (req, res) => {

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
  if (req.body.updatePicture == undefined) {

    connection.query(`UPDATE ${req.session.profileType}sTable SET FName = '${req.body.fname}', LName = '${req.body.lname}', Password = '${req.body.password}', Email = '${req.body.email}', Interests = '${interestsString}', Description = '${req.body.description}' WHERE ${req.session.profileType}Username = '${req.session.username}';`, (err) => {
      if (err) throw err.code;

      connection.end();
    });
  } else {
    connection.query(`UPDATE ${req.session.profileType}sTable SET FName = '${req.body.fname}', LName = '${req.body.lname}', Password = '${req.body.password}', Email = '${req.body.email}', Interests = '${interestsString}', Description = '${req.body.description}', profilePictureID = '${req.file.filename}' WHERE ${req.session.profileType}Username = '${req.session.username}';`, (err) => {
      if (err) throw err.code;

      connection.end();
    });
  }

  // redirect after creation of the account
  res.writeHead(302, { 'Location': 'http://localhost:3000/mentoidSwipe.html', });
  res.end();

});

// don't mess with this
app.listen(port, () => {
  console.log(`Mentoid app listening on port ${port}. Visit http://localhost:${port}/`);
});
