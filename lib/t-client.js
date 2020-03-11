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

const tConfig = require('./t-config');

class TwitterStream {
    constructor(cfg) {

        this._config = cfg || new tConfig();
        this._connection = null;
    }

    get connection() { return this._connection; }

}
