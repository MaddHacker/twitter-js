/**
 * Copyright 2017 MaddHacker
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Library to connect using OAuth 1.1 to the Twitter Streaming public API.
 * Allows for filtering on a variable number of search terms. <b>ONLY supports
 * Public API using statuses/filter.</b> This is all hard coded, and could be
 * extracted as need be.
 * 
 * @see Twitter Streaming Endpoints @ https://dev.twitter.com/streaming/overview
 * @see Twitter Public API Streaming Endpoint @ https://dev.twitter.com/streaming/public
 * @see Twitter Streaming Message Types @ https://dev.twitter.com/streaming/overview/messages-types
 * 
 * @see Twitter: Using OAuth @ https://dev.twitter.com/oauth/overview/introduction
 * @see Twitter: Application only Authentication @ https://dev.twitter.com/oauth/application-only
 */

'use strict';

/* node dependencies */
const https = require('https');
const querystring = require('querystring');
const crypto = require('crypto');
const util = require('util');
const events = require('events');
const O = require('output-manager');

/**
 * Custom exception
 * 
 * @param err
 * @param cause
 * @returns {object} TwitterException that can be accessed for more information
 *          properties are:
 *          <ul>
 *          <li><b>name</b> name of the error</li>
 *          <li><b>type</b> 'TwitterException'</li>
 *          <li><b>message</b> message provided when error was generated</li>
 *          <li><b>cause</b> deeper cause</li>
 *          <li><b>fileName</b> 'twitter.js'</li>
 *          <li><b>lineNumber</b> line number of exception (if provided)</li>
 *          <li><b>stack</b> call stack of error</li>
 *          <li><b>toString()</b> clean print of message + cause</li>
 *          </ul>
 */
function TwitterException(err, cause) {
	rtn = {
		name : 'TwitterException',
		type : 'TwitterException',
		message : '',
		cause : cause,
		fileName : 'twitter.js',
		lineNumber : '',
		stack : '',
		toString : function() {
			return this.message + ' ::: ' + this.cause;
		}
	};

	if (typeof err === 'object' && err.name === 'Error') {
		rtn.name = err.name;
		rtn.message = err.message;
		rtn.fileName = err.fileName || 'twitter.js';
		rtn.lineNumber = err.lineNumber;
		rtn.stack = err.stack;
	}

	return rtn;
}

/**
 * Constructor for the Public Stream impl.
 * 
 * @param tokens
 *            access tokens from Twitter
 *            <ul>
 *            <li><b><i>consumerKey</i></b></li>
 *            <li><b><i>consumerSecret</i></b></li>
 *            <li><b><i>accessToken</i></b></li>
 *            <li><b><i>accessTokenSecret</i></b></li>
 *            </ul>
 * 
 * @see Tokens from dev.twitter.com @ https://dev.twitter.com/oauth/overview/application-owner-access-tokens
 */
function TwitterPublicStream(tokens) {
	if (!(this instanceof TwitterPublicStream)) {
		return new TwitterPublicStream(tokens);
	}
	events.EventEmitter.call(this);

	O.d('Given tokens: ' + JSON.stringify(tokens));
	if (typeof tokens != 'object') {
		O.w('Given tokens are not an object, throwing them away...');
		throw TwitterException(
				new Error('Given tokens must be an object'),
				'tokens must be an object that contains: "consumerKey", "consumerSecret", "accessToken", "accessTokenSecret"');
	}

	this.TwitterTokens = tokens;

	return this;
}

/**
 * Use inherits to support event emitting
 */
util.inherits(TwitterPublicStream, events.EventEmitter);

/**
 * Access tokens provided by this application within Twitter.
 * 
 * @see Tokens from dev.twitter.com @ https://dev.twitter.com/oauth/overview/application-owner-access-tokens
 */
TwitterPublicStream.prototype.TwitterTokens = {
	consumerKey : '',
	consumerSecret : '',
	accessToken : '',
	accessTokenSecret : ''
};

/**
 * All of the params needed for the Authentication header. This <b>does NOT</b>
 * include
 * <ul>
 * <li><i>oauth_nonce</i> : This must be generated and unique per request.</li>
 * <li><i>oauth_timestamp</i> : This needs to be current, moved to </li>
 * <li><i>oauth_signature</i> : this must be generated after the entire
 * request is known, just before the request is sent.</li>
 * </ul>
 */
TwitterPublicStream.prototype._authenticationParams = function() {
	return {
		oauth_consumer_key : this.TwitterTokens.consumerKey,
		oauth_signature_method : 'HMAC-SHA1',
		oauth_token : this.TwitterTokens.accessToken,
		oauth_version : '1.0'
	};
};

