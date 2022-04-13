// client data
let clientUsername = "";
let clientProfileType = "";

const FNameDom = document.getElementById("fname");
const LNameDom = document.getElementById("lname");
const EmailDom = document.getElementById("email");
const UsernameDom = document.getElementById("username");
const interest1Dom = document.getElementById("interest1");
const interest2Dom = document.getElementById("interest2");
const interest3Dom = document.getElementById("interest3");
const interest4Dom = document.getElementById("interest4");
const interest5Dom = document.getElementById("interest5");
const interest6Dom = document.getElementById("interest6");
const interest7Dom = document.getElementById("interest7");
const interest8Dom = document.getElementById("interest8");
const interest9Dom = document.getElementById("interest9");
const descriptionDom = document.getElementById("description");
const updatePicture = document.getElementById("updatePicture");
const img = document.getElementById("img");


function check() {
  console.log("=checked")
  if (updatePicture.checked == true) {
    console.log("update picture is checked")
    img.style.visibility = "visible";
  } else {
    img.style.visibility = "hidden";
  }
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
      getClientData();
    });
}

async function getClientData() {
  console.log("getting client's data.")
  // get the current username
  const response = await fetch("http://localhost:3000/getClientData", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

    // handle the DOM based on the server's response
    .then(response => response.json()).then(data => {
      if (data.menteeUsername == undefined && data.mentorUsername == undefined) {

        window.location.replace("http://localhost:3000/mentoidLogin.html");
      }
      // show profile username
      if (clientProfileType == "mentee") {
        UsernameDom.innerHTML = data.menteeUsername;
      } else {
        UsernameDom.innerHTML = data.mentorUsername;
      }
      // set basic data
      FNameDom.value = data.FName;
      LNameDom.value = data.LName;
      EmailDom.value = data.Email;
      let interestsString = "";

      // set interests
      if (data.Interests.includes("accounting")) {
        interest1Dom.checked = true;
      }
      if (data.Interests.includes("entrepreneurship")) {
        interest2Dom.checked = true;
      }
      if (data.Interests.includes("businessStrategy")) {
        interest3Dom.checked = true;
      }
      if (data.Interests.includes("informationSystems")) {
        interest4Dom.checked = true;
      }
      if (data.Interests.includes("humanResources")) {
        interest5Dom.checked = true;
      }
      if (data.Interests.includes("talentAcquisition")) {
        interest6Dom.checked = true;
      }
      if (data.Interests.includes("performanceManagement")) {
        interest7Dom.checked = true;
      }
      if (data.Interests.includes("supplyChain")) {
        interest8Dom.checked = true;
      }
      if (data.Interests.includes("marketing")) {
        interest9Dom.checked = true;
      }

      descriptionDom.value = data.Description;

    });
}

