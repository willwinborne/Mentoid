// MENTOID CHAT dual page prototype
// written by William Winborne (wwinborn)

// stores client information
let clientUsername = "";
let clientProfileType = "";

// chat selection
let activeChat = "";
let lastChatLength = 0;
let chats = [];

const matches = document.getElementById("matchesDiv");
const messages = document.getElementById("messagesDiv");
const chat = document.getElementById("chat");
const chatWithLabel = document.getElementById("chatWith");

// Get the input field
var input = document.getElementById("chatEntry");

input.addEventListener("keyup", function (event) {
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
async function fetchMatches() {
    await getUsername();
    let response = await fetch('http://localhost:3000/getmatches');
    if (response.status === 200) {
        let data = await response.json();
        data.forEach(data => loadMatch(data));
    }
}

// for each match, draw a div with the name of the match
function loadMatch(data) {
    
    const div = document.createElement("div");

    div.setAttribute("class", "div");

    const username = document.createElement("p");
    console.log(clientProfileType)
    if (clientProfileType == "mentor") {
        username.innerHTML = `${data.menteeUsername}`;
        div.onclick = function () { chatWith(`${data.menteeUsername}`); };
        div.setAttribute("id", `${data.menteeUsername}Div`);

    } else {
        username.innerHTML = `${data.mentorUsername}`;
        div.onclick = function () { chatWith(`${data.mentorUsername}`); };
        div.setAttribute("id", `${data.mentorUsername}Div`);
    }
    
    div.appendChild(username);

    matches.appendChild(div);
}

// get the username of the current session from the server
async function getUsername() {
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

// send the chat to the database
async function sendChat() {
    if (input.value != "") {
        const data = { chat: `${input.value}`, client: `${clientUsername}`, target: `${activeChat}` };
        // send the chat to the database chat table
        const response = await fetch("http://localhost:3000/sendChat", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
            // handle the DOM based on the server's response
            .then(response => response.json()).then(data => {
    
            });
    }
    input.value = "";
}

// change the active chat
function chatWith(user) {

    messages.innerHTML = "";
    lastChatLength = 0;

    if (activeChat != "") {
        const oldButtonReference = document.getElementById(`${activeChat}Div`);
        oldButtonReference.style.color = "#1b1e3f";
        oldButtonReference.style.backgroundColor = "#3F72AF"
    }
    const buttonReference = document.getElementById(`${user}Div`);
    buttonReference.style.color = "white";
    buttonReference.style.backgroundColor = "#1b1e3f"
    activeChat = user;
    chatWithLabel.innerHTML = `Chat with ${activeChat}`
    console.log(`chatting with ${activeChat}`);
}

// refresh chats every 1 second
var intervalId = window.setInterval(function () { getChats(); }, 1000);

// get the applicable chats from the server
async function getChats() {
    chats = [];
    if (clientUsername != "" && clientUsername != undefined && activeChat != "") {
        // get the current username
        let response = await fetch(`http://localhost:3000/getChats?activeChat=${activeChat}`);
        if (response.status === 200) {
            let data = await response.json();
            data.forEach(data => chats.push(data));
            drawChats();
        }
    }
}

// draw all retrieved chats in the window
function drawChats() {
    if (chats.length != lastChatLength) {
        for (i = lastChatLength; i < chats.length; i++) {
            const container = document.createElement("div");
            container.setAttribute("class", "containerClass");
            const div = document.createElement("div");
            div.setAttribute("class", "div");
            const content = document.createElement("p");

            if (chats[i].SenderUsername == clientUsername) {
                content.innerHTML = `${chats[i].Content}`;
                div.setAttribute("class", "senderChat");

            } else {
                content.innerHTML = `${chats[i].Content}`;
                div.setAttribute("class", "recieverChat");
            }

            div.appendChild(content);
            container.appendChild(div);
            messages.appendChild(container);
            lastChatLength = chats.length;
        }
    }
}