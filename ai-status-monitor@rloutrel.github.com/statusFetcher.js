// Status feed fetcher. GJS-only: uses libsoup async APIs inside GNOME Shell.
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Soup from 'gi://Soup';
import {_debug, _warn} from './logger.js';
import {fromStatuspageSummary, fromMistralAdmin} from './statusModel.js';
import {FEED_MISTRAL_ADMIN} from './providers.js';

export class StatusFetcher {
    constructor() {
        this._session = new Soup.Session();
        this._cancellable = new Gio.Cancellable();
    }

    fetch(provider, callback) {
        if (provider.feed === FEED_MISTRAL_ADMIN) {
            this._fetchMistral(provider, callback);
            return;
        }
        const message = Soup.Message.new('GET', provider.statusUrl);
        this._session.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            this._cancellable,
            (session, result) => {
                try {
                    const body = this._readBody(session, result);
                    const summary = JSON.parse(body);
                    callback({status: fromStatuspageSummary(summary), summary},
                        null);
                } catch (e) {
                    _warn(`Fetch failed for ${provider.id}: ${e.message}`);
                    callback(null, e);
                }
            });
    }

    _fetchMistral(provider, callback) {
        const apiKey = provider.apiKey;
        if (!apiKey) {
            callback(null, new Error('Missing API key'));
            return;
        }
        const now = new Date();
        const usageUrl = `${provider.statusUrl}` +
            `?month=${now.getMonth() + 1}&year=${now.getFullYear()}`;
        this._fetchJson(usageUrl, apiKey, (usage, usageError) => {
            if (usageError) {
                _warn(`Fetch failed for ${provider.id}: ${usageError.message}`);
                callback(null, usageError);
                return;
            }
            const limitUrl = provider.spendLimitUrl;
            this._fetchJson(limitUrl, apiKey, (spendLimit, limitError) => {
                if (limitError) {
                    _warn(`Spend limit fetch failed for ${provider.id}: ` +
                        `${limitError.message}`);
                }
                const result = fromMistralAdmin(usage, spendLimit ?? null);
                callback(result, null);
            });
        });
    }

    _fetchJson(url, apiKey, callback) {
        const message = Soup.Message.new('GET', url);
        message.get_request_headers().append('x-api-key', apiKey);
        this._session.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            this._cancellable,
            (session, result) => {
                try {
                    const body = this._readBody(session, result);
                    callback(JSON.parse(body), null);
                } catch (e) {
                    callback(null, e);
                }
            });
    }

    _readBody(session, result) {
        const bytes = session.send_and_read_finish(result);
        const body = bytes.get_data();
        if (!body || body.length === 0)
            throw new Error('Empty response');
        return new TextDecoder().decode(body);
    }

    destroy() {
        this._cancellable.cancel();
        this._session = null;
    }
}
