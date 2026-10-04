// Panel indicator: menu construction, rendering and polling.
// Pure logic lives in pure modules (see AGENTS.md); this file only wires
// GJS widgets and keeps the enable()/disable() lifecycle clean.
import St from 'gi://St';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {_debug} from './logger.js';
import {enabledProviders} from './providers.js';
import {
    STATUS_UNKNOWN,
    STATUS_PRIORITY,
    describe,
    worstOf,
    themeClasses,
} from './statusModel.js';
import {StatusFetcher} from './statusFetcher.js';

export const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        constructor({extensionPath, openPreferences, settings}) {
            super(0.0, _('AI Status Monitor'));
            this._extensionPath = extensionPath;
            this._openPreferences = openPreferences;
            this._settings = settings;
            this._pollTimeoutId = null;
            this._fetcher = new StatusFetcher();
            this._statuses = new Map();
            this._menuItems = new Map();
            this._settingsConnections = [];
        }

    setup() {
        this._addIcon();
        this._buildMenu();
        this._connectSettings();
        this._startPolling();
    }

    _addIcon() {
        this._icon = new St.Icon({
            icon_name: 'applications-science-symbolic',
            style_class: 'system-status-icon',
        });
        this.add_child(this._icon);
    }

    _connectSettings() {
        this._settingsConnections.push(
            this._settings.connect('changed::poll-interval', () => {
                this._startPolling();
            })
        );
        this._settingsConnections.push(
            this._settings.connect('changed::enabled-providers', () => {
                this._buildMenu();
                this._refresh();
            })
        );
    }

    _enabledProviders() {
        return enabledProviders(
            this._settings.get_strv('enabled-providers'));
    }

    _buildMenu() {
        this.menu.removeAll();
        this._menuItems.clear();
        for (const provider of this._enabledProviders()) {
            const item = new PopupMenu.PopupMenuItem(provider.name);
            const dot = new St.Label({
                text: '\u25cf',
                style_class: 'ai-status-monitor-dot',
            });
            item.add_child(dot);
            item.label.add_style_class_name(
                'ai-status-monitor-menu-label');
            item.connect('activate', () => {
                GLib.spawn_command_line_async(
                    `xdg-open ${provider.pageUrl}`);
            });
            this.menu.addMenuItem(item);
            this._menuItems.set(provider.id, {item, dot});
        }
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addAction(_('Preferences'), () => this._openPreferences());
    }

    _startPolling() {
        this._stopPolling();
        this._refresh();
        const interval = Math.max(60,
            this._settings.get_int('poll-interval'));
        this._pollTimeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT, interval, () => {
                this._refresh();
                return GLib.SOURCE_CONTINUE;
            });
    }

    _stopPolling() {
        if (this._pollTimeoutId) {
            GLib.source_remove(this._pollTimeoutId);
            this._pollTimeoutId = null;
        }
    }

    _refresh() {
        for (const provider of this._enabledProviders()) {
            this._fetcher.fetch(provider, ({status}) => {
                this._statuses.set(provider.id, status);
                this._applyStatus(provider.id, status);
            });
        }
    }

    _applyStatus(providerId, status) {
        const entry = this._menuItems.get(providerId);
        if (!entry)
            return;
        for (const known of STATUS_PRIORITY) {
            for (const cls of themeClasses(known))
                entry.dot.remove_style_class_name(cls);
        }
        entry.dot.add_style_class_name(...themeClasses(status));
        entry.item.label.text =
            `${entry.item.label.text.split(' — ')[0]} — ${describe(status)}`;
        this._updateIcon();
    }

    _updateIcon() {
        const worst = worstOf([...this._statuses.values()]) ||
            STATUS_UNKNOWN;
        this._icon.style_class =
            'system-status-icon ' + themeClasses(worst).join(' ');
    }

    destroy() {
        _debug('indicator destroy()');
        this._stopPolling();
        for (const id of this._settingsConnections)
            this._settings.disconnect(id);
        this._settingsConnections = [];
        this._fetcher.destroy();
        super.destroy();
    }
    });
