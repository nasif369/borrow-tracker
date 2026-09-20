const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const SCOPES = [
    "https://www.googleapis.com/auth/gmail.send"
];

const LOCAL_REDIRECT_URI =
    "http://localhost:5000/oauth2callback";

const RENDER_REDIRECT_URI =
    "https://borrow-tracker.onrender.com/oauth2callback";

const credentialsPath = path.join(
    __dirname,
    "..",
    "credentials.json"
);

const tokenPath = path.join(
    __dirname,
    "..",
    "token.json"
);

function createOAuth2Client() {
    let clientId;
    let clientSecret;
    let redirectUri;

    if (
        process.env.GMAIL_CLIENT_ID &&
        process.env.GMAIL_CLIENT_SECRET
    ) {
        clientId = process.env.GMAIL_CLIENT_ID;
        clientSecret = process.env.GMAIL_CLIENT_SECRET;

        redirectUri =
            process.env.NODE_ENV === "production"
                ? RENDER_REDIRECT_URI
                : LOCAL_REDIRECT_URI;

    } else {
        const credentials = JSON.parse(
            fs.readFileSync(credentialsPath, "utf8")
        );

        const {
            client_secret,
            client_id
        } = credentials.web;

        clientId = client_id;
        clientSecret = client_secret;
        redirectUri = LOCAL_REDIRECT_URI;
    }

    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );
}

function getAuthorizationUrl() {
    const oauth2Client = createOAuth2Client();

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent"
    });
}

async function handleOAuthCallback(code) {
    const oauth2Client = createOAuth2Client();

    const { tokens } =
        await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    fs.writeFileSync(
        tokenPath,
        JSON.stringify(tokens, null, 2)
    );

    return tokens;
}

async function getGmailClient() {
    const oauth2Client = createOAuth2Client();

    if (process.env.GMAIL_REFRESH_TOKEN) {
        oauth2Client.setCredentials({
            refresh_token:
                process.env.GMAIL_REFRESH_TOKEN
        });
    } else if (fs.existsSync(tokenPath)) {
        const token = JSON.parse(
            fs.readFileSync(tokenPath, "utf8")
        );

        oauth2Client.setCredentials(token);
    } else {
        throw new Error(
            "Gmail authorization required."
        );
    }

    return google.gmail({
        version: "v1",
        auth: oauth2Client
    });
}

function createRawEmail(to, subject, text) {
    const email = [
        `To: ${to}`,
        "From: Borrow Tracker",
        `Subject: ${subject}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        text
    ].join("\r\n");

    return Buffer.from(email)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

async function sendEmail(to, subject, text) {
    const gmail = await getGmailClient();

    const raw = createRawEmail(
        to,
        subject,
        text
    );

    await gmail.users.messages.send({
        userId: "me",
        requestBody: {
            raw
        }
    });
}

module.exports = {
    sendEmail,
    getGmailClient,
    getAuthorizationUrl,
    handleOAuthCallback,
    SCOPES
};