'use strict';
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

const bcrypt = require("bcrypt-nodejs");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "tw293q": "http://www.twitter.com"
};

let usersDB = {
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "pass"
  } //NOTE: Here is the users database. This It how it looks:
};

const generateRandomString = function() {
  let randomString = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomString;
};

const grabIdFromEmail = (userEmail) => {
  for (let user in usersDB) {
    if (usersDB[user].email === userEmail) {
      return usersDB[user].id;
    }
  }
};

const grabEmailFromId = (userID) => {
  for (let user in usersDB) {
    if (usersDB[user].id === userID) {
      return usersDB[user].email;
    }
  }
};

const checkIfUserExists = (userEmail, userPassword) => {
  for (let user in usersDB){
    if(usersDB[user].email === userEmail){
      if(bcrypt.compareSync(userPassword, usersDB[user].password)){ //inherent bcrypt function, checks if two things are the same
      // if(usersDB[user].password === userPassword)
        return true;
      }
    }
  }
  return false;
};

const checkIfEmailsAreDuplicates = (userEmail) => {
  for (let user in usersDB) {
    if (usersDB[user].email === userEmail) {
      return true;
    }
  }
  return false;
};

// const checkForDuplicateEmails2 = (data, userEmail) => {
//   for (let user in data){
//     if(data.hasOwnProperty(user) && data[user].email === userEmail) {
//       return user;
//     }
//   }
//   return null;
// };
//NOTE: checkIfEmailsAreDuplicates(usersDB, ) <- definitely first parameter is going to be usersDB first

app.get("/", (req, res) => {
  // res.end("Hello!");
  res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  console.log(req.cookies, "(If it says undefined it just means you're not logged in ;) )")
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["user_id"], //NOTE: changed from "username" to "user_id"
    email: grabEmailFromId(req.cookies.user_id),  //"abc@efg.com"
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["user_id"], //NOTE: changed from "username" to "user_id"
    email: grabEmailFromId(req.cookies.user_id)
  };
  res.render("urls_new", templateVars);
});

app.post("/urls/create", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params['shortURL'];
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  res.render("urls_show", {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    updatedURL: req.params.id,
    email: grabEmailFromId(req.cookies.user_id) //"abc@efg.com"
  });
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  res.render('login');
});

app.post("/login", (req, res) => { //for UPDATE THE LOGIN HANDLER
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).end("Please enter a valid email & password");
  } else if (!checkIfUserExists(req.body.email, req.body.password)){
    res.status(400).end("This user doesn't exists, you scoundrel!")
  }
  //NOTE:use bcrypt here~~~~~~~
  let userId = grabIdFromEmail(req.body.email);
  res.cookie('user_id', userId);

  res.redirect("/");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("registration")
});

app.post("/register", (req, res) => {
  const password = bcrypt.hashSync(req.body.password);
  const email = req.body.email;
  const userID = generateRandomString();

  if (password === "" || email === "") {
    res.status(400).end("Please enter a valid email & password");
  } else if (checkIfEmailsAreDuplicates(email)) {
    res.status(400).end("This email been registered already")
  }

  res.cookie("user_id", userID);

  console.log("id: " + userID + "\nemail: " + email + "\npassword: " + password);

  usersDB[userID] = {
    id: userID,
    email: email,
    password: password
  };

  res.redirect("/urls");
});
