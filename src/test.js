const express = require('express');
const ngrok = require('@ngrok/ngrok');
const dotenv = require('dotenv');
const tools = require('./tools');

const app = express();
dotenv.config();
app.use(express.json()); // for parsing application/json


const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_SECRET });

queryFilter = {
    property: "URL",
    url: {
        equals: "https://trello.com/c/t8TrJnnh"
    }
}

const myFunction = async () => {
    entry = await tools.queryNotionDatabase(notion, "c08e9346e02d4ad68ed10cccaa97088b", queryFilter);
    console.log(entry);
};

myFunction();
// tools.addCardToNotion(notion, "c08e9346e02d4ad68ed10cccaa97088b", "test card", "https://www.notion.so/", "2022-01-01");

