/**
 * Lightweight fade + slide-in wrapper applied per-route via a `key`d
 * remount (see App.jsx). Pure CSS animation — no layout animation, no
 * dependency on a routing-transition library.
 */
export default function PageTransition({ children }) {
  return <div className="bp-page-enter">{children}</div>
}
