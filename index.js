require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const request =  require('request');
const apiaiApp = require('apiai')(process.env.CLIENT_ACCESS_TOKEN);
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

app.post('/ai', (req, res) => {
    if (req.body.result.action === 'weather') {
      let city = req.body.result.parameters['geo-city'];
      let restUrl = 'http://api.openweathermap.org/data/2.5/weather?APPID='+process.env.WEATHER_API_KEY+'&q='+city+"&units=imperial";
  
      request.get(restUrl, (err, response, body) => {
        if (!err && response.statusCode == 200) {
          let json = JSON.parse(body);
          console.log(json);
          let msg = json.weather[0].description + ' and the temperature is ' + json.main.temp + ' ℉';
          return res.json({
            speech: msg,
            displayText: msg,
            source: 'weather'});
        } else {
          return res.status(400).json({
            status: {
              code: 400,
              errorType: 'I failed to look up the city name.'}});
        }})
    }
})

function sendMessage(event) {
    let sender = event.sender.id;
    let text = event.message.text;
  
    let apiai = apiaiApp.textRequest(text, {
      sessionId: 'tabby_cat' // use any arbitrary id
    });
  
    apiai.on('response', (response) => {
        let aiText = response.result.fulfillment.speech;
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
            method: 'POST',
            json: {
            recipient: {id: sender},
            message: {text: aiText}
            }
        }, (error, response) => {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        });
    });
  
    apiai.on('error', (error) => {
      console.log(error);
    });
  
    apiai.end();
}