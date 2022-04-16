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

// TODO: only show people whose interests match the client's
// login is required for this. 
app.get('/getmentors', (req, res) => {

  //check if this user is logged in (standard for most functions!)
  if (req.session.loggedIn) {

    exclusionQuery = ";";
    potentialMatches = [];

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

    // first, get all potential matches (meaning, people who have swiped right on us)
    connection.query(`SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.session.username}' AND ${desiredType}Swipe = '1' AND ${req.session.profileType}Swipe = '0'`, function (err, results) {
      if (err) throw err.code;
      if (results.length > 0) {
        for (let i = 0; i < results.length; i++) {
          if (desiredType == "mentor") {
            potentialMatches.push(results[i].mentorUsername)
            // console.log(`found a potential match for ${req.session.username}: ${results[i].mentorUsername}`);
          } else {
            potentialMatches.push(results[i].menteeUsername)
            // console.log(`found a potential match for ${req.session.username}: ${results[i].menteeUsername}`);
          }
        }
      }
    });

    // exclude everyone who has skipped or already fully matched with us
    connection.query(`SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.session.username}'`, function (err, results) {
      if (err) throw err.code;
      if (results.length > 0) {
        // generate SQL query string to exclude everyone user has matched with, or has skipped them
        // must make an exception for potential matches (meaning, clientSwipe = '0' AND targetSwipe = '1')
        for (let i = 0; i < results.length; i++) {
          if (desiredType == "mentee" && potentialMatches.includes(results[i].menteeUsername)) {
            // console.log(`found potential match: ${results[i].menteeUsername}. continuing`)
            continue;
          }
          if (desiredType == "mentor" && potentialMatches.includes(results[i].mentorUsername)) {
            // console.log(`found potential match: ${results[i].mentorUsername}. continuing`)
            continue;
          }
          // this code is unreachable if continued. will only happen if there are profiles that actually need to be excluded
          exclusionQuery = " WHERE ";
          if (desiredType == "mentee") {
            if (i == results.length - 1) {
              exclusionQuery += `${desiredType}Username != '${results[i].menteeUsername}';`
            } else {
              exclusionQuery += `${desiredType}Username != '${results[i].menteeUsername}' AND `
            }
          } else {
            if (i == results.length - 1 && !potentialMatches.includes(results[i].menteeUsername)) {
              exclusionQuery += `${desiredType}Username != '${results[i].mentorUsername}';`
            } else {
              exclusionQuery += `${desiredType}Username != '${results[i].mentorUsername}' AND `
            }
          }
          console.log(exclusionQuery);
        }
        // final query with exclusions and potential matches
        connection.query(`SELECT * FROM ${desiredType}sTable${exclusionQuery}`, function (err, results) {
          if (err) throw err.code;
          res.send(results);
        });
      } else {
        // this else means there were no matches, so just pull everyone
        connection.query(`SELECT * FROM ${desiredType}sTable`, function (err, results) {
          if (err) throw err.code;
          res.send(results);

        });
      }
      connection.end();
    });

  } else {
    console.log("user is not logged in")
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

  console.log(`${req.body.username} swiped left on ${req.body.match}!`)
  let matchType = "mentor";

  if (req.session.profileType == "mentor") {
    matchType = "mentee";
  }

  const connection = mysql.createConnection({
    host: '107.180.1.16',
    user: 'springog2022team',
    password: 'springog2022team4',
    database: 'springog2022team4',
    port: 3306,
  });

  connection.connect();

  // first, try to find a match for this client and this target
  connection.query(`SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.body.username}' AND ${matchType}Username = '${req.body.match}'`, function (err, results) {
    if (err) throw err.code;
    // if a match is not found,
    if (results[0] == undefined) {
      console.log("no match found. creating one with the client swipe as 0, target swipe as null.")
      // create one with the client having swiped on the target, but the target swipe is still zero
      if (matchType == "mentee") {
        connection.query(`INSERT INTO matchingTable (mentorUsername, menteeUsername, mentorSwipe, menteeSwipe) VALUES ('${req.body.username}', '${req.body.match}', '0', '')`, function (err, results) {
          if (err) throw err.code;
        });
      } else {
        connection.query(`INSERT INTO matchingTable (menteeUsername, mentorUsername, mentorSwipe, menteeSwipe) VALUES ('${req.body.username}', '${req.body.match}', '', '0')`, function (err, results) {
          if (err) throw err.code;
        });
      }

    }
    // if we DO find a match, & target has already matched,set both swipes to 0
    if (matchType == "mentee" && results[0] != undefined && results[0].menteeSwipe == 1) {
      console.log("found a match, the target has already swiped. Updated match for client and target swipe as 0.");
      connection.query(`UPDATE matchingTable SET mentorSwipe = '0', menteeSwipe = '0' WHERE mentorUsername = '${req.body.username}' AND menteeUsername = '${req.body.match}'`, function (err, results) {
      });
      res.json({ newMatch: 'false' });
    }

    if (matchType == "mentor" && results[0] != undefined && results[0].mentorSwipe == 1) {
      console.log("found a match, the target has already swiped. Updated match for client and target swipe as 0.");
      connection.query(`UPDATE matchingTable SET mentorSwipe = '0', menteeSwipe = '0' WHERE mentorUsername = '${req.body.match}' AND menteeUsername = '${req.body.username}'`, function (err, results) {
      });
      res.json({ newMatch: 'false' });
    }
    connection.end();
  });

});

// a user swiped right.
app.post('/swipeRight', async (req, res) => {

  console.log(`${req.body.username} swiped right on ${req.body.match}!`)
  let matchType = "mentor";

  if (req.session.profileType == "mentor") {
    matchType = "mentee";
  }

  const connection = mysql.createConnection({
    host: '107.180.1.16',
    user: 'springog2022team',
    password: 'springog2022team4',
    database: 'springog2022team4',
    port: 3306,
  });

  connection.connect();

  // first, try to find a match for this client and this target
  connection.query(`SELECT * FROM matchingTable WHERE ${req.session.profileType}Username = '${req.body.username}' AND ${matchType}Username = '${req.body.match}'`, function (err, results) {
    if (err) throw err.code;
    // if a match is not found,
    if (results[0] == undefined) {
      console.log("no match found. creating one with the client swipe as 1, target swipe as 0.")
      // create one with the client having swiped on the target, but the target swipe is still zero
      if (matchType == "mentee") {
        connection.query(`INSERT INTO matchingTable (mentorUsername, menteeUsername, mentorSwipe, menteeSwipe) VALUES ('${req.body.username}', '${req.body.match}', '1', '')`, function (err, results) {
          if (err) throw err.code;
        });
      } else {
        connection.query(`INSERT INTO matchingTable (menteeUsername, mentorUsername, mentorSwipe, menteeSwipe) VALUES ('${req.body.username}', '${req.body.match}', '', '1')`, function (err, results) {
          if (err) throw err.code;
        });
      }

    }
    // if we DO find a match, & target has already matched, give the user feedback and set both swipes to 1
    if (matchType == "mentee" && results[0] != undefined && results[0].menteeSwipe == 1) {
      console.log("found a match, the target has already swiped. Updated match for client and target swipe as 1.");
      connection.query(`UPDATE matchingTable SET mentorSwipe = '1', menteeSwipe = '1' WHERE mentorUsername = '${req.body.username}' AND menteeUsername = '${req.body.match}'`, function (err, results) {
      });
      res.json({ newMatch: 'true' });
    }

    if (matchType == "mentor" && results[0] != undefined && results[0].mentorSwipe == 1) {
      console.log("found a match, the target has already swiped. Updated match for client and target swipe as 1.");
      connection.query(`UPDATE matchingTable SET mentorSwipe = '1', menteeSwipe = '1' WHERE mentorUsername = '${req.body.match}' AND menteeUsername = '${req.body.username}'`, function (err, results) {
      });
      res.json({ newMatch: 'true' });
    }
    connection.end();
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
