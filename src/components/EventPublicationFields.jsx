import SelectControl from './SelectControl.jsx'

export default function EventPublicationFields({ form, onChange }) {
  return (
    <fieldset className="space-y-4 border border-[var(--bp-border)] p-4">
      <legend className="px-2 font-bold">Publication & audience</legend>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="publicationStatus">Publication</label>
        <SelectControl id="publicationStatus" name="publicationStatus" onChange={onChange} value={form.publicationStatus}
          options={[{ value: 'DRAFT', label: 'Draft — officers and admins only' }, { value: 'PUBLISHED', label: 'Published' }]} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="visibility">Audience</label>
        <SelectControl id="visibility" name="visibility" onChange={onChange} value={form.visibility}
          options={[{ value: 'MEMBERS', label: 'Members only' }, { value: 'PUBLIC', label: 'Public — visible without signing in' }]} />
      </div>
      <p className="text-sm text-[var(--bp-text-dim)]">Publish a public event to show its details and poster on the homepage and guest event pages. Registration can be closed while the announcement stays visible.</p>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="recap">Event recap (optional)</label>
        <textarea className="bp-control w-full px-4 py-3" id="recap" name="recap" rows={3} maxLength={1500} onChange={onChange} value={form.recap} />
        <p className="mt-2 text-xs text-[var(--bp-text-dim)]">After the event, describe what happened and what participants worked on. Use verified details; this appears in Previous Events.</p>
      </div>
    </fieldset>
  )
}
