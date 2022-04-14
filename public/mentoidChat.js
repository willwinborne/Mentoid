// MENTOID CHAT dual page prototype
// written by William Winborne (wwinborn)

// stores client information
let clientUsername = "";
let clientProfileType = "";

// chat selection
let activeChat = "";
let lastChatLength = 0;
let chats = [];
let drawnChats = []

let viewingProfile = false;
const profile = document.getElementById("newPostDiv");
const profilePicDiv = document.getElementById("profilePicDiv");
const nameP = document.getElementById("name");
const interests = document.getElementById("interests");
const description = document.getElementById("description");

const matches = document.getElementById("matchesDiv");
const messages = document.getElementById("messagesDiv");
const chat = document.getElementById("chat");
const chatWithLabel = document.getElementById("chatWith");
const chatSend = document.getElementById("chatSend")
const remainingCharContent = document.getElementById("remainingCharContent");

// Get the input field
var input = document.getElementById("chatEntry");

input.addEventListener("input", (event) => newPostTextAreaChanged());
function newPostTextAreaChanged() {
    remainingCharContent.innerHTML = `${input.value.length}/50`
}


input.addEventListener("keyup", function (event) {
    if (event.key === 'Enter') {
        // cancel the default action, if needed
        event.preventDefault();
        // trigger the button element with a click
        chatSend.click();
    }
});

// a function that will ask for, then wait for the database to return all applicable matches
// the function also stores them in the mentors array declared above
async function fetchMatches() {
    addDummyMessages();
    await getUsername();
    let response = await fetch('http://localhost:3000/getmatches');
    if (response.status === 200) {
        let data = await response.json();
        data.forEach(data => loadMatch(data));
    }
}

function addDummyMessages() {
    messages.setAttribute("class", "blur");
    for (let i = 0; i < 6; i++) {
        const container = document.createElement("div");
        container.setAttribute("class", "containerClass");
        const div = document.createElement("div");
        div.setAttribute("class", "div");
        const content = document.createElement("p");

        if (i % 2 == 0) {
            if (Math.random() <= 0.5) {
                content.innerHTML = `this is a test message`;
            } else {
                content.innerHTML = `so is this`;
            }
            div.setAttribute("class", "senderChat");
        } else {
            if (Math.random() <= 0.5) {
                content.innerHTML = `this is a test message`;
            } else {
                content.innerHTML = `so is this`;
            }
            div.setAttribute("class", "recieverChat");
        }

        div.appendChild(content);
        container.appendChild(div);
        messages.appendChild(container);
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
    chats = [];
    drawnChats = [];
    if (activeChat == user) {
        messages.innerHTML = "";
        addDummyMessages();
        chatWithLabel.innerHTML = `Select a chat`
        const oldButtonReference1 = document.getElementById(`${activeChat}Div`);
        oldButtonReference1.style.color = "#1b1e3f";
        oldButtonReference1.style.backgroundColor = "#3F72AF"
        activeChat = "";
        input.setAttribute("class", "blur");
        chatSend.setAttribute("class", "blur");
        return;
    }

    if (activeChat != "") {
        const oldButtonReference = document.getElementById(`${activeChat}Div`);
        oldButtonReference.style.color = "#1b1e3f";
        oldButtonReference.style.backgroundColor = "#3F72AF"
    }

    chatSend.setAttribute("class", "");
    input.setAttribute("class", "");
    messages.setAttribute("class", "");
    messages.innerHTML = "";
    lastChatLength = 0;

    activeChat = user;
    getChats();
    fetchMentor();

    const buttonReference = document.getElementById(`${user}Div`);
    buttonReference.style.color = "white";
    buttonReference.style.backgroundColor = "#1b1e3f"

    chatWithLabel.innerHTML = `Chat with ${activeChat} (click for profile)`
    console.log(`chatting with ${activeChat}`);
}

// refresh chats every 1 second
var intervalId = window.setInterval(function () { getChats(); }, 750);

// get the applicable chats from the server
async function getChats() {

    if (activeChat != "") {
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
}

// draw all retrieved chats in the window
function drawChats() {
    //console.log(chats[0].ChatID)
    if (chats.length != lastChatLength) {
        for (i = lastChatLength; i < chats.length; i++) {

            if (!drawnChats.includes(chats[i].ChatID)) {
                if (chats[i].SenderUsername == activeChat || chats[i].ReceiverUsername == activeChat) {

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
                    drawnChats.push(chats[i].ChatID);
                    div.appendChild(content);
                    container.appendChild(div);
                    messages.appendChild(container);
                    lastChatLength = chats.length;

                }
            }
        }
    }
}

function viewProfile() {
    if (viewingProfile == false && activeChat != "") {
        profile.style.visibility = "visible";
        viewingProfile = true;
    }
}

function hideProfile() {
    if (viewingProfile == true) {
        profile.style.visibility = "hidden";
        viewingProfile = false;
    }
}

function drawProfile(mentor) {
    profilePicDiv.style.backgroundImage = `url(${mentor.profilePictureID})`;
    nameP.innerHTML = `${mentor.FName} ${mentor.LName}`;
    interests.innerHTML = mentor.Interests;
    description.innerHTML = mentor.description;
}

async function fetchMentor() {
    const data = { target: `${activeChat}` }
    // get the desired user's profile
    const response = await fetch("http://localhost:3000/getSpecificClientData", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      
    })
      .then(response => response.json()).then(data => {
        drawProfile(data);
      });
  }