/*

This is a simple server router that runs with node.js (http://nodejs.org/)
and processes my incoming posts and other requests.

Based on code originally written by Noah Veltman, veltman.com

Also includes Flickr API module example code from 
https://github.com/Pomax/node-flickrapi

John Keefe
http://johnkeefe.net
March 2015

*/

// establish all of the dependency modules
// install these modules with "npm" the node packet manager
//    npm install express
//    npm install request
//    npm install body-parser
//    npm install flickrapi

var express = require('express'),
    fs = require('fs'),
    request = require('request'),
    bodyParser = require('body-parser'),
    app = express(),
    Flickr = require("flickrapi"),
    flickrOptions = {
      api_key: "FLICKR_API_KEY_here",
      secret: "FLICKR_API_KEY_SECRET_here",
      
      // To get the next three values, run this program without the lines
      // commented-out or deleted. In the console, you will get a URL to 
      // visit to authenticate this program with your account. You then
      // get a code to enter into the console, and you'll get the values
      // You need. Then you can enter them here and all subsequent runs 
      // will just work.
      // My adventure on this here: http://johnkeefe.net/make-every-week-texted-picture-catcher
      // More info at https://github.com/Pomax/node-flickrapi
      user_id: "FLICKR_USER_ID_here",
      access_token: "FLICKR_ACCESS_TOKEN_here",
      access_token_secret: "FLICKR_ACCESS_TOKEN_SECRET_here",
      
      // console.logs the auth URL instead of opening a browser for it
      nobrowser: true,
      
      // suppress writing progress bars to stdout:
      progress: false,
      
      // give permissions to authenticate for writing
      permissions: "write"
    };

// this is needed to read the body!
app.use(bodyParser());

// respond to incoming text messages from twilio that also include mms messages!
// POST URL is semi-cloaked with a random key:
//   http://project.johnkeefe.net/texted-pictures-post-ij4tos3al7cij5hov8mi/
app.post(/^\/?texted-pictures/i, function(req,res){
	
	// is there a body of information
	if (!req.body) {
		res.send("Posting error");
		return true;
	}
	
	// incoming text message text
	text_message = req.body.Body;
	
	// If there's a picture URL, do all of the fun things ...	
	if (req.body.MediaUrl0) {
	    
	    // Get the URL of the picture
        // only grabbing first image, even if there are many
        picture_url = req.body.MediaUrl0;
        console.log(picture_url);

        // Use the URL to save the image to a file
        // Here I'm using streaming, to write the data right to the file
        // without holding it in memory.
        // Code drawn from example here:
        // http://neethack.com/2013/12/understand-node-stream-what-i-learned-when-fixing-aws-sdk-bug/
        
        // 'stream' is where the data is coming from (the Twilio URL for the picture)
        var stream = request(picture_url);
        
        // 'writeStream' is where I want to save the stream 
        var writeStream = fs.createWriteStream('picture-downloads/test.jpg');

        // if something went wrong, say so and close the stream
        stream.on('error', function(err) {
          console.log('something went wrong with download',err);
          writeStream.close();
        });

        // If you see data coming in from the URL, feed it right into the file
        stream.on('data', function(data) {
          writeStream.write(data);
        });

        // when the stream is done, end the file-writing, let me know it's done,
        // and send the file to Flickr using the function sendToFlickr (defined below)
        stream.on('end', function() {
          writeStream.end();
          console.log('picture download done');

          // run the flicker-sending function below
          sendToFlickr();

        });
   
	}
	
	
    function sendToFlickr(){

        Flickr.authenticate(flickrOptions, function(error, flickr) {
          // we can now use "flickr" as our API object

          var uploadOptions = {
            photos: [{
              title: "test picture",
              photo: "picture-downloads/test.jpg",
              is_public: 0,
              tags: "make_every_week"
            }]
          };

          Flickr.upload(uploadOptions, flickrOptions, function(err, result) {
            if(err) {
              return console.error(error);
            }
            console.log("photos uploaded to flickr", result);
            
            return true;
          });

        });

    }

	
});

app.listen(80);
console.log('running!');

