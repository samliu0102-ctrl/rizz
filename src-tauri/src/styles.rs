//! Switching the active post-processing style from anywhere: the settings
//! window, the tray menu, or the cycle shortcut. Every path goes through
//! [`select_style`] so the tray, the settings window and the overlay agree.

use crate::settings::{self, ShortcutBinding};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

/// The id of the style after `current` in `ids`, wrapping around. Starts at
/// the first style when `current` is missing or unknown.
pub fn next_style_id<'a>(ids: &[&'a str], current: Option<&str>) -> Option<&'a str> {
    if ids.is_empty() {
        return None;
    }
    let next = current
        .and_then(|current| ids.iter().position(|id| *id == current))
        .map(|i| (i + 1) % ids.len())
        .unwrap_or(0);
    Some(ids[next])
}

/// Makes `id` the active style.
pub fn select_style(app: &AppHandle, id: &str) -> Result<(), String> {
    let mut settings = settings::get_settings(app);
    if !settings.post_process_prompts.iter().any(|p| p.id == id) {
        return Err(format!("Prompt with id '{}' not found", id));
    }

    settings.post_process_selected_prompt_id = Some(id.to_string());
    settings::write_settings(app, settings);

    let _ = app.emit(
        "settings-changed",
        serde_json::json!({ "setting": "post_process_selected_prompt_id", "value": id }),
    );
    crate::tray::update_tray_menu(app);
    Ok(())
}

/// How long the picker stays up after the last key.
const PICKER_HOLD: Duration = Duration::from_millis(1600);

/// Bumped on every picker key, so only the last one's timer closes it.
static PICKER_GENERATION: AtomicU64 = AtomicU64::new(0);
/// Whether the picker's arrow and Return keys are registered.
static PICKER_KEYS: Mutex<bool> = Mutex::new(false);

/// Keys that work only while the picker is up: the arrows, held with the
/// switch shortcut's own modifiers (Option+Shift by default), so the user
/// keeps holding them and steps with ↑↓. A bare arrow can't be a macOS global
/// shortcut.
fn picker_bindings(app: &AppHandle) -> Vec<ShortcutBinding> {
    let cycle = settings::get_settings(app)
        .bindings
        .get("cycle_style")
        .map(|b| b.current_binding.clone())
        .unwrap_or_default();
    picker_keys(&cycle)
        .into_iter()
        .map(|(id, key)| ShortcutBinding {
            id: id.to_string(),
            name: id.to_string(),
            description: String::new(),
            default_binding: key.clone(),
            current_binding: key,
        })
        .collect()
}

/// The picker's (binding id, shortcut) pairs for a given switch shortcut.
pub fn picker_keys(cycle_binding: &str) -> Vec<(&'static str, String)> {
    let modifiers = cycle_binding
        .rsplit_once('+')
        .map(|(mods, _)| format!("{mods}+"))
        .unwrap_or_default();
    vec![
        ("style_up", format!("{modifiers}up")),
        ("style_down", format!("{modifiers}down")),
    ]
}

/// The index `delta` steps from `current` in a list of `len`, wrapping.
/// Starts at the first style when `current` is unknown.
pub fn step_index(len: usize, current: Option<usize>, delta: i32) -> Option<usize> {
    if len == 0 {
        return None;
    }
    Some(match current {
        Some(i) => (i as i32 + delta).rem_euclid(len as i32) as usize,
        None => 0,
    })
}

/// Moves the active style `delta` places among the visible styles and shows
/// the picker, whose arrow keys keep moving it until it closes.
pub fn step_style(app: &AppHandle, delta: i32) {
    let settings = settings::get_settings(app);
    let visible: Vec<(String, String)> = settings
        .post_process_prompts
        .iter()
        .filter(|p| !p.hidden)
        .map(|p| (p.id.clone(), p.name.clone()))
        .collect();
    let current = settings
        .post_process_selected_prompt_id
        .as_deref()
        .and_then(|id| visible.iter().position(|(v, _)| v == id));
    let Some(next) = step_index(visible.len(), current, delta) else {
        return;
    };
    if let Err(e) = select_style(app, &visible[next].0) {
        log::error!("Failed to switch style: {e}");
        return;
    }

    let names = visible.into_iter().map(|(_, name)| name).collect();
    if !crate::overlay::show_style_picker(app, names, next) {
        return;
    }
    let generation = PICKER_GENERATION.fetch_add(1, Ordering::SeqCst) + 1;
    set_picker_keys(app, true);
    let app = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(PICKER_HOLD);
        if PICKER_GENERATION.load(Ordering::SeqCst) == generation {
            close_picker(&app);
        }
    });
}

