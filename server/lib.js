const { OAuth2Client } = require("google-auth-library");
const { web, db, server } = require("./env.json");
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

    if (IsGoogleExpired(payload.exp)) {
      RequestAccessToken();

      let url = await Refresh();

      payload = {
        tokens: tokens,
        refreshUrl: url,
        isRefresh: true,
      };
    }

    return payload;
  } catch ({ message }) {
    return {
      error: message,
    };
  }
}

async function Refresh() {
  const refreshUrl = await client.generateAuthUrl({
    access_type: "offline",
    scope: "https://www.googleapis.com/auth/userinfo.profile",
    prompt: "consent",
  });
  return refreshUrl;
}

async function RequestAccessToken(code) {
  const tokens = await client.getToken(code);

  client.setCredentials(tokens);
}

function VerifyGoogleAudClientId(aud) {
  if (aud === web.client_id) {
    return true;
  }
  throw new Error(
    "Google Aud client_id does not match registered client_id.  Token may not be intended for this client.  Authentication fails."
  );
}

function IsGoogleExpired(epochSeconds) {
  if (Date.now() / 1000 > epochSeconds) {
    return true;
  }
  return false;
}

async function SyncUserWithDB(mongodb, googleuser) {
  let user = await mongodb
    .db("Storage")
    .collection("Users")
    .findOne({
      "googleprofile.email": googleuser.email,
      "googleprofile.exp": { $gt: Date.now() / 1000 },
    });

  if (user == null) {
    let newuser = {
      googleprofile: googleuser,
    };

    let outcome = await mongodb
      .db("Storage")
      .collection("Users")
      .insertOne(newuser);

    if (outcome.acknowledged) {
      return {
        ...newuser,
        _id: outcome.insertedId,
        isInsert: true,
      };
    } else
      return {
        error: "Unable to create new user using Google Sign In",
      };
  }

  return {
    ...user,
    isAuthenticated: true,
  };
}

module.exports = {
  VerifyGoogleUser: VerifyGoogleUser,
  SyncUserWithDB: SyncUserWithDB,
};
