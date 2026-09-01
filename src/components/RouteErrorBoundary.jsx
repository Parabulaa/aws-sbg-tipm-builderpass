import { Component } from 'react'

export default class RouteErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <section className="mx-auto min-h-[50vh] max-w-2xl px-6 py-16 lg:px-10">
        <div className="border border-[var(--bp-danger)] bg-[var(--bp-surface)] p-6 sm:p-8">
          <p className="mono text-xs font-bold uppercase tracking-[.16em] text-[var(--bp-danger)]">
            Page load interrupted
          </p>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-[var(--bp-text)]">
            This page could not be loaded.
          </h1>
          <p className="mt-3 leading-relaxed text-[var(--bp-text-dim)]">
            The app may have been updated while this tab was open. Reload to request the latest files.
          </p>
          <button
            className="mt-6 border-2 border-[var(--bp-amber)] bg-[var(--bp-amber)] px-5 py-2.5 font-bold uppercase tracking-wide text-black transition-colors hover:bg-[var(--bp-amber-strong)]"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload BuilderPass
          </button>
        </div>
      </section>
    )
  }
}
