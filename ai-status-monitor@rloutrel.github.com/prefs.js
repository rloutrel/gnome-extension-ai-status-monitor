// Preferences page. Runs in a separate GTK4/Adwaita process, without
// access to GNOME Shell.
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class AiStatusMonitorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: _('Sample'),
            description: _('Example settings group'),
        });
        page.add(group);

        const sampleRow = new Adw.ActionRow({
            title: _('Sample boolean setting'),
        });
        group.add(sampleRow);

        const sampleSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        sampleRow.add_suffix(sampleSwitch);

        settings.bind('sample-boolean', sampleSwitch, 'active',
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
