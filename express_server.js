'use strict';
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "tw293q": "http://www.twitter.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
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
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"],
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

app.get("/urls/:id", (req, res) => {   //There's PROBABLY a problem here
  res.render("urls_show", {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    updatedURL: req.params.id,
    username: req.cookies["username"],
  });
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/");
});

const generateRandomString = function() {
  let randomString = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(var i = 0; i < 6; i++ ){
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomString;
};
