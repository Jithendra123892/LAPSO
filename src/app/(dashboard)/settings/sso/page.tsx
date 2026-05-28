'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { Shield, Key, Globe, CheckCircle, X, Copy, Eye, EyeSlash, Plug, ArrowRight } from '@phosphor-icons/react'

type Mode = 'oidc' | 'saml'

function OIDCFields({ config, onChange }: { config: any; onChange: (k: string, v: string) => void }) {
  const fields = [
    { key: 'discoveryUrl', label: 'Discovery / Well-Known URL', placeholder: 'https://your-idp.com/.well-known/openid-configuration', hint: 'Auto-discovers all OIDC endpoints from metadata' },
    { key: 'clientId', label: 'Client ID', placeholder: 'lapso-app' },
    { key: 'clientSecret', label: 'Client Secret', placeholder: '••••••••', secret: true },
    { key: 'scopes', label: 'Scopes', placeholder: 'openid profile email', hint: 'Space-separated. Default: openid profile email' },
  ]

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="font-heading font-bold text-sm block mb-1">{f.label}</label>
          <div className="flex gap-2">
            <input
              type={f.secret && !config[`show_${f.key}`] ? 'password' : 'text'}
              value={config[f.key] || ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="neo-input flex-1"
            />
            {f.secret && (
              <button
                type="button"
                onClick={() => onChange(`show_${f.key}`, config[`show_${f.key}`] ? '' : '1')}
                className="p-2 border-3 border-dark hover:bg-surface-alt"
              >
                {config[`show_${f.key}`] ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
              </button>
            )}
          </div>
          {f.hint && <p className="text-xs text-dark-light mt-1">{f.hint}</p>}
        </div>
      ))}
    </div>
  )
}

function SAMLFields({ config, onChange }: { config: any; onChange: (k: string, v: string) => void }) {
  const fields = [
    { key: 'idpUrl', label: 'Identity Provider URL', placeholder: 'https://your-idp.com/saml2/idp/metadata.xml' },
    { key: 'entityId', label: 'SP Entity ID', placeholder: 'https://lapso.app/saml/acs' },
    { key: 'certificate', label: 'IdP Certificate (PEM)', placeholder: '-----BEGIN CERTIFICATE-----' },
    { key: 'sloUrl', label: 'SLO URL (optional)', placeholder: 'https://your-idp.com/saml2/slo' },
  ]
  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="font-heading font-bold text-sm block mb-1">{f.label}</label>
          <textarea
            value={config[f.key] || ''}
            onChange={(e) => onChange(f.key, e.target.value)}
            placeholder={f.placeholder}
            rows={f.key === 'certificate' ? 4 : 2}
            className="neo-input w-full font-mono text-xs"
          />
        </div>
      ))}
    </div>
  )
}

export default function SSOSettingsPage() {
  const [mode, setMode] = useState<Mode>('oidc')
  const [config, setConfig] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [testing, setTesting] = useState(false)

  function setField(key: string, value: string) {
    setConfig(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    await new Promise(r => setTimeout(r, 1200))
    setSaving(false)
    setSaved(true)
  }

  async function handleTest() {
    setTesting(true)
    await new Promise(r => setTimeout(r, 2000))
    setTesting(false)
  }

  const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback/sso` : 'https://lapso.app/api/auth/callback/sso'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Shield weight="bold" className="text-primary" /> SSO Configuration
          </h1>
          <p className="text-dark-light text-sm">Connect your Identity Provider for enterprise single sign-on</p>
        </div>
        {saved && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 text-secondary">
            <CheckCircle size={18} weight="fill" />
            <span className="font-heading font-bold text-sm">Saved</span>
          </motion.div>
        )}
      </div>

      {/* OIDC / SAML Toggle */}
      <div className="flex gap-1">
        {(['oidc', 'saml'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setSaved(false) }}
            className={`px-4 py-2 font-heading font-bold text-sm border-2 border-dark transition-all ${
              mode === m ? 'bg-primary text-white' : 'bg-surface hover:bg-surface-alt'
            }`}
          >
            {m === 'oidc' ? 'OpenID Connect' : 'SAML 2.0'}
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-accent/20 border-3 border-dark p-4">
        <p className="text-sm font-heading font-bold flex items-center gap-2">
          <Key size={16} weight="bold" />
          {mode === 'oidc'
            ? 'Use OpenID Connect for OAuth2/OIDC providers like Google Workspace, Okta, Auth0, Azure AD'
            : 'Use SAML 2.0 for enterprise SSO providers like Okta, Azure AD, OneLogin, ADFS'}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="neo-card p-4">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            {mode === 'oidc' ? <Globe size={16} weight="bold" /> : <Shield size={16} weight="bold" />}
            {mode === 'oidc' ? 'OIDC Provider' : 'SAML Provider'} Configuration
          </h3>

          {mode === 'oidc' ? (
            <OIDCFields config={config} onChange={setField} />
          ) : (
            <SAMLFields config={config} onChange={setField} />
          )}

          {error && <p className="text-sm text-danger font-medium mt-3">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="neo-btn-primary flex-1"
            >
              {saving ? 'Saving...' : <><CheckCircle size={16} weight="bold" /> Save Configuration</>}
            </button>
            <button
              onClick={handleTest}
              disabled={testing}
              className="neo-btn-ghost flex-1"
            >
              {testing ? 'Testing...' : <><Plug size={16} weight="bold" /> Test Connection</>}
            </button>
          </div>
        </div>

        {/* Redirect URI + help */}
        <div className="space-y-4">
          <div className="neo-card p-4">
            <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
              <ArrowRight size={16} weight="bold" className="text-secondary" /> Callback URL
            </h3>
            <p className="text-xs text-dark-light mb-2">Add this to your Identity Provider:</p>
            <div className="bg-surface-alt border-2 border-dark p-3 font-mono text-xs break-all">
              {redirectUri}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(redirectUri)}
              className="mt-2 text-xs font-heading font-bold text-secondary flex items-center gap-1 hover:underline"
            >
              <Copy size={12} /> Copy
            </button>
          </div>

          {/* Status card */}
          <div className="neo-card p-4">
            <h3 className="font-heading font-bold mb-3">Integration Status</h3>
            <div className="space-y-2">
              {[
                { label: 'Configuration', status: saved, ok: saved },
                { label: 'Provider connectivity', status: false, ok: false },
                { label: 'User provisioning', status: false, ok: false },
              ].map(({ label, status }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm font-heading">{label}</span>
                  <div className={`flex items-center gap-1 text-xs font-heading font-bold ${
                    status ? 'text-secondary' : 'text-dark-light'
                  }`}>
                    {status ? <CheckCircle size={14} weight="fill" /> : <X size={14} weight="bold" />}
                    {status ? 'Configured' : 'Not configured'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup guide */}
          <div className="neo-card p-4 border-l-4 border-accent">
            <h3 className="font-heading font-bold mb-2 text-sm">Setup Guide</h3>
            <ol className="text-xs text-dark-light space-y-1.5 ml-4 list-decimal">
              <li>Configure your IdP with this callback URL</li>
              <li>Copy the provider metadata or enter fields manually</li>
              <li>Test connection to verify credentials</li>
              <li>Save — users will see SSO option on login</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}