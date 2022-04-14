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
let user = []
let userIndex = 1;

let clientUsername = "";
let clientProfileType = "";

function start() {
    getUsername();
    getUserProfile();
}

function edit() {
    window.location.href = "http://localhost:3000/mentoidEdit.html";
}

// // draw the current profile "top of stack" as the provided mentor 
// function drawCurrentProfile(clientUsername) {
    
// }

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
            clientProfileType = data.profileType;
            document.getElementById("username").innerHTML = `Hello, ${clientUsername}`;
        })     
}

async function getUserProfile() {
    let response = await fetch('http://localhost:3000/getUser');
    if (response.status === 200) {
        let data = await response.json();
        console.log(data)
        data.forEach(data => user.push(data));
        
    }

    console.log(user[0]);
    // hardcode: draw the first two available profiles
    // TODO: this could cause problems if there aren't two profiles to display
    drawCurrentProfile(user[0]);
}

function drawCurrentProfile(client) {

    console.log(client);
    currentFName.innerHTML = `${client.FName} ${client.LName}`;
    if (clientProfileType == "mentor") {
        currentUsername.innerHTML = user.menteeUsername;
    } else {
        currentUsername.innerHTML = client.mentorUsername;
    }
    currentInterests.innerHTML = client.Interests;
    currentDescription.innerHTML = client.Description;  
    profile.style.backgroundImage = `url(${client.profilePictureID})`;   
    console.log('GOT THROUGH');
}
