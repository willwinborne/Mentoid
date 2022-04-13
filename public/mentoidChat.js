
let clientUsername = "";
let clientProfileType = "";

// a function that will ask for, then wait for the database to return all applicable matches
// the function also stores them in the mentors array declared above
async function fetchMentors() {
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
    if (clientProfileType == "mentor") {
        username.innerHTML = `${data.menteeUsername}`;
    } else {
        username.innerHTML = `${data.mentorUsername}`;
    }
    div.appendChild(username);
    document.body.appendChild(div);
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
            clientUsername = data.username;
            clientProfileType = data.profileType;
        })
}