const { query } = require("express");

function updateWebhook(newUrl, apikey, apitoken) {
    const id = "65cc74fc4ad312df12bfe8ef"
    const url = `https://api.trello.com/1/webhooks/${id}?key=${apikey}&token=${apitoken}`;
    const data = {
        description: "trello to notion webhook",
        callbackURL: newUrl,
        idModel: "5e1d47406228a67fe00b8d78" // school work board id
    };

    fetch(url, {
        method: 'PUT',
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
}

async function getTrelloCardChecklists(cardId, apikey, apitoken) {
    const url = `https://api.trello.com/1/cards/${cardId}/checklists?key=${apikey}&token=${apitoken}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function getCardChecklistCompletionPercentage(cardId, apikey, apitoken) {
    const checklists = await getTrelloCardChecklists(cardId, apikey, apitoken);
    let totalItems = 0;
    let completedItems = 0;

    checklists.forEach(checklist => {
        totalItems += checklist.checkItems.length;
        completedItems += checklist.checkItems.filter(item => item.state === "complete").length;
    });

    return [(completedItems / totalItems), totalItems, completedItems];
}

async function queryNotionDatabase(notion, databaseId, queryFilter = {}) {
    try {
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: queryFilter
        });
    
        // console.log(response);
        return response;
    } catch (error) {
        console.error(error);
    }
}

async function addCardToNotion(notion, databaseId, cardName, cardURL, cardList) {
    try {
        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: cardName,
                            },
                        },
                    ],
                },
                URL: {
                    url: cardURL,
                },
                Tags: {
                    multi_select: [{
                        name: cardList,
                    },]
                },
            },
            // add card checklist later
        });
    
        // console.log(response);
        console.log("Card added to Notion");
    } catch (error) {
        console.error(error);
    }
}

async function updatePageInNotion(notion, databaseId, cardURL, updateFields = {}) {
    try {
        notionDatabase = await queryNotionDatabase(notion, databaseId, { property: "URL", url: { equals: cardURL } });
        notionPageId = notionDatabase.results[0].id;
    
        const response = await notion.pages.update({
            page_id: notionPageId,
            properties: updateFields
        });
    
        // console.log(response);
        console.log("Page updated in Notion");
    } catch (error) {
        console.error(error);
    }
}

async function deletePageInNotion(notion, databaseId, cardURL) {
    try {
        notionDatabase = await queryNotionDatabase(notion, databaseId, { property: "URL", url: { equals: cardURL } });
        notionPageId = notionDatabase.results[0].id;
    
        const response = await notion.pages.update({
            page_id: notionPageId,
            archived: true
        });
    
        // console.log(response);
        console.log("Page deleted in Notion");
    } catch (error) {
        console.error(error);
    }
}

module.exports = { updateWebhook, getTrelloCardChecklists, getCardChecklistCompletionPercentage, queryNotionDatabase, addCardToNotion, updatePageInNotion, deletePageInNotion};