import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";
import { MessagesSquare } from "lucide-react";
import { commands } from "@/bindings";
import { Textarea } from "@/components/ui";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import {
  defaultSpeaker,
  findSpeakers,
  parseMessages,
  samplesFor,
} from "@/lib/voiceSamples";

const SAMPLE_EXTENSIONS = [
  "txt",
  "md",
  "csv",
  "png",
  "jpg",
  "jpeg",
  "heic",
  "tiff",
  "webp",
];

interface Props {
  onBuilt: (name: string, prompt: string) => void;
  onWriteOwn: () => void;
  onCancel: () => void;
}

export const VoiceProfileBuilder: React.FC<Props> = ({
  onBuilt,
  onWriteOwn,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [samples, setSamples] = useState("");
  const [speaker, setSpeaker] = useState<string | null>(null);
  const [busy, setBusy] = useState<"reading" | "building" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messages = useMemo(() => parseMessages(samples), [samples]);
  const speakers = useMemo(() => findSpeakers(messages), [messages]);
  const chosen =
    speaker && speakers.includes(speaker) ? speaker : defaultSpeaker(speakers);

  const addFiles = async () => {
    const selected = await open({
      multiple: true,
      directory: false,
      filters: [{ name: "", extensions: SAMPLE_EXTENSIONS }],
    });
    if (!selected) return;
    const paths = Array.isArray(selected) ? selected : [selected];
    setBusy("reading");
    setError(null);
    try {
      const result = await commands.readVoiceSamples(paths);
      if (result.status === "ok") {
        setSamples((prev) =>
          [prev.trim(), result.data].filter(Boolean).join("\n"),
        );
      } else {
        setError(result.error);
      }
    } finally {
      setBusy(null);
    }
  };

  const build = async () => {
    setBusy("building");
    setError(null);
    try {
      const result = await commands.buildVoiceProfile(
        name.trim(),
        samplesFor(messages, chosen),
      );
      if (result.status === "ok") {
        onBuilt(name.trim(), result.data);
      } else {
        setError(result.error);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2.5 rounded-md bg-logo-primary/10 px-3 py-2.5">
        <MessagesSquare className="mt-0.5 h-4 w-4 shrink-0 text-logo-primary" />
        <div>
          <p className="text-[13px] font-medium">
            {t("settings.postProcessing.prompts.voiceProfile.headline")}
          </p>
          <p className="text-[12px] text-mid-gray">
            {t("settings.postProcessing.prompts.voiceProfile.hint")}
          </p>
        </div>
      </div>
      <Input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("settings.postProcessing.prompts.voiceProfile.name")}
        variant="compact"
        className="w-full"
      />

      <Textarea
        value={samples}
        onChange={(e) => setSamples(e.target.value)}
        placeholder={t("settings.postProcessing.prompts.voiceProfile.samples")}
        className="w-full !min-h-40"
      />

      {speakers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {speakers.map((s) => (
            <Button
              key={s}
              onClick={() => setSpeaker(s)}
              variant={s === chosen ? "primary" : "secondary"}
              size="sm"
            >
              {s}
            </Button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-error">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button
          onClick={build}
          variant="primary"
          size="md"
          disabled={!name.trim() || !samples.trim() || busy !== null}
        >
          {busy === "building"
            ? t("settings.postProcessing.prompts.voiceProfile.building")
            : t("settings.postProcessing.prompts.voiceProfile.build")}
        </Button>
        <Button
          onClick={addFiles}
          variant="secondary"
          size="md"
          disabled={busy !== null}
        >
          {busy === "reading"
            ? t("settings.postProcessing.prompts.voiceProfile.reading")
            : t("settings.postProcessing.prompts.voiceProfile.addFiles")}
        </Button>
        <Button onClick={onCancel} variant="secondary" size="md">
          {t("settings.postProcessing.prompts.cancel")}
        </Button>
        <Button
          onClick={onWriteOwn}
          variant="ghost"
          size="md"
          className="ml-auto"
        >
          {t("settings.postProcessing.prompts.writeOwn")}
        </Button>
      </div>
    </div>
  );
};
