// Preferences page. Runs in a separate GTK4/Adwaita process, without
// access to GNOME Shell.
import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {PROVIDERS, defaultEnabledIds} from './providers.js';

export default class AiStatusMonitorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        const providersGroup = new Adw.PreferencesGroup({
            title: _('Providers'),
            description: _('AI subscriptions to follow in the top bar'),
        });
        page.add(providersGroup);

        const enabled = new Set(settings.get_strv('enabled-providers'));
        const apiKeyRows = new Map();
        for (const provider of PROVIDERS) {
            const row = new Adw.ActionRow({title: provider.name});
            providersGroup.add(row);

            const check = Gtk.CheckButton.new();
            check.set_valign(Gtk.Align.CENTER);
            if (enabled.has(provider.id))
                check.set_active(true);
            check.connect('toggled', () => {
                const ids = new Set(settings.get_strv('enabled-providers'));
                if (check.get_active())
                    ids.add(provider.id);
                else
                    ids.delete(provider.id);
                settings.set_strv('enabled-providers', [...ids]);
                if (apiKeyRows.has(provider.id))
                    apiKeyRows.get(provider.id).visible = check.get_active();
            });
            row.add_suffix(check);

            if (provider.requiresApiKey) {
                const keyRow = new Adw.ActionRow({
                    title: _('API key'),
                    subtitle: _(
                        'Required to follow this provider usage and limits'),
                });
                providersGroup.add(keyRow);
                apiKeyRows.set(provider.id, keyRow);
                keyRow.visible = enabled.has(provider.id);

                const keyEntry = Gtk.Entry.new();
                keyEntry.set_valign(Gtk.Align.CENTER);
                keyEntry.set_width_chars(32);
                keyEntry.set_input_purpose(Gtk.InputPurpose.PASSWORD);
                keyEntry.set_visibility(false);
                keyEntry.set_placeholder_text(_('Paste your API key'));
                const keys = settings.get_value('api-keys').deepUnpack();
                keyEntry.set_text(keys[provider.id] ?? '');
                keyEntry.connect('changed', () => {
                    const current = settings.get_value('api-keys').deepUnpack();
                    if (keyEntry.get_text().length > 0)
                        current[provider.id] = keyEntry.get_text();
                    else
                        delete current[provider.id];
                    const value = new GLib.Variant('a{ss}', current);
                    settings.set_value('api-keys', value);
                });
                keyRow.add_suffix(keyEntry);

                const openKeyButton = Gtk.Button.new_from_icon_name(
                    'adw-external-link-symbolic');
                openKeyButton.set_valign(Gtk.Align.CENTER);
                openKeyButton.set_tooltip_text(_('Create an API key'));
                openKeyButton.connect('clicked', () => {
                    Gtk.show_uri(window, provider.keyUrl, Gdk.CURRENT_TIME);
                });
                keyRow.add_suffix(openKeyButton);
            }
        }

        const resetRow = new Adw.ActionRow({
            title: _('Reset to defaults'),
        });
        providersGroup.add(resetRow);
        const resetButton = new Gtk.Button({
            label: _('Reset'),
            valign: Gtk.Align.CENTER,
        });
        resetButton.connect('clicked', () => {
            settings.set_strv('enabled-providers', defaultEnabledIds());
            settings.set_int('poll-interval', 300);
        });
        resetRow.add_suffix(resetButton);

        const generalGroup = new Adw.PreferencesGroup({
            title: _('Polling'),
        });
        page.add(generalGroup);

        const intervalRow = new Adw.ActionRow({
            title: _('Poll interval'),
            subtitle: _('Seconds between status checks (minimum 60)'),
        });
        generalGroup.add(intervalRow);
        const intervalSpin = Gtk.SpinButton.new_with_range(60, 3600, 30);
        intervalSpin.set_valign(Gtk.Align.CENTER);
        intervalRow.add_suffix(intervalSpin);
        settings.bind('poll-interval', intervalSpin, 'value',
            Gio.SettingsBindFlags.DEFAULT);

        const creditsGroup = new Adw.PreferencesGroup({
            title: _('Credits'),
        });
        page.add(creditsGroup);

        const creditsRow = new Adw.ActionRow({
            title: _('Assisted by'),
        });
        const mistralLink = new Gtk.Label({
            label: `<a href="https://mistral.ai">Mistral Code</a>`,
            use_markup: true,
            valign: Gtk.Align.CENTER,
        });
        creditsRow.add_suffix(mistralLink);
        creditsGroup.add(creditsRow);
    }
}
