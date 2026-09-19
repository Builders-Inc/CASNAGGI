import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Shown when a fetch fails.
 *
 * Deliberately never a redirect: bouncing the visitor elsewhere on a network
 * error makes an API outage look like the content was deleted, and hides the
 * problem from whoever could fix it.
 */
const ErrorState = ({
  title = "We couldn't load this right now.",
  message = "The connection to our server failed. This is usually temporary.",
  onRetry,
  testId = "error-state",
}) => (
  <div
    className="card-tactile max-w-xl mx-auto text-center"
    role="alert"
    data-testid={testId}
  >
    <AlertCircle className="h-8 w-8 text-brand-terracotta mx-auto" />
    <h3 className="font-display text-2xl mt-5 font-medium">{title}</h3>
    <p className="mt-3 text-brand-ink/70 leading-relaxed">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="btn-primary mt-7"
        data-testid={`${testId}-retry`}
      >
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    )}
  </div>
);

export default ErrorState;
