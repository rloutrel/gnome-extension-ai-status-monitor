// GNOME Shell entry point: enable/disable lifecycle only.
// Targets GNOME Shell 50/51 (ESM imports resource:///org/gnome/shell/...).
import St from 'gi://St';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {_debug} from './logger.js';
import {Indicator} from './indicator.js';

export default class AiStatusMonitorExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this.initTranslations();
    }

    enable() {
        _debug('enable() enter');
        this._indicator = new Indicator({
            extensionPath: this.path,
            openPreferences: () => this.openPreferences(),
        });
        this._indicator.setup();
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        this._stylesheet = Gio.File.new_for_path(
            GLib.build_filenamev([this.path, 'stylesheet.css']));
        St.ThemeContext.get_for_stage(global.stage).get_theme()
            .load_stylesheet(this._stylesheet);
        _debug('enable() exit');
    }

    disable() {
        _debug('disable() enter');
        if (this._stylesheet) {
            St.ThemeContext.get_for_stage(global.stage).get_theme()
                .unload_stylesheet(this._stylesheet);
            this._stylesheet = null;
        }
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        _debug('disable() exit');
    }
}