/**
 * Post data that is provided to the request to establish the stream. More
 * information can be found on the Twitter documentation site.
 * 
 * @see Twitter Streaming Public POST statuses/filter @ https://dev.twitter.com/streaming/reference/post/statuses/filter
 * @see Twitter Streaming API Request Parameters @ https://dev.twitter.com/streaming/overview/request-parameters
 */
TwitterPublicStream.prototype._postDataSet = function() {
	return {
		/**
		 * means that Twitter provides us the size of each message before the
		 * message.
		 * 
		 * @see https://dev.twitter.com/streaming/overview/request-parameters#delimited
		 */
		'delimited' : 'length',

		/**
		 * Intentionally left blank in order to allow users to add this
		 * 
		 * @see https://dev.twitter.com/streaming/overview/request-parameters#track
		 */
		'track' : ''
	};
};

/**
 * Options for the connection to twitter. Defined by:
 * {@link https://nodejs.org/api/https.html#https_https_request_options_callback Node https library}
 * 
 * @see https://nodejs.org/api/https.html
 */
TwitterPublicStream.prototype.HttpsOptions = {
	hostname : 'stream.twitter.com',
	port : 443,
	path : '/1.1/statuses/filter.json',
	method : 'POST',
	keepAlive : true,
	keepAliveMsecs : 10000,
	agent : new https.Agent({
		keepAlive : true,
		keepAliveMsecs : 10000
	})
};

/**
 * This needs to be called carefully. Followed using Twitter docs. <b>THIS
 * SHOULD ONLY BE CALLED RIGHT BEFORE A REQUEST IS MADE</b>
 * 
 * @return {string} that is the base64 encoded nightmare of all needed
 *         components to make Twitter happy.
 * 
 * @see Twitter's creating a signature @ https://dev.twitter.com/oauth/overview/creating-signatures
 */
TwitterPublicStream.prototype._signature = function(authParams, postData) {
	var tps = this;

	O.t('   ciphers          => ' + crypto.getCiphers());

	var prefix = tps.HttpsOptions.method.toUpperCase()
			+ '&'
			+ encodeURIComponent('https://' + tps.HttpsOptions.hostname
					+ tps.HttpsOptions.path) + '&';

	var postfixArray = [];
	for (key in postData) {
		postfixArray.push(encodeURIComponent(key) + '='
				+ encodeURIComponent(postData[key]));
	}
	for (key in authParams) {
		postfixArray.push(encodeURIComponent(key) + '='
				+ encodeURIComponent(authParams[key]));
	}

	var signatureBaseStr = prefix
			+ encodeURIComponent(postfixArray.sort().join('&'));
	O.d('   signatureBaseStr => ' + signatureBaseStr);
	var signatureKey = encodeURIComponent(tps.TwitterTokens.consumerSecret)
			+ '&' + encodeURIComponent(tps.TwitterTokens.accessTokenSecret);
	O.d('   sigKey           => ' + signatureKey);
	// encoding...
	var hmac = crypto.createHmac('sha1', signatureKey);
	hmac.setEncoding('base64');
	hmac.write(signatureBaseStr);
	hmac.end();
	// end stream, now can read
	var signature = encodeURIComponent(hmac.read());
	O.d('   sig              => ' + signature);

	return signature;
};

/**
 * Runs a Public Feed against Twitter to track terms provided.
 * 
 * @param trackTerms
 *            {string} => used with the
 *            {@link https://dev.twitter.com/streaming/overview/request-parameters#track Track Param}
 *            in the Twitter API. This is a <b><i>comma-separated list of
 *            phrases...each phrase must be between 1 and 60 bytes</i></b>
 *            Spaces in phrases are logical <i>AND</i>s while the commas
 *            represent logical <i>OR</i>s
 * 
 * @callback connected ({http.ServerResponse}) => called when connected, before
 *           data is recieved, but once the connection is established with a 200
 *           response code.
 * @callback heartbeat () => notification a heartbeat has been recieved
 * @callback data ({JSON}) => message recieved, provided as JSON.
 * @callback garbage ({string}) => called when the provided string can not be
 *           parsed as JSON (is garbage).
 * @callback close ({string}) => called when the connection is closed with
 *           {string} reason
 * @callback error ({ type: {string}, data: {object}, request :
 *           {http.ClientRequest}, response: {http.ServerResponse} }) => emitted
 *           for any error with the request or response.
 */
