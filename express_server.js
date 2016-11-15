'use strict';
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const path = require('path');
const bcrypt = require("bcrypt-nodejs");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieSession({
  name: 'session',
  keys: ["totally secret stuff", "not so secret", "top-secret"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

let urlDatabase = {
  "b2xVn2": {userId: 'user2RandomID', url: "http://www.lighthouselabs.ca"},
  "9sm5xK": {userId: 'someUser', url: "http://www.google.com"},
  "tw293q": {userId: 'someone', url: "http://www.twitter.com"}
};

let usersDB = {
  "user2RandomID": {
    id: "user2RandomID",
    email: "abc@efg.com",
    password: "pass"
  }
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
  console.log(urlDatabase);
  console.log(req.session.user_id, `<-- If this says "undefined" or "null", it just means you're not logged in ;)`);
  let templateVars = {
    urls: urlDatabase,
    username: req.session.user_id,
    email: grabEmailFromId(req.session.user_id),
  };
  if (req.session.user_id) {
    res.render("urls_index", templateVars);
  }else{
    res.status(401);
    res.render("noUserError");
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.session.user_id,
    email: grabEmailFromId(req.session.user_id)
  };
  res.render("urls_new", templateVars);
});

app.post("/urls/create", (req, res) => {
  let shortURL = generateRandomString();
  const data = {
    url: req.body.longURL,
    userId: req.session.user_id
  };
  urlDatabase[shortURL] = data;
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params['shortURL'];
  let longURL = urlDatabase[shortURL].url;
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  console.log("short url is", req.params.id);
  console.log("long url is", urlDatabase[req.params.id]);
  res.render("urls_show", {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    updatedURL: req.params.id,
    email: grabEmailFromId(req.session.user_id)
  });
});

app.post("/urls/:id", (req, res) => {

  urlDatabase[req.params.id].url = req.body.longURL;
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  res.render('login');
});

app.post("/login", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).end("Enter a valid email & password, you swine!");
  } else if (!checkIfUserExists(req.body.email, req.body.password)){
    res.status(400).end("This user doesn't exist, you scoundrel!")
  }
  let userId = grabIdFromEmail(req.body.email);
  req.session.user_id = userId;
  res.redirect("/");
});

app.post("/logout", (req, res) => {
  req.session = null;
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
    res.status(400).end("Halt! This email has been registered already!")
  }

  req.session.user_id = userID;
  console.log("id: " + userID + "\nemail: " + email + "\npassword: " + password);

  usersDB[userID] = {
    id: userID,
    email: email,
    password: password
  };

  res.redirect("/urls");
});
