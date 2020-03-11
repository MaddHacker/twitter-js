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

const tConfig = new (require('../../lib/t-config'))({
    consumer: {
        key: 'fAWcid23x2hjz7qAvXaFjfxsa',
        secret: 'cFXzNghftLGOhmIBL1lXJcX5RdStwtKntgdajPS8OB3drJFFSS'
    }
});

describe('t-config (TwitterConfig) (Unit)', () => {
    describe('Check OAuth Token', () => {
        it('should be null by default', () => {
            expect(tConfig.authToken).toBeNull();
        });
        it('should return when not null', () => {
            tConfig.authToken = 'foo';
            expect(tConfig.authToken).toBe('foo');
        });
        it('should be cleared when asked', () => {
            tConfig.authToken = 'foo';
            expect(tConfig.authToken).toBe('foo');
            tConfig.expireToken();
            expect(tConfig.authToken).toBeNull();
        });
        it('should be calculated (and updated) when asked', () => {
            console["log"] = jest.fn(console.log);
            tConfig.getOrRequestAuthToken((token) => {
                expect(token).toBeTruthy();
                expect(token).not.toEqual(null);
                expect(tConfig.authToken).toBe(token);
            });
        });
    });
});
