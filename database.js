const {
    initializeApp,
    applicationDefault,
    cert,
} = require("firebase-admin/app");
const {
    getFirestore,
    Timestamp,
    FieldValue,
} = require("firebase-admin/firestore");

const serviceAccount = require("./KEY.json");

initializeApp({
    credential: cert(serviceAccount),
});

const db = getFirestore(); //this is the reference to the database

module.exports = db;



