import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";
import settings from "./settings.json";

(window as any).__TAURI_OS_PLUGIN_INTERNALS__ = {
  platform: "macos", os_type: "macos", family: "unix", version: "26.0",
  arch: "aarch64", exe_extension: "", eol: "\n",
};
mockWindows("main");
const s: any = { ...settings, post_process_prompts: [{ id: "default_original", name: "Original", prompt: "", hidden: false }, ...(settings as any).post_process_prompts], onboarding_completed: true, post_process_provider_id: "anthropic" };
s.post_process_api_keys = { ...s.post_process_api_keys, anthropic: "x".repeat(48) };
s.post_process_models = { ...s.post_process_models, anthropic: "claude-haiku-5-5" };
const models = [
  { id: "parakeet-tdt-0.6b-v3", name: "Parakeet V3", description: "Fast and accurate", filename: "x", url: null, size_mb: 478, is_downloaded: true, is_downloading: false, partial_size: 0, is_directory: false, engine_type: "Parakeet", accuracy_score: 0.8, speed_score: 0.9, supports_translation: false, is_recommended: true, supported_languages: ["en"], is_custom: false },
];
mockIPC(
  (cmd, args: any) => {
    const ok = (v: any) => v;
    switch (cmd) {
      case "get_app_settings": return ok(s);
      case "get_default_settings": return ok(s);
      case "get_available_models": return ok(models);
      case "get_current_model": return ok(s.selected_model ?? "parakeet-tdt-0.6b-v3");
      case "get_available_microphones": return ok([{ index: "default", name: "Default", is_default: true }]);
      case "get_available_output_devices": return ok([{ index: "default", name: "Default", is_default: true }]);
      case "get_active_notices": return [];
      case "get_retired_models": return [];
      case "get_history_entries": return ok({ entries: [], has_more: false, total: 0 });
      case "set_post_process_selected_prompt":
        s.post_process_selected_prompt_id = args.id; return null;
      case "reorder_styles": {
        s.post_process_prompts.sort((a: any, b: any) => args.ids.indexOf(a.id) - args.ids.indexOf(b.id));
        return null;
      }
      case "set_style_hidden": {
        s.post_process_prompts.find((p: any) => p.id === args.id).hidden = args.hidden; return null;
      }
      case "set_post_process_provider":
        s.post_process_provider_id = args.providerId; return null;
      case "change_post_process_model_setting":
        s.post_process_models[args.providerId] = args.model; return null;
      case "delete_post_process_prompt":
        console.log("[mock] delete", args.id);
        s.post_process_prompts = s.post_process_prompts.filter((p: any) => p.id !== args.id);
        return null;
      case "plugin:os|platform": return "macos";
      case "plugin:os|locale": return "en-US";
      case "plugin:app|version": return "0.10.1";
      case "plugin:app|name": return "Handy";
    }
    if (cmd.startsWith("change_") || cmd.startsWith("update_") || cmd.startsWith("set_")) {
      const [k, v] = Object.entries(args ?? {})[0] ?? [];
      return null;
    }
    if (cmd.includes("permission")) return true;
    console.debug("[mock] unhandled", cmd, args);
    return null;
  },
  { shouldMockEvents: true },
);
if (location.search.includes("overlay")) {
  await import("../src/overlay/main.tsx");
  const { emit } = await import("@tauri-apps/api/event");
  const names = s.post_process_prompts.map((p: any) => p.name);
  const show = async (index: number) => {
    await emit("overlay-style", { names, index });
    await emit("show-overlay", "style");
  };
  (window as any).showPicker = show;
  setTimeout(() => show(5), 500);
} else {
  await import("../src/main.tsx");
}