/// Switches to the next style in the list.
pub fn cycle_style(app: &AppHandle) {
    step_style(app, 1);
}

/// Hides the picker and gives the arrow and Return keys back.
pub fn close_picker(app: &AppHandle) {
    PICKER_GENERATION.fetch_add(1, Ordering::SeqCst);
    set_picker_keys(app, false);
    crate::overlay::hide_style_picker(app);
}

/// Registers or releases the picker keys off the shortcut thread, which must
/// not block on registration.
fn set_picker_keys(app: &AppHandle, want: bool) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let mut registered = PICKER_KEYS.lock().unwrap_or_else(|e| e.into_inner());
        if *registered == want {
            return;
        }
        for binding in picker_bindings(&app) {
            let result = if want {
                crate::shortcut::register_shortcut(&app, binding)
            } else {
                crate::shortcut::unregister_shortcut(&app, binding)
            };
            if let Err(e) = result {
                log::warn!("Style picker key: {e}");
            }
        }
        *registered = want;
    });
}

/// Puts `prompts` in the order of `ids`. Styles missing from `ids` keep their
/// relative order at the end, so a stale list never loses one.
pub fn order_by_ids(prompts: &mut [settings::LLMPrompt], ids: &[String]) {
    prompts.sort_by_key(|p| ids.iter().position(|id| *id == p.id).unwrap_or(usize::MAX));
}

/// Sets the order styles appear in, in settings, the tray and the cycle.
#[tauri::command]
#[specta::specta]
pub fn reorder_styles(app: AppHandle, ids: Vec<String>) -> Result<(), String> {
    let mut settings = settings::get_settings(&app);
    order_by_ids(&mut settings.post_process_prompts, &ids);
    settings::write_settings(&app, settings);
    crate::tray::update_tray_menu(&app);
    Ok(())
}

/// Hides a style from the cycle shortcut and the tray, or shows it again.
#[tauri::command]
#[specta::specta]
pub fn set_style_hidden(app: AppHandle, id: String, hidden: bool) -> Result<(), String> {
    let mut settings = settings::get_settings(&app);
    let style = settings
        .post_process_prompts
        .iter_mut()
        .find(|p| p.id == id)
        .ok_or_else(|| format!("Prompt with id '{}' not found", id))?;
    style.hidden = hidden;
    settings::write_settings(&app, settings);
    crate::tray::update_tray_menu(&app);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{next_style_id, order_by_ids, step_index};
    use crate::settings::LLMPrompt;

    fn prompt(id: &str) -> LLMPrompt {
        LLMPrompt {
            id: id.to_string(),
            name: id.to_string(),
            prompt: String::new(),
            hidden: false,
        }
    }

    #[test]
    fn picker_keys_reuse_the_switch_modifiers() {
        let keys = super::picker_keys("shift+option+s");
        assert_eq!(keys[0], ("style_up", "shift+option+up".to_string()));
        assert_eq!(keys[1], ("style_down", "shift+option+down".to_string()));
        assert_eq!(super::picker_keys("f6")[0].1, "up");
    }

    #[test]
    fn picker_steps_wrap_both_ways() {
        assert_eq!(step_index(3, Some(0), -1), Some(2));
        assert_eq!(step_index(3, Some(2), 1), Some(0));
        assert_eq!(step_index(3, None, 1), Some(0));
        assert_eq!(step_index(0, None, 1), None);
    }

    #[test]
    fn styles_follow_the_given_order_and_keep_unlisted_ones() {
        let mut prompts = vec![prompt("a"), prompt("b"), prompt("c"), prompt("d")];
        order_by_ids(&mut prompts, &["c".to_string(), "a".to_string()]);
        let ids: Vec<&str> = prompts.iter().map(|p| p.id.as_str()).collect();
        assert_eq!(ids, ["c", "a", "b", "d"]);
    }

    #[test]
    fn cycles_forward_and_wraps() {
        let ids = ["a", "b", "c"];
        assert_eq!(next_style_id(&ids, Some("a")), Some("b"));
        assert_eq!(next_style_id(&ids, Some("c")), Some("a"));
    }

    #[test]
    fn unknown_or_missing_starts_at_first() {
        let ids = ["a", "b"];
        assert_eq!(next_style_id(&ids, Some("zzz")), Some("a"));
        assert_eq!(next_style_id(&ids, None), Some("a"));
        assert_eq!(next_style_id(&[], None), None);
    }
}
