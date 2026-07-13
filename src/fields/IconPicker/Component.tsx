'use client'

import React, { useState } from 'react'
import { FieldLabel, Modal, useField, useModal } from '@payloadcms/ui'
import type { SelectFieldClientProps } from 'payload'

import { ICON_OPTIONS } from './icons'

// MAINTAINABILITY (no-inline-exhaustive-style): the Payload admin route only
// loads @payloadcms/next/css, not this project's globals.css, so Tailwind
// utility classes have no effect here (13-01 decision) -- these can't be
// converted to className strings. The static parts of each large inline
// style object are hoisted to module scope instead, so they build once
// instead of rebuilding on every render; only the genuinely stateful parts
// (readOnly's cursor, isSelected's boxShadow) stay as computed styles below.
const triggerButtonBaseStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 4,
  border: '1px solid var(--theme-border-color)',
  background: 'var(--theme-elevation-0)',
  color: 'var(--theme-text)',
  minWidth: 200,
}

const modalContainerStyle: React.CSSProperties = {
  background: 'var(--theme-elevation-0)',
  border: '1px solid var(--theme-border-color)',
  borderRadius: 6,
  padding: 16,
  maxWidth: 480,
  margin: '10vh auto',
  maxHeight: '70vh',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const iconGridButtonBaseStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 44,
  height: 44,
  borderRadius: 4,
  border: '1px solid var(--theme-border-color)',
  background: 'var(--theme-elevation-50, var(--theme-elevation-0))',
  color: 'var(--theme-text)',
  cursor: 'pointer',
}

// Custom Payload admin Field component — replaces the plain <select> with a
// searchable popup/modal grid of lucide-react icons (13-CONTEXT.md "Icon
// picker de admin"). Only ever writes one of ICON_OPTIONS' known string
// values via click; server-side `select` validation still rejects anything
// else regardless of which UI produced the value (T-13-01).
export function IconPickerField(props: SelectFieldClientProps) {
  const { field, path, readOnly } = props
  const { value, setValue } = useField<string>({ path })
  const { toggleModal, closeModal, isModalOpen } = useModal()
  const [search, setSearch] = useState('')

  const modalSlug = `icon-picker-${path}`
  const fieldId = `field-${path}`
  const selected = ICON_OPTIONS.find((opt) => opt.value === value)
  const SelectedIcon = selected?.Icon

  const filtered = ICON_OPTIONS.filter((opt) => {
    const query = search.trim().toLowerCase()
    return opt.label.toLowerCase().includes(query) || opt.value.toLowerCase().includes(query)
  })

  return (
    <div className="field-type icon-picker-field" style={{ marginBottom: 'var(--base, 20px)' }}>
      <FieldLabel label={field.label} required={field.required} path={path} htmlFor={fieldId} />
      <button
        id={fieldId}
        type="button"
        disabled={readOnly}
        aria-haspopup="dialog"
        aria-expanded={isModalOpen(modalSlug)}
        onClick={() => toggleModal(modalSlug)}
        style={{ ...triggerButtonBaseStyle, cursor: readOnly ? 'not-allowed' : 'pointer' }}
      >
        {SelectedIcon ? (
          <>
            <SelectedIcon size={20} />
            <span>{selected?.label}</span>
          </>
        ) : (
          <span style={{ color: 'var(--theme-elevation-400)' }}>Select icon…</span>
        )}
      </button>

      <Modal slug={modalSlug}>
        <div style={modalContainerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: 'var(--theme-text)' }}>Select icon</strong>
            <button
              type="button"
              onClick={() => closeModal(modalSlug)}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--theme-elevation-800)',
                fontSize: 18,
              }}
            >
              ×
            </button>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar icono…"
            style={{
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid var(--theme-border-color)',
              background: 'var(--theme-elevation-100)',
              color: 'var(--theme-text)',
            }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
              gap: 8,
              overflowY: 'auto',
            }}
          >
            {filtered.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-label={opt.label}
                  title={opt.label}
                  onClick={() => {
                    setValue(opt.value)
                    closeModal(modalSlug)
                  }}
                  style={{
                    ...iconGridButtonBaseStyle,
                    boxShadow: isSelected ? 'inset 0 0 0 2px var(--theme-success-500)' : undefined,
                  }}
                >
                  <opt.Icon size={20} />
                </button>
              )
            })}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default IconPickerField