TwitterPublicStream.prototype.track = function(trackTerms) {
	var tps = this;

	var postDataSet = tps._postDataSet();
	postDataSet['track'] = trackTerms;

	/*
	 * Setup each of the AuthenticationParams that was not provided. This means
	 * if we have to close/reconnect, we regen params that are valid...
	 */
	var authParams = tps._authenticationParams();
	authParams.oauth_nonce = crypto.randomBytes(32).toString('base64').slice(0,
			32).replace(/\+/g, '0').replace(/\//g, '0');
	authParams.oauth_timestamp = Math.floor((new Date()).getTime() / 1000);
	O.d('   AuthenticationParams => ' + JSON.stringify(authParams));

	var httpsOptions = tps.HttpsOptions;
	httpsOptions.headers = {
		'Content-Type' : 'application/x-www-form-urlencoded',
		'Accept' : '*/*',
		'User-Agent' : 'twitter.js',
		'Authorization' : 'OAuth oauth_consumer_key="'
				+ authParams.oauth_consumer_key + '", oauth_nonce="'
				+ authParams.oauth_nonce + '", oauth_signature="'
				+ tps._signature(authParams, postDataSet)
				+ '", oauth_signature_method="'
				+ authParams.oauth_signature_method + '", oauth_timestamp="'
				+ authParams.oauth_timestamp + '", oauth_token="'
				+ authParams.oauth_token + '", oauth_version="'
				+ authParams.oauth_version + '"'
	};

	var postData = querystring.stringify(postDataSet);
	O.d('   postdata         => ' + postData);
	httpsOptions.headers['Content-length'] = Buffer.byteLength(postData);

	O.d('   HttpsOptions         => ' + JSON.stringify(httpsOptions));
	O.d('   HttpsOptions.headers => ' + JSON.stringify(httpsOptions.headers));

	/*
	 * Actually do the work of creating and managing the request
	 */
	var request = https.request(httpsOptions);
	request.write(postData);

	/*
	 * this is how we hold the connection open...
	 */
	request.on('response', function(response) {
		if (response.statusCode != 200) {
			tps.emit('error', {
				type : 'response',
				data : response.statusCode,
				request : request,
				response : response
			});
			return;
		}

		response.setEncoding('utf8');

		/*
		 * good status on the connection...
		 */
		tps.emit('connected', response);

		var end = '\r\n';

		/*
		 * used to parse the chunked data...
		 */
		var buffer = '';
		var nextDataLength = 0;

		/*
		 * Actually do the work to check the data streams and parse the
		 * response.
		 */
		response.on('data', function(chunk) {
			O.t('Data response => ' + chunk);

			if (chunk == end) {
				tps.emit('heartbeat');
				return;
			}

			O.d('Current buffer has length of ' + buffer.length);
			O.d('Current response has length of ' + nextDataLength);
			O.d('Current chunk has length of ' + chunk.length);

			/*
			 * if buffer is clean and we don't have a length for the nextData,
			 * try to get the length
			 */
			if (!buffer.length && nextDataLength == 0) {
				O.t('No buffer length');
				O.t('Trying to parse the length...');
				// get length of incoming data
				var line_end_pos = chunk.indexOf(end);
				nextDataLength = parseInt(chunk.slice(0, line_end_pos));
				O.d('Found data length of: ' + nextDataLength);
				// slice data length string from chunk
				chunk = chunk.slice(line_end_pos + end.length);
			}

			if (nextDataLength - buffer.length >= chunk.length) {
				O.d('Add whole chunk');
				buffer += chunk;
			} else if (buffer.length != nextDataLength) {
				O.d('Add partial chunk');
				buffer += chunk.slice(0, (nextDataLength - buffer.length));
				// ||| jbariel TODO handle rest of chunk...
			}

			if (buffer.length == nextDataLength) {
				var parsed = false;
				try {
					buffer = JSON.parse(buffer);
					// exception is thrown if we can't parse
					// tps.emit('data', buffer);
					parsed = true;
				} catch (e) {
				}
				tps.emit(((parsed) ? 'data' : 'garbage'), buffer);

				buffer = '';
				nextDataLength = 0;
			}
		});

		/*
		 * Log the error and emit on the callback
		 */
		response.on('error', function(error) {
			tps.emit('error', {
				type : 'response',
				data : error,
				request : request,
				response : response
			});
		});

		/*
		 * Handle the socket end
		 */
		response.on('end', function() {
			tps.emit('close', 'socket end');
		});

		/*
		 * Handle the close, call abort() on the request.
		 */
		response.on('close', function() {
			tps.emit('close', 'response close');
			request.abort();
		});
	}); // end request.on('response',fxn)

	/*
	 * used to make sure that the default agent removes the socket from the pool
	 * management, helps keep it open...
	 */
	request.on('socket', function(socket) {
		socket.emit('agentRemove');
	});

	/*
	 * Error with request, emitted..
	 */
	request.on('error', function(error) {
		tps.emit('error', {
			type : 'request',
			data : error,
			request : request,
			response : null
		});
	});

	/*
	 * Always have to close the stream
	 */
	request.end();

	/**
	 * Add a stopTracking function for *cough* <i>cleaner</i> shutdown...
	 */
	tps.stopTracking = function() {
		O.d('Stopping tracking...');
		request.abort();
	};

	return tps;
};

/*
 * All exports...
 */
module.exports = {
	TwitterPublicStream : TwitterPublicStream
};
