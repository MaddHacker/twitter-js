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
'use strict';

const https = require('https');

class tConfig {

    constructor(params) {
        params = params || {};

        // {ouput-manager}
        this.out = (params.out || (new (require('output-manager')).Out()));

        this._authToken = null;

        this._consumer = params.consumer || {};
        this._consumer.key = params.consumerKey || params.consumer.key || '';
        this._consumer.secret = params.consumerSecret || params.consumer.secret || '';

        this._basicAuthHeader = 'Basic ' + Buffer.from(encodeURIComponent(this._consumer.key) + ':' + encodeURIComponent(this._consumer.secret)).toString('base64');
        this._authBody = 'grant_type=client_credentials';
        this._authOptions = {
            hostname: 'api.twitter.com',
            port: 443,
            path: '/oauth2/token',
            method: 'POST',
            headers: {
                'Host': 'api.twitter.com',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': '*/*',
                'User-Agent': 'streaming-twitter.js',
                'Content-Length': Buffer.byteLength(this._authBody),
                'Accept-Encodiing': 'gzip',
                'Authorization': this._basicAuthHeader
            }
        };

        this._access = params.access || {};
        this._access.token = params.accessToken || '';
        this._access.secret = params.accessTokenSecret || '';

        this.onConnected = (params.onConnected || ((response) => { this.out.d('onConnected emitted'); }));
        this.onHeartbeat = (params.onHeartbeat || (() => { this.out.d('onHeartbeat emitted'); }));
        this.onClose = (params.onClose || ((reason) => { this.out.i('onClose emitted' + reason); }));
        this.onError = (params.onError || ((errorObj) => { this.out.e('onError emitted: ' + errorObj); }));
        this.onGarbage = (params.onGarbage || ((buffer) => { this.out.d('onGarbage emitted.'); }));
        this.onData = (params.onData || ((data) => { this.out.d('onData emitted: ' + data); }));
    }

    trackData(terms) {
        return {
            'delimited': 'length',
            'track': terms
        };
    }

    httpsStreamOptions() {
        return {
            hostname: 'stream.twitter.com',
            port: 443,
            path: '/1.1/statuses/filter.json',
            method: 'POST',
            keepAlive: true,
            keepAliveMsecs: 10000,
            agent: new https.Agent({
                keepAlive: true,
                keepAliveMsecs: 10000
            })
        };
    }

    get authToken() { return this._authToken; }

    getOrRequestAuthToken() {
        let token = this.authToken;
        if (null == token) {
            token = this._requestAuthToken();
            this.authToken = token;
        }
        return token;
    }

    set authToken(token) { this._authToken = token; }

    expireToken() {
        this.authToken = null;
    }

    _requestAuthToken(callbackFxn) {
        let result = '';
        let request = https.request(this._authOptions, (response) => {
            response.on('data', (chunk) => { result += chunk; });
            response.on('end', () => {
                this.out.i('No more data, final result: ' + result);
                this.authToken = JSON.parse(result).access_token;
                if (callbackFxn) {
                    callbackFxn(this.authToken);
                }
            });
            response.on('error', (err) => {
                this.out.e('Response error trying to get auth token:' + err);
            });
        });

        request.on('error', (err) => {
            this.out.e('Request error trying to get auth token:' + err);
        });

        request.write(this._authBody);
        request.end();
    }

}

/**
 * All Exports
 */
module.exports = tConfig;
