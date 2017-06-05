'use strict'

const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token: token},
	    method: 'POST',
		json: {
		    recipient: {id: sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
		    console.log('Error sending messages: ', error)
		} else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageAttachments) {
  	saveNewsMessage(senderID, message)
    sendTextMessage(senderID, "Thanks for your feedback! :)");
  } else if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  }
}

function saveNewsMessage(psid, message) {
	const url_fb_prefix = 'https://l.facebook.com/l.php?u='

	_.each(message.attachments, (element) => {

		let url = '' + element.url

		if(url.lastIndexOf(url_fb_prefix) != -1) {
			url = url.substring(url_fb_prefix.length)
		}

		var newsItem = new News( {
			mid: message.mid,
			psid: psid,
			seq: message.seq,
			title: element.title,
			url: url,
			type: element.type
		} );
		    
	    newsItem.save((err) => {
	      if(err) {
	      	console.log("SOMETHING WENT WRONG WHILE SAVING A NEWS ITEM ON mLab")
	      }
	    });
	})
	

}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: FB_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

function getUserInfo(psid) {
  request({
    uri: 'https://graph.facebook.com/v2.6/' + psid,
    qs: { 
    	fields: 'first_name,last_name,profile_pic,locale,timezone,gender',
    	access_token: FB_ACCESS_TOKEN
    },
    method: 'GET'

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {

    	let data = JSON.parse(body)

    	let first_name = data.first_name;
    	let last_name = data.last_name;
    	let profile_pic = data.profile_pic;
    	let locale = data.locale;
    	let timezone = data.timezone;
    	let gender = data.gender;

    	var user = new User( {
    		id: psid,
    		first_name: first_name,
    		last_name: last_name,
    		profile_pic: profile_pic,
    		locale: locale,
    		timezone: timezone,
    		gender: gender
    	} );
	    
	    user.save((err) => {
	      if(err) {
	      	console.log("SOMETHING WENT WRONG WHILE SAVING THE USER ON mLab")
	      }
	    });

    	console.log('User info: Name %s %s | Locale %s | Timezone %s | Gender %s | Profile Picture -> %s'
    		, first_name, last_name, locale, timezone, gender, profile_pic)

    } else {
      console.error("Unable to get user profile info.");
      console.error(response);
      console.error(error);
    }
  });  
}

// ******************************* //
// ******************************* //


const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const mongoose = require('mongoose')
const _ = require('underscore')
const app = express()

const User_Schema = new mongoose.Schema({
  id: String, 
  first_name: String,
  last_name: String,
  profile_pic: String,
  locale: String,
  timezone: Number,
  gender: String
})

const News_Schema = new mongoose.Schema({
	mid: String,
	psid: String,
	seq: Number,
	title: String,
	url: String,
	type: String

})

const User = mongoose.model('User', User_Schema)
const News = mongoose.model('News', News_Schema)

mongoose.connect(process.env.MLAB_URI, function (error) {
    if (error) console.error(error);
    else console.log('CONNECTED TO mLAB INSTANCE');
});

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())


// ******************************* //
// ******************************* //

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook', function (req, res) {

	console.log('REQUEST TO WEBHOOK ' + req.query['hub.verify_token'])

	if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
	console.log(req)

})

app.post('/webhook', function (req, res) {

	var data = req.body;

  	// Make sure this is a page subscription
	if (data.object === 'page') {

		// Iterate over each entry - there may be multiple if batched
		data.entry.forEach(function(entry) {
		  var pageID = entry.id;
		  var timeOfEvent = entry.time;

		  // Iterate over each messaging event
		  entry.messaging.forEach(function(event) {
		  	let sender = event.sender.id
		  	let userQuery = findUserById(sender)
		  	userQuery.exec((error, user) => {
		  		if(error) {
		  			console.log("FATAL ERROR WHILE QUERYING USER")
		  		} else {
		  			if(user) {
				  		console.log("USER %s IS ALREADY REGISTERED", user.first_name)
				  	} else {
				  		getUserInfo(sender)
				  	}		
		  		}

		  	})
		  	
		    if (event.message) {
		    	let text = event.message.text || "Empty message. That's really weird men"
		    	// sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
		      	receivedMessage(event);
		    } else if(event.postback) {
				receivedPostback(event);
			} else {
		      console.log("Webhook received unknown event: ", event);
		    }
		  });
		});

		// Assume all went well.
		//
		// You must send back a 200, within 20 seconds, to let us know
		// you've successfully received the callback. Otherwise, the request
		// will time out and we will keep trying to resend.
		res.sendStatus(200);

	}
})

function findUserById(psid) {
	return User.findOne( {'id': psid} )
}

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})