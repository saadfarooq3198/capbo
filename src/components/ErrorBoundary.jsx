import React, { Component } from "react";

const isPreview = 
  !!(window).__BASE44_EDITOR__ || location.search.includes("preview=1");
const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
const isDev = isLocal || isPreview;

export default class ErrorBoundary extends Component {
  state = { err: undefined, info: undefined, copied: false, detailsOpen: false };

  static getDerivedStateFromError(err) { 
    return { err }; 
  }

  componentDidCatch(error, info) {
    // Optional: send to backend (never throw)
    if (this.props.reportUrl) {
      try {
        fetch(this.props.reportUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: error?.message,
            stack: error?.stack,
            componentStack: info?.componentStack,
            path: location.pathname + location.search,
            ts: new Date().toISOString(),
          }),
          keepalive: true,
        });
      } catch {}
    }
    if (isDev) console.error("UI ErrorBoundary:", error, info);
    this.setState({ info });
  }

  copyDetails = async () => {
    const details = JSON.stringify(
      {
        message: this.state.err?.message,
        stack: this.state.err?.stack,
        componentStack: this.state.info?.componentStack,
        path: location.pathname + location.search,
      },
      null, 2
    );
    try {
      await navigator.clipboard.writeText(details);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 1500);
    } catch {}
  };

  render() {
    const { err, info, copied, detailsOpen } = this.state;
    if (!err) return this.props.children;
    const showDetails = isDev || detailsOpen;

    return (
      <div style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
        <p style={{ color: "#444", marginTop: 0 }}>
          Please try again. If the problem persists, contact support.
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
          <button onClick={() => location.reload()} style={{ padding: "6px 10px" }}>
            Reload page
          </button>
          <a href="/dashboard" style={{ padding: "6px 10px", textDecoration: "none", background: "#eee" }}>
            Back to Dashboard
          </a>
          {!isDev && (
            <button onClick={() => this.setState({ detailsOpen: !detailsOpen })} style={{ padding: "6px 10px" }}>
              {detailsOpen ? "Hide details" : "Show details"}
            </button>
          )}
          <button onClick={this.copyDetails} style={{ padding: "6px 10px" }}>
            {copied ? "Copied ✓" : "Copy details"}
          </button>
        </div>

        {showDetails && (
          <pre style={{
            whiteSpace: "pre-wrap",
            background: "#111",
            color: "#fff",
            padding: 12,
            borderRadius: 8,
            maxHeight: 320,
            overflow: "auto",
          }}>
            {String(err?.stack || err)}
            {info?.componentStack ? "\n\nComponent stack:\n" + info.componentStack : ""}
          </pre>
        )}
      </div>
    );
  }
}