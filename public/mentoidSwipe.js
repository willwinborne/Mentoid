const profile = document.getElementById("currentProfileID");
const nextProfile = document.getElementById("nextProfileID");
// set the time the swipe animation takes
profile.style.animationDuration = "1s";

// variables to edit the current profile
const currentFName = document.getElementById("currentFName");
const currentUsername = document.getElementById("currentUsername");
const currentInterests = document.getElementById("currentInterests");
const currentDescription = document.getElementById("currentDescription");
const currentProfilePicture = document.getElementById("currentProfilePicture");

// variables to edit the next profile
const nextProfilePicture = document.getElementById("nextProfilePicture");

// an array to hold all possible mentors this person matched with and an index
let mentors = [];
let mentorIndex = 1;

let clientUsername = "";

function start() {
    fetchMentors();
    getUsername();
}

// remove the top profile, then re-draw the "next profile" as the top profile, 
// and bring in the next person to fill the new "next profile."
// do not trigger a "match"
function swipeLeft() {
    sendLeftSwipe();
    console.log("swipe left");
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
    console.log("swipe right");
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

        data.forEach(data => mentors.push(data));
    }
    // hardcode: draw the first two available profiles
    // TODO: this could cause problems if there aren't two profiles to display
    drawCurrentProfile(mentors[0]);
    drawNextProfile(mentors[1]);
}

// draw the current profile "top of stack" as the provided mentor 
function drawCurrentProfile(mentor) {
    currentFName.innerHTML = `${mentor.FName} ${mentor.LName}`;
    currentUsername.innerHTML = mentor.mentorUsername;
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
            console.log(data.username);
            clientUsername = data.username;
        })
}

async function sendLeftSwipe() {
    // check if the username entered exists
    console.log(clientUsername);
    let match = currentUsername.innerHTML;
    const matchData = { match: `${match}`, username: `${clientUsername}` }

    const response = await fetch("http://localhost:3000/swipeLeft", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData),
    })
        // handle the DOM based on the server's response
        .then(response => response.json()).then(data => {
            console.log(data);
        })
}