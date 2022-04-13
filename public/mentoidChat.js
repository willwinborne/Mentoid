// MENTOID CHAT homepage prototype

// stores client information
let clientUsername = "";
let clientProfileType = "";

const matches = document.getElementById("matchesDiv");
const chat = document.getElementById("chat");

// Get the input field
var input = document.getElementById("chatEntry");

input.addEventListener("keyup", function(event) {
  // Number 13 is the "Enter" key on the keyboard
  if (event.key === 'Enter') {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    document.getElementById("chatSend").click();
  }
});

// a function that will ask for, then wait for the database to return all applicable matches
// the function also stores them in the mentors array declared above
async function fetchMentors() {
    await getUsername();
    let response = await fetch('http://localhost:3000/getmatches');
    if (response.status === 200) {
        let data = await response.json();
        data.forEach(data => loadMatches(data));
    }
}

// for each match, draw a div with the name of the match
function loadMatches(data) {
    const div = document.createElement("div");
    div.setAttribute("class", "div");
    const username = document.createElement("p");
    console.log(clientProfileType)
    if (clientProfileType == "mentor") {
        username.innerHTML = `${data.menteeUsername}`;
    } else {
        username.innerHTML = `${data.mentorUsername}`;
    }
    div.appendChild(username);
    matches.appendChild(div);
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
        })
}

// send the chat to the database
async function sendChat() {
    console.log(`sending chat with value ${input.value}`)
}