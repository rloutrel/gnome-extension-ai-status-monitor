// Status feed fetcher. GJS-only: uses libsoup async APIs inside GNOME Shell.
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Soup from 'gi://Soup';
import {_debug, _warn} from './logger.js';
import {fromStatuspageSummary} from './statusModel.js';

export class StatusFetcher {
    constructor() {
        this._session = new Soup.Session();
        this._cancellable = new Gio.Cancellable();
    }

    fetch(provider, callback) {
        const message = Soup.Message.new('GET', provider.statusUrl);
        this._session.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            this._cancellable,
            (session, result) => {
                try {
                    const bytes = session.send_and_read_finish(result);
                    const body = bytes.get_data();
                    if (!body || body.length === 0)
                        throw new Error('Empty response');
                    const summary = JSON.parse(
                        new TextDecoder().decode(body));
                    callback({status: fromStatuspageSummary(summary), summary},
                        null);
                } catch (e) {
                    _warn(`Fetch failed for ${provider.id}: ${e.message}`);
                    callback(null, e);
                }
            });
    }

    destroy() {
        this._cancellable.cancel();
        this._session = null;
    }
}
