
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const trelloApiKey = process.env.TRELLO_API_KEY;
const trelloApiToken = process.env.TRELLO_API_TOKEN;

const callbackURL = "https://webhook.site/b5d6468d-c953-4c34-b03a-3ad0a9c10903";
const idModel = "5e1d47406228a67fe00b8d78"; // school work board id

const url = `https://api.trello.com/1/webhooks/?key=${trelloApiKey}&token=${trelloApiToken}`;

const data = {
    description: "trello to notion webhook",
    callbackURL: callbackURL,
    idModel: idModel
};

fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
})
    .then(response => {
        console.log(
            `Response: ${response.status} ${response.statusText}`
        );
        return response.text();
    })
    .then(text => console.log(text))
    .catch(err => console.error(err));