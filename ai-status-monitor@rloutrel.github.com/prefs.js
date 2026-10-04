// Preferences page. Runs in a separate GTK4/Adwaita process, without
// access to GNOME Shell.
import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {PROVIDERS, defaultEnabledIds} from './providers.js';

const MISTRAL_CONSOLE_API_KEY_URL =
    'https://console.mistral.ai/api-keys/new';

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
            });
            row.add_suffix(check);
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

        const mistralGroup = new Adw.PreferencesGroup({
            title: _('Mistral'),
            description: _(
                'Follow your Mistral usage and spending limits with the Admin API'),
        });
        page.add(mistralGroup);

        const apiKeyRow = new Adw.ActionRow({
            title: _('Admin API key'),
            subtitle: _(
                'Create a dedicated Admin API key: it grants read access to ' +
                'usage and limits without consuming credits'),
        });
        mistralGroup.add(apiKeyRow);

        const generateKeyButton = new Gtk.Button({
            label: _('Generate'),
            valign: Gtk.Align.CENTER,
        });
        generateKeyButton.connect('clicked', () => {
            Gtk.show_uri(window, MISTRAL_CONSOLE_API_KEY_URL,
                Gdk.CURRENT_TIME);
        });
        apiKeyRow.add_suffix(generateKeyButton);

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
