import React from "react";

interface SettingContainerProps {
  title: string;
  description: string;
  children: React.ReactNode;
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
  layout?: "horizontal" | "stacked";
  disabled?: boolean;
  tooltipPosition?: "top" | "bottom";
  /** Horizontal only: the control takes the row's free width, for content that fits itself to it. */
  grow?: boolean;
}

export const SettingContainer: React.FC<SettingContainerProps> = ({
  title,
  description,
  children,
  descriptionMode = "tooltip",
  grouped = false,
  layout = "horizontal",
  disabled = false,
  grow = false,
}) => {
  // Rows explain themselves by their title; descriptions stay for screen
  // readers only.
  const info = <span className="sr-only">{description}</span>;

  const containerClasses = grouped
    ? "px-4 p-2"
    : "px-4 p-2 rounded-lg border border-line";

  if (layout === "stacked") {
    if (descriptionMode === "tooltip") {
      return (
        <div className={containerClasses}>
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`text-[13px] ${disabled ? "opacity-50" : ""}`}>
              {title}
            </h3>
            {info}
          </div>
          <div className="w-full">{children}</div>
        </div>
      );
    }

    return (
      <div className={containerClasses}>
        <div className="mb-2">
          <h3 className={`text-[13px] ${disabled ? "opacity-50" : ""}`}>
            {title}
          </h3>
          <p className={`text-xs text-ink-3 ${disabled ? "opacity-50" : ""}`}>
            {description}
          </p>
        </div>
        <div className="w-full">{children}</div>
      </div>
    );
  }

  // Horizontal layout (default)
  const horizontalContainerClasses = `${
    grouped
      ? "flex items-center justify-between min-h-11 px-4 py-1.5"
      : "flex items-center justify-between min-h-11 px-4 py-1.5 rounded-lg border border-line"
  }${grow ? " gap-4" : ""}`;
  const titleClasses = grow ? "max-w-2/3 shrink-0" : "max-w-2/3";
  const controlClasses = grow
    ? "relative flex min-w-0 flex-1 justify-end"
    : "relative";

  if (descriptionMode === "tooltip") {
    return (
      <div className={horizontalContainerClasses}>
        <div className={titleClasses}>
          <div className="flex items-center gap-2">
            <h3 className={`text-[13px] ${disabled ? "opacity-50" : ""}`}>
              {title}
            </h3>
            {info}
          </div>
        </div>
        <div className={controlClasses}>{children}</div>
      </div>
    );
  }

  return (
    <div className={horizontalContainerClasses}>
      <div className={titleClasses}>
        <h3 className={`text-[13px] ${disabled ? "opacity-50" : ""}`}>
          {title}
        </h3>
        <p className={`text-xs text-ink-3 ${disabled ? "opacity-50" : ""}`}>
          {description}
        </p>
      </div>
      <div className={controlClasses}>{children}</div>
    </div>
  );
};
