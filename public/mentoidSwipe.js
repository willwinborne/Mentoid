const profile = document.getElementById("currentProfileID");
const nextProfile = document.getElementById("nextProfileID");
const buttonDiv = document.getElementById("buttonDiv");
const profileInfoDiv = document.getElementById("profileInfoDiv");
// set the time the swipe animation takes
profile.style.animationDuration = "1s";

// variables to edit the current profile
const currentFName = document.getElementById("currentFName");
const currentUsername = document.getElementById("currentUsername");
const currentInterests = document.getElementById("currentInterests");
const currentDescription = document.getElementById("currentDescription");
const currentProfilePicture = document.getElementById("currentProfilePicture");
const profilePicOverlay = document.getElementById("profilePicDiv");
const match = document.getElementById("match");
const noMatches = document.getElementById("noMatches");
// variables to edit the next profile
const nextProfilePicture = document.getElementById("nextProfilePicture");

// an array to hold all possible mentors this person matched with and an index
let mentors = [];
let mentorIndex = 1;

let clientUsername = "";
let clientProfileType = "";

function start() {
    fetchMentors();
    getUsername();

}

// remove the top profile, then re-draw the "next profile" as the top profile, 
// and bring in the next person to fill the new "next profile."
// do not trigger a "match"
function swipeLeft() {
    sendLeftSwipe();
    if (profile.style.animationName != "left") {
        profile.style.animationName = "left";
    } else {
        profile.style.animation = "none";
        // trigger DOM reflow (idk, it works)
        void profile.offsetWidth;
        profile.style.animation = "left 1s";
    }
    drawCurrentProfile(mentors[mentorIndex - 1]);
    drawNextProfile(mentors[mentorIndex - 2]);
}

// remove the top profile, then re-draw the "next profile" as the top profile, 
// and bring in the next person to fill the new "next profile."
// trigger a "match" 
function swipeRight() {
    sendRightSwipe();
    if (profile.style.animationName != "right") {
        profile.style.animationName = "right";
    } else {
        profile.style.animation = "none";
        // trigger DOM reflow (idk, it works)
        void profile.offsetWidth;
        profile.style.animation = "right 1s";
    }
    drawCurrentProfile(mentors[mentorIndex - 1]);
    drawNextProfile(mentors[mentorIndex - 2]);
}

// a function that will ask for, then wait for the database to return all applicable matches
// the function also stores them in the mentors array declared above
async function fetchMentors() {
    let response = await fetch('http://localhost:3000/getmentors');
    if (response.status === 200) {
        let data = await response.json();
        if (data[0] == undefined) {
            noMatches.style.display = "block";
            return;
        } else {
            data.forEach(data => mentors.push(data));
            profile.style.visibility = "visible";
            profileInfoDiv.style.visibility = "visible";
            buttonDiv.style.visibility = "visible";
            nextProfile.style.visibility = "visible";
        }
        
    }
    // hardcode: draw the first two available profiles
    drawCurrentProfile(mentors[0]);
    drawNextProfile(mentors[0]);
}

// draw the current profile "top of stack" as the provided mentor 
function drawCurrentProfile(mentor) {
    currentFName.innerHTML = `${mentor.FName} ${mentor.LName}`;
    if (clientProfileType == "mentor") {
        currentUsername.innerHTML = mentor.menteeUsername;
    } else {
        currentUsername.innerHTML = mentor.mentorUsername;
    }
    currentInterests.innerHTML = mentor.Interests;
    currentDescription.innerHTML = mentor.Description;
    profile.style.backgroundImage = `url(${mentor.profilePictureID})`;
    mentorIndex++;
}

// draw the next profile "second card" as the provided mentor 
function drawNextProfile(mentor) {
    nextProfile.style.backgroundImage = `url(${mentor.profilePictureID})`;
}

// get the username of the current session from the server
async function getUsername() {
    console.log("getting client username from webserver.")
    // get the current username
    const response = await fetch("http://localhost:3000/getUsername", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })

        // handle the DOM based on the server's response
        .then(response => response.json()).then(data => {
            if (data.username == undefined) {
                window.location.replace("http://localhost:3000/mentoidLogin.html");
            }
            clientUsername = data.username;
            clientProfileType = data.profileType;

        });
}

async function sendLeftSwipe() {
    console.log(clientUsername);
   
    let match = currentUsername.innerHTML;
    console.log(match);
    const matchData = { match: `${match}`, username: `${clientUsername}` }

    const response = await fetch("http://localhost:3000/swipeLeft", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData),
    })
        // handle the DOM based on the server's response
        .then(response => response.json()).then(data => {
            // nothing really needs to be done here
        })
}

async function sendRightSwipe() {
    console.log(clientUsername);
   
    let match = currentUsername.innerHTML;
    console.log(match);
    const matchData = { match: `${match}`, username: `${clientUsername}` }

    const response = await fetch("http://localhost:3000/swipeRight", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData),
    })
        // handle the DOM based on the server's response
        // in this case, I am triggering the new match dialog to show 
        .then(response => response.json()).then(data => {
            console.log(data.newMatch);
            if (data.newMatch == "true") {
                newMatch(); 
                profilePicOverlay.style.backgroundImage = `url(${mentors[mentorIndex - 3].profilePictureID})`;
            }
        })
}

// property of colin cassidy
function newMatch() {
    if (match.style.visibility = 'hidden') {
        match.style.visibility = 'visible';
    }
}

// hide the match dialog when done
function hideDialog() {
    if (match.style.visibility = 'visible') {
        match.style.visibility = 'hidden';
    }
}

// next 4 methods are for button animation
function mouseDownLeft() {
    let left = document.getElementById("swipeLeft");
    left.style.backgroundColor = "white";
}

function mouseUpLeft() {
    let left = document.getElementById("swipeLeft");
    left.style.backgroundColor = "red";
}

function mouseDownRight() {
    let right = document.getElementById("swipeRight");
    right.style.backgroundColor = "white";
}

function mouseUpRight() {
    let right = document.getElementById("swipeRight");
    right.style.backgroundColor = "green";
}