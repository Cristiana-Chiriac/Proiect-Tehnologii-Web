const express = require("express");
var cors = require("cors");
var jwt = require("jsonwebtoken");
const app = express();
var morgan = require("morgan");
const { nextTick } = require("process");
var faker = require("faker/locale/ro");
const { v4: uuidv4 } = require("uuid");
const port = process.env.PORT || 3000;

const bcrypt = require("bcrypt");
const { exists } = require("fs");
const saltRounds = 12;
const secret = "proiect";

app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
var db = require("./database");
//!!!!!!!!!!!
// app.options("*", cors());
// var allowCrossDomain = function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
//   res.header("Access-Control-Allow-Headers", "Content-Type");
//   next();
// };
// app.use(allowCrossDomain);
//!!!!!!!!!!!
var utilizatorisRouter = require("./routes/Utilizatori"); //ne trebuie
app.use("/", utilizatorisRouter); //ne trebuie

var profilRouter = require("./routes/Profil"); //ne trebuie
app.use("/", profilRouter); //ne trebuie

function beforeEnteringRoute(req, res, next) {
    console.log("I've been here first");
    next();
  }
  
  function firstCriteria(req, res, next) {
    if (req.params.variable < 5) {
      console.log("Too small");
      res.status(401).send("Too small");
    } else next();
  }
  
  function secondCriteria(req, res, next) {
    if (req.params.variable > 20) {
      console.log("Too large");
      res.status(401).send("Too large");
    } else next();
  }
  
  let middlewareArray = [firstCriteria, secondCriteria];
  
  //Check Authentification
  function checkAuthorization(req, res, next) {
    const bearerHeader = req.headers["authorization"];
  
    if (typeof bearerHeader !== "undefined") {
      const bearer = bearerHeader.split(" ");
      const bearerToken = bearer[1];
      req.token = bearerToken;
  
      jwt.verify(req.token, secret, (err, decoded) => {
        if (err) {
          if (err.expiredAt) {
            res.json({ message: "Your token expired!" });
          } else {
            res.json({ message: "Decoding error!" });
          }
        } else {
          console.log(decoded.email);
          next();
        }
      });
    } else {
      res.json({ message: "Missing token!" });
    }
  }

  //ruta GET de populare Bd
  app.get("/generateRandomData/:noOfRecords", async (req, res) => {
    let number = req.params.noOfRecords;
  
    for (let i = 0; i < number; i++) {
      let rand = Math.floor(Math.random() * 3);
      let programData;
      console.log(rand);
      switch (rand) {
        case 0:
          programData = "Sub 18 ani";
          break;
        case 1:
          programData = "Intre 18 si 25";
          break;
        case 2:
          programData = "Peste 25 de ani";
          break;
        default:
          programData = "Intre 18 si 25";
          break;
      }
      let obj = {
        name: faker.name.findName(),
        program: programData,
      };
      console.log(obj);
      const res = await db.collection("Utilizatori").add(obj);
    }
    res.send("Vrei sa introduci urmatorul numar de date random : " + number);
  });
    
  app.post("/user", async (req, res) => {
    let data = req.body;
    let emailExist = false;
  
    const userRef = db.collection("users");
    console.log(userRef);
    const snapshot = await userRef.where("email", "==", data.email).get();
    if (!snapshot.empty) {
      emailExist = true;
    }
  
    if (emailExist) {
      res.send("User already registered.");
    } else {
      bcrypt.hash(data.password, saltRounds).then(async function (hash) {
        data.password = hash;
        /*users.push(data);*/
        const user = await db.collection("users").add(data);
        console.log(`You've just register with id ${user.id}`);
        res.send("Succesfull registration");
      });
    }
  });
  
  app.post("/login", async (req, res) => {
    let data = req.body;
  
    let emailFound = false;
  
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", data.email).get();
  
    if (snapshot.empty) {
      let response = {};
      response.message = "No such email address.";
      res.json(response);
    } else {
      emailFound = true;
      snapshot.forEach((doc) => {
        bcrypt
          .compare(data.password, doc.data().password)
          .then(async function (result) {
            if (result) {
              let token = jwt.sign(
                {
                  email: doc.data().email,
                },
                secret,
                { expiresIn: 60 * 60 }
              );
  
              let response = {};
              response.token = token;
              response.message = "You have the right to access private resources";
  
              res.json(response);
            } else {
              let response = {};
              response.message = "Password missmatch";
              res.json(response);
            }
          });
      });
    }
  });
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });
  
  module.exports = app;
  module.exports = db;