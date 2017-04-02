# twitter-js
JS Implementation for the Twitter Public Streaming API.

# Getting Started
First you need to create a TwitterPublicStream

	var twitter = require('twitter');
	var myTwitter = new twitter.TwitterPublicStream({
		consumerKey : 'your consumer key',
		consumerSecret : 'your consumer secret',
		accessToken : 'your access token',
		accessTokenSecret : 'your access token secret'
	});

Then you can setup listeners for the callbacks

	myTwitter.on('connected', function(response){});
	myTwitter.on('heartbeat', function(){});
	myTwitter.on('close', function(reason){});
	myTwitter.on('error', function(errObj){});
	myTwitter.on('garbage', function(buffer){});
	myTwitter.on('data', function(data){});
	
* **Connected** : Called when connected, allows you to start tracking terms

* **Heartbeat** : Called when no data has passed for a while, to keep the connection alive

* **Close** : Called on close, with the reason

* **Error** : Called when there is an error, with an error object.  This has a type and data property

* **Garbage** : Called when the response can not be parsed as JSON, provides the buffer from twitter
	
* **Data** : Called when a tweet is parsed from the stream. Provides the Tweet as JSON.
	
	
## Tracking a term

You can use this to filter and track specific terms.  Just provide a comma delimited list of terms to track (e.g. _'#obama,#hillary'_).  This then goes into the _track()_ method as so:

	myTwitter.track('#obama,#hillary');
	
## Changing a term

To change the list of terms, call _stopTracking()_, then recreate the stream.  Sadly this is a Twitter restriction, that doesn't allow you to change a stream.

	myTwitter.stopTracking();
	myTwitter.track('#clinton');
	
# Questions?

Just ping me at:

	hacker (a) maddhacker dot com
	
Enjoy!

## Getting Started
- Install [the npm](https://www.npmjs.com/package/streaming-twitter) in your project: `npm install --save streaming-twitter`
- Require the library where needed: `const twitter = require('streaming-twitter');`
- Stream Twitter.

# Slack
This is one of several projects that are in the works, so feel free to reach out on [Slack](https://maddhacker.slack.com/).  Please email `slack at maddhacker dot com` for an invite.

# Issues
Please use the [Issues tab](../../issues) to report any problems or feature requests.

# Change Log
All change history can be found in the [CHANGELOG.md](CHANGELOG.md) file.
