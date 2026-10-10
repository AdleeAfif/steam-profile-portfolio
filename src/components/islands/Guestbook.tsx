import { useState, type SubmitEvent } from "react";
import type { Comment, CommentPage } from "../../lib/api/types";
import { formatDateTime } from "../../lib/format";
import { showToast } from "../../lib/client/toast";
import FormField, { Honeypot } from "../profile/FormField";
import { LIMITS, compactErrors, labelDetails, postJson, validateLength, type FieldErrors } from "../profile/form";

interface Props {
  initial: CommentPage | null;
}

const EMPTY = { name: "", message: "", website: "" };

export default function Guestbook({ initial }: Props) {
  const [comments, setComments] = useState<Comment[]>(initial?.items ?? []);
  const [cursor, setCursor] = useState<string | undefined>(initial?.nextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const set = (key: keyof typeof EMPTY) => (value: string) => setValues((v) => ({ ...v, [key]: value }));

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/comments?cursor=${encodeURIComponent(cursor)}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(String(response.status));
      const page = (await response.json()) as CommentPage;
      setComments((prev) => [...prev, ...page.items.filter((c) => !prev.some((p) => p.id === c.id))]);
      setCursor(page.nextCursor);
    } catch {
      setLoadError("Unable to load more comments right now.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const local = compactErrors({
      name: validateLength("Name", values.name, LIMITS.name),
      message: validateLength("Comment", values.message, LIMITS.message),
    });
    setErrors(local);
    if (Object.keys(local).length > 0) return;

    setSending(true);
    const result = await postJson("/api/comments", {
      name: values.name.trim(),
      message: values.message.trim(),
      website: values.website,
    });
    setSending(false);

    if (result.ok) {
      setValues(EMPTY);
      showToast({
        title: "Comment awaiting moderation",
        body: "Thanks! Your comment will appear here once it has been approved.",
        tone: "success",
      });
      return;
    }
    setErrors(labelDetails(result.details, { name: "Name", message: "Comment" }));
    setNotice(result.message);
    if (result.status === 429) showToast({ title: "Slow down", body: result.message, tone: "error" });
  }

  return (
    <div className="space-y-4">
      <form noValidate onSubmit={onSubmit} className="relative space-y-3 bg-black/20 p-3">
        <FormField
          id="guestbook-name"
          name="name"
          label="Name"
          value={values.name}
          onChange={set("name")}
          error={errors.name}
          maxLength={LIMITS.name}
          autoComplete="nickname"
          disabled={sending}
        />
        <FormField
          id="guestbook-message"
          name="message"
          label="Add a comment"
          value={values.message}
          onChange={set("message")}
          error={errors.message}
          maxLength={LIMITS.message}
          multiline
          showCount
          disabled={sending}
        />
        <Honeypot idPrefix="guestbook" value={values.website} onChange={set("website")} />
        {notice && (
          <p role="alert" className="text-sm text-[#ff7b7b]">
            {notice}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-steam-muted">Comments are moderated before they appear.</p>
          <button type="submit" className="btn-steam btn-blue" disabled={sending}>
            {sending ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>

      {initial &&
        (comments.length === 0 ? (
          <p className="py-2 text-sm text-steam-muted italic">No comments yet. Be the first to leave one!</p>
        ) : (
          <ol className="space-y-3" aria-label="Guestbook comments">
            {comments.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-8 w-8 shrink-0 place-items-center bg-gradient-to-br from-[#3d5a73] to-[#1b2838] text-sm font-semibold text-white uppercase"
                >
                  {[...comment.name.trim()][0] ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium text-steam-accent">{comment.name}</span>{" "}
                    <time dateTime={comment.createdAt} className="text-xs text-steam-muted">
                      {formatDateTime(comment.createdAt)}
                    </time>
                  </p>
                  <p className="text-sm break-words whitespace-pre-line">{comment.message}</p>
                </div>
              </li>
            ))}
          </ol>
        ))}

      {cursor && (
        <div className="text-center">
          <button type="button" className="btn-steam btn-blue" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "View more comments"}
          </button>
        </div>
      )}
      {loadError && (
        <p role="alert" className="text-center text-sm text-[#ff7b7b]">
          {loadError}
        </p>
      )}
    </div>
  );
}
