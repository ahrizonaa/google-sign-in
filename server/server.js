const { web, db, server } = require("./env.json");
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();

const { VerifyGoogleUser, SyncUserWithDB } = require("./lib.js");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.options("*", cors());

const mongodb = new MongoClient(db.mongodb_uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

(async () => {
  await mongodb.connect();
})();

app.post("/login/google", async (req, res) => {
  let googleuser = await VerifyGoogleUser(req.body.code);

  if (googleuser.error) {
    res.send(googleuser);
    return;
  }

  let response = await SyncUserWithDB(mongodb, googleuser);

  res.send(response);
});

app.get("/appsettings", async (req, res) => {
  res.send({ client_id: web.client_id });
});

app.listen(server.port, () => {
  console.log(`Google sign in app listening on port ${server.port}`);
});
