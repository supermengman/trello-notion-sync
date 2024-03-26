const express = require('express');
const ngrok = require('@ngrok/ngrok');
const dotenv = require('dotenv');
const tools = require('./tools');
const fetch = require('node-fetch');

const app = express();
dotenv.config();
app.use(express.json()); // for parsing application/json


const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_SECRET });

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

ngrok.connect({ addr: 8080, authtoken: process.env.NGROK_AUTHTOKEN })
    .then(listener => {
        console.log(`Ingress established at: ${listener.url()}`)
        tools.updateWebhook(listener.url() + "/webhook", process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOKEN)
    });


app.get('/webhook', (req, res) => {
    res.status(200).send('Server is running');
});

app.post('/webhook', async (req, res) => {
    console.log('Webhook received: ' + req.body.action.type + " " + req.body.action.display.translationKey);
    // Process the webhook data here
    // console.log(req.body.action)
    res.status(200).send('Webhook received');

    // card created
    if (req.body.action.type === 'createCard') {
        console.log('New card created in Trello');
        const cardName = req.body.action.data.card.name;
        const cardURL = "https://trello.com/c/" + req.body.action.data.card.shortLink;
        const cardList = req.body.action.data.list.name;

        tools.addCardToNotion(notion, process.env.NOTION_DATABASE_ID, cardName, cardURL, cardList);
    }

    else if (req.body.action.type === 'updateCard') {
        // card moved
        if (req.body.action.display.translationKey === 'action_move_card_from_list_to_list') {
            console.log('Card moved in Trello: ' + req.body.action.data.listBefore.name + ' -> ' + req.body.action.data.listAfter.name);
            const cardURL = "https://trello.com/c/" + req.body.action.data.card.shortLink;
            const cardList = req.body.action.data.listAfter.name;

            const updateFields = {
                Tags: {
                    multi_select: [{
                        name: cardList
                    }]
                }
            }

            tools.updatePageInNotion(notion, process.env.NOTION_DATABASE_ID, cardURL, updateFields);
        }


        // card due date changed
        else if (req.body.action.display.translationKey === 'action_added_a_due_date' || req.body.action.display.translationKey === 'action_changed_a_due_date') {
            console.log('Card due date changed in Trello');
            const cardURL = "https://trello.com/c/" + req.body.action.data.card.shortLink;
            const updateFields = {
                Date : {
                    date: {
                        start: req.body.action.data.card.due
                    }
                }
            }

            tools.updatePageInNotion(notion, process.env.NOTION_DATABASE_ID, cardURL, updateFields);
        }
		
		// card name changed
		else if (req.body.action.display.translationKey === 'action_renamed_card') {
			console.log('Card name changed in Trello');
			const cardURL = "https://trello.com/c/" + req.body.action.data.card.shortLink;
			const updateFields = {
				Name: {
					title: [{
						type: 'text',
						text: {
							content: req.body.action.data.card.name
						}
					}]
				}
			}
			tools.updatePageInNotion(notion, process.env.NOTION_DATABASE_ID, cardURL, updateFields);
		}

		// card deleted
		else if (req.body.action.display.translationKey === 'action_archived_card') {
			console.log('Card deleted in Trello');
			const cardURL = "https://trello.com/c/" + req.body.action.data.card.shortLink;
			tools.deletePageInNotion(notion, process.env.NOTION_DATABASE_ID, cardURL);
		}




    }

    // checklist item completion status changed
    else if (req.body.action.type === 'updateCheckItemStateOnCard') {
        console.log('Checklist item completion status changed in Trello');
        const cardId = req.body.action.data.card.id;
        const cardURL = "https://trello.com/c/" + req.body.action.data.card.shortLink;
        
        // actually set it
        let [completion, totalItems, completedItems] = await tools.getCardChecklistCompletionPercentage(cardId, process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOKEN);

        const updateFields = {
            Completion: {
                number: completion
            }
        }

        tools.updatePageInNotion(notion, process.env.NOTION_DATABASE_ID, cardURL, updateFields);
    }

    else if (req.body.action.type === 'createCheckItem') {
        console.log('New checklist item created in Trello');
        const cardId = req.body.action.data.card.id;
        const cardURL = "https://trello.com/c/" + req.body.action.data.card.shortLink;
        
        

        // actually set it
        let [completion, totalItems, completedItems] = await tools.getCardChecklistCompletionPercentage(cardId, process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOKEN);

        
        const updateFields = {
            Completion: {
                number: completion
            }
        }
        tools.updatePageInNotion(notion, process.env.NOTION_DATABASE_ID, cardURL, updateFields);
    }
});
