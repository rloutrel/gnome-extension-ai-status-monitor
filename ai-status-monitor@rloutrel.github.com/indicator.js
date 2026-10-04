// Panel indicator: menu construction, rendering and polling.
// Pure logic lives in pure modules (see AGENTS.md); this file only wires
// GJS widgets and keeps the enable()/disable() lifecycle clean.
import St from 'gi://St';
import GLib from 'gi://GLib';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {_debug} from './logger.js';
import {greet} from './sampleModule.js';

export class Indicator extends PanelMenu.Button {
    constructor({extensionPath, openPreferences}) {
        super(0.0, _('AiStatusMonitor'));
        this._extensionPath = extensionPath;
        this._openPreferences = openPreferences;
        this._pollTimeoutId = null;
    }

    setup() {
        this._addIcon();
        this._buildMenu();
        this._startPolling();
    }

    _addIcon() {
        const icon = new St.Icon({
            icon_name: 'applications-science-symbolic',
            style_class: 'system-status-icon',
        });
        this.add_child(icon);
    }

    _buildMenu() {
        this.menu.removeAll();
        this.menu.addMenuItem(new PopupMenu.PopupMenuItem(greet('GNOME')));
        const prefsItem = this.menu.addAction(_('Preferences'),
            () => this._openPreferences());
        prefsItem.label.add_style_class_name('ai-status-monitor-menu-label');
    }

    _startPolling() {
        this._stopPolling();
        this._pollTimeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT, 5, () => {
                this._buildMenu();
                return GLib.SOURCE_CONTINUE;
            });
    }

    _stopPolling() {
        if (this._pollTimeoutId) {
            GLib.source_remove(this._pollTimeoutId);
            this._pollTimeoutId = null;
        }
    }

    destroy() {
        _debug('indicator destroy()');
        this._stopPolling();
        super.destroy();
    }
}
