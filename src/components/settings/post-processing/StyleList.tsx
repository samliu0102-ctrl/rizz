import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Check,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { commands, type LLMPrompt } from "@/bindings";
import { Textarea } from "@/components/ui";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { useSettings } from "../../../hooks/useSettings";
import { VoiceProfileBuilder } from "./VoiceProfileBuilder";

interface EditorProps {
  name: string;
  prompt: string;
  saveLabel: string;
  onSave: (name: string, prompt: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const StyleEditor: React.FC<EditorProps> = ({
  name: initialName,
  prompt: initialPrompt,
  saveLabel,
  onSave,
  onCancel,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [prompt, setPrompt] = useState(initialPrompt);
  const ready = name.trim() && prompt.trim();

  return (
    <div className="flex flex-col gap-2 ps-9 pe-3 pb-3">
      <Input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("settings.postProcessing.prompts.voiceProfile.name")}
        variant="compact"
        className="w-full"
      />
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full !min-h-56"
      />
      <div className="flex gap-2 pt-1">
        <Button
          onClick={() => onSave(name.trim(), prompt.trim())}
          variant="primary"
          size="md"
          disabled={!ready}
        >
          {saveLabel}
        </Button>
        <Button onClick={onCancel} variant="secondary" size="md">
          {t("settings.postProcessing.prompts.cancel")}
        </Button>
        {onDelete && (
          <Button
            onClick={onDelete}
            variant="secondary"
            size="md"
            className="ml-auto"
          >
            {t("settings.postProcessing.prompts.deletePrompt")}
          </Button>
        )}
      </div>
    </div>
  );
};

type Adding =
  | { kind: "profile" }
  | { kind: "form"; name: string; prompt: string }
  | null;

/** The styles, in the order the cycle shortcut and the tray use. */
export const StyleList: React.FC = () => {
  const { t } = useTranslation();
  const { getSetting, updateSetting, refreshSettings } = useSettings();
  const prompts: LLMPrompt[] = getSetting("post_process_prompts") || [];
  const selectedId = getSetting("post_process_selected_prompt_id") || "";

  const [editingId, setEditingId] = useState<string | null>(null);
  // A first click on the trash arms it; a second one deletes.
  const [armedId, setArmedId] = useState<string | null>(null);
  const [adding, setAdding] = useState<Adding>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const rows = useRef(new Map<string, HTMLDivElement>());

  const byId = new Map(prompts.map((p) => [p.id, p]));
  const ordered = (dragOrder ?? prompts.map((p) => p.id))
    .map((id) => byId.get(id))
    .filter((p): p is LLMPrompt => !!p);
  const visibleCount = prompts.filter((p) => !p.hidden).length;

  const startDrag = (e: React.PointerEvent, id: string) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setEditingId(null);
    setDragId(id);
    setDragOrder(prompts.map((p) => p.id));
  };

  const moveDrag = (e: React.PointerEvent) => {
    if (!dragId || !dragOrder) return;
    const others = dragOrder.filter((id) => id !== dragId);
    const target = others.filter((id) => {
      const rect = rows.current.get(id)?.getBoundingClientRect();
      return rect ? rect.top + rect.height / 2 < e.clientY : false;
    }).length;
    const next = [...others];
    next.splice(target, 0, dragId);
    if (next.join() !== dragOrder.join()) setDragOrder(next);
  };

  const endDrag = async () => {
    const order = dragOrder;
    setDragId(null);
    if (order && order.join() !== prompts.map((p) => p.id).join()) {
      await commands.reorderStyles(order);
      await refreshSettings();
    }
    setDragOrder(null);
  };

  const toggleHidden = async (style: LLMPrompt) => {
    await commands.setStyleHidden(style.id, !style.hidden);
    await refreshSettings();
  };

  const save = async (id: string, name: string, prompt: string) => {
    await commands.updatePostProcessPrompt(id, name, prompt);
    await refreshSettings();
    setEditingId(null);
  };

  const remove = async (id: string) => {
    const result = await commands.deletePostProcessPrompt(id);
    if (result.status === "error") console.error(result.error);
    await refreshSettings();
    setEditingId(null);
    setArmedId(null);
  };

  const create = async (name: string, prompt: string) => {
    const result = await commands.addPostProcessPrompt(name, prompt);
    if (result.status === "ok") {
      await refreshSettings();
      updateSetting("post_process_selected_prompt_id", result.data.id);
      setAdding(null);
    }
  };

  return (
    <>
      {ordered.map((style) => {
        const selected = style.id === selectedId;
        const lastVisible = !style.hidden && visibleCount <= 1;
        return (
          <div
            key={style.id}
            ref={(el) => {
              if (el) rows.current.set(style.id, el);
              else rows.current.delete(style.id);
            }}
            className={dragId === style.id ? "bg-wash" : undefined}
          >
            <div
              className="group flex items-center gap-1.5 h-10 px-2 hover:bg-wash/60"
              onMouseLeave={() => armedId === style.id && setArmedId(null)}
            >
              <span
                className="flex h-7 w-5 items-center justify-center text-ink-3 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => startDrag(e, style.id)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <GripVertical className="h-4 w-4" />
              </span>
              <button
                type="button"
                onClick={() =>
                  updateSetting("post_process_selected_prompt_id", style.id)
                }
                className={`flex-1 min-w-0 truncate text-left text-[13px] ${
                  style.hidden ? "text-ink-3" : ""
                }`}
              >
                {style.name}
              </button>
              {selected && <Check className="h-4 w-4 text-logo-primary" />}
              {style.prompt && (
                <button
                  type="button"
                  aria-label={t("settings.postProcessing.prompts.edit")}
                  onClick={() =>
                    setEditingId(editingId === style.id ? null : style.id)
                  }
                  className="flex h-7 w-7 items-center justify-center rounded text-ink-3 hover:text-ink-2 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                aria-label={
                  style.hidden
                    ? t("settings.postProcessing.prompts.show")
                    : t("settings.postProcessing.prompts.hide")
                }
                onClick={() => toggleHidden(style)}
                disabled={lastVisible}
                className={`flex h-7 w-7 items-center justify-center rounded text-ink-3 hover:text-ink-2 disabled:opacity-30 ${
                  style.hidden ? "" : "opacity-0 group-hover:opacity-100"
                } focus:opacity-100`}
              >
                {style.hidden ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
              {prompts.length > 1 && (
                <button
                  type="button"
                  aria-label={
                    armedId === style.id
                      ? t("settings.postProcessing.prompts.confirmDelete")
                      : t("settings.postProcessing.prompts.deletePrompt")
                  }
                  onClick={() =>
                    armedId === style.id
                      ? remove(style.id)
                      : setArmedId(style.id)
                  }
                  className={`flex h-7 items-center justify-center gap-1 rounded px-1.5 text-xs focus:opacity-100 ${
                    armedId === style.id
                      ? "text-error bg-error-wash"
                      : "w-7 text-ink-3 hover:text-ink-2 opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {armedId === style.id &&
                    t("settings.postProcessing.prompts.confirmDelete")}
                </button>
              )}
            </div>
            {editingId === style.id && (
              <StyleEditor
                name={style.name}
                prompt={style.prompt}
                saveLabel={t("settings.postProcessing.prompts.updatePrompt")}
                onSave={(name, prompt) => save(style.id, name, prompt)}
                onCancel={() => setEditingId(null)}
                onDelete={
                  prompts.length > 1 ? () => remove(style.id) : undefined
                }
              />
            )}
          </div>
        );
      })}

      {adding?.kind === "profile" && (
        <div className="ps-9 pe-3 py-3">
          <VoiceProfileBuilder
            onBuilt={(name, prompt) =>
              setAdding({ kind: "form", name, prompt })
            }
            onWriteOwn={() => setAdding({ kind: "form", name: "", prompt: "" })}
            onCancel={() => setAdding(null)}
          />
        </div>
      )}
      {adding?.kind === "form" && (
        <StyleEditor
          name={adding.name}
          prompt={adding.prompt}
          saveLabel={t("settings.postProcessing.prompts.createPrompt")}
          onSave={create}
          onCancel={() => setAdding(null)}
        />
      )}
      {!adding && (
        <div className="px-2 py-1">
          <Button
            onClick={() => {
              setEditingId(null);
              setAdding({ kind: "profile" });
            }}
            variant="ghost"
            size="sm"
            className="inline-flex items-center gap-1.5 text-logo-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("settings.postProcessing.prompts.createNew")}
          </Button>
        </div>
      )}
    </>
  );
};
