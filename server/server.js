const { web, db, server } = require("./env.json");
const express = require("express");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();

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

  let response = await SyncUserWithDB(googleuser);

  res.send(response);
});

app.get("/appsettings", async (req, res) => {
  res.send({ client_id: web.client_id });
});

app.listen(server.port, () => {
  console.log(`Google sign in app listening on port ${server.port}`);
});

async function SyncUserWithDB(googleuser) {
  let user = await mongodb.db("Storage").collection("Users").findOne({
    email: googleuser.email,
  });

  if (user == null) {
    let outcome = await mongodb
      .db("Storage")
      .collection("Users")
      .insertOne(googleuser);

    if (outcome.acknowledged) {
      return {
        ...googleuser,
        _id: outcome.insertedId,
        isUpsert: true,
      };
    }
    return {
      error: "Unable to create new user using Google Sign In",
    };
  }

  return user;
}

async function VerifyGoogleUser(code) {
  try {
    const client = new OAuth2Client(
      web.client_id,
      web.client_secret,
      web.redirect_uris.join(" ")
    );

    let ticket = await client.verifyIdToken({
      idToken: code,
      audience: web.client_id,
    });
    const payload = ticket.getPayload();

    VerifyGoogleAudClientId(payload.aud);

    VerifyGoogleExpiry(payload.exp);

    return payload;
  } catch ({ message }) {
    return {
      error: message,
    };
  }
}

function VerifyGoogleAudClientId(aud) {
  if (aud === web.client_id) {
    return true;
  }
  throw new Error(
    "Google Aud client_id does not match registered client_id.  Token may not be intended for this client.  Authentication fails."
  );
}

function VerifyGoogleExpiry(epochSeconds) {
  if (Date.now() / 1000 > epochSeconds) {
    return true;
  }

  throw new Error(
    "Google token expiration date has already passed.  Authentication fails."
  );
}
