const express = require('express');
const bodyParser = require('body-parser');
const request =  require('request');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
    console.log(req)
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'batman') {
      res.status(200).send(req.query['hub.challenge']);
    } else {
      res.status(403).end();
    }
});
  
/* Handling all messenges */
app.post('/webhook', (req, res) => {
    console.log(req.body);
    if (req.body.object === 'page') {
        req.body.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {
                if (event.message && event.message.text) {
                sendMessage(event);
                }
            });
        });
        res.status(200).end();
    }
}); 

function sendMessage(event) {
    let sender = event.sender.id;
    let text = event.message.text;
    console.log(event);
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: 'EAAGxKtyyOWQBAJSnZB7ppKntJvYiZC3kxH8P7bTwa7kYXD7ujZC0g76VwKI2AIGW7Cl88h4yO9jZBx1i1ZCfZAR2IO5ZCLef3zRBPtrn2WMHOFBfjB3ZAsFmGR80IXZAYDnsZB1tYRdfuNmahFHAGYABUGN7CyZCNiEog4dvTaah5UeXwZDZD'},
      method: 'POST',
      json: {
        recipient: {id: sender},
        message: {text: text}
      }
    }, function (error, response) {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });
  }