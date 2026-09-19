import React from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

/**
 * Add / remove / reorder rows for the variable-length event fields.
 *
 * The seeded events all happen to have exactly three paragraphs and three
 * stats, but nothing enforces that -- the public page maps over whatever is
 * stored -- so the editor treats both as genuinely variable.
 */
const RepeatableList = ({
  label,
  hint,
  items,
  onChange,
  renderRow,
  emptyItem,
  addLabel = "Add",
  max = 20,
  testId,
}) => {
  const update = (index, value) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div data-testid={testId}>
      <div className="flex items-baseline justify-between gap-4">
        <label className="overline text-brand-mute">{label}</label>
        <span className="text-xs text-brand-mute">
          {items.length}
          {max ? ` / ${max}` : ""}
        </span>
      </div>
      {hint && <p className="mt-1 text-xs text-brand-mute">{hint}</p>}

      <div className="mt-3 space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-2 rounded-xl border border-brand-rule bg-white p-3"
          >
            <div className="flex-1 min-w-0">{renderRow(item, (v) => update(index, v), index)}</div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="p-1.5 rounded-lg hover:bg-brand-sand disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label={`Move ${label} ${index + 1} up`}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                className="p-1.5 rounded-lg hover:bg-brand-sand disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label={`Move ${label} ${index + 1} down`}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-1.5 rounded-lg text-brand-terracotta hover:bg-brand-terracotta/10"
                aria-label={`Remove ${label} ${index + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...items, emptyItem])}
        disabled={max ? items.length >= max : false}
        className="mt-3 inline-flex items-center gap-2 text-sm text-brand-terracotta hover:text-brand-terracottaDeep disabled:opacity-40"
        data-testid={`${testId}-add`}
      >
        <Plus className="h-4 w-4" /> {addLabel}
      </button>
    </div>
  );
};

export default RepeatableList;
