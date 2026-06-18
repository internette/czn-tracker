import { ChangeEvent, CSSProperties, FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCharacter, updateCharacter, UpdateCharacterInput } from '../../api'
import { Button, Card, Input, LoadingState } from '../../components/ui'

const emptyForm: UpdateCharacterInput = {
  name: '',
  tier: '',
  type: '',
  faction: '',
  rarity: '',
  attribute: '',
  imageUrl: '',
}

const editCharacterPageStyles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '20px',
  } as CSSProperties,
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#e2e8f0',
  } as CSSProperties,
  form: {
    display: 'grid',
    gap: '4px',
  } as CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  } as CSSProperties,
  preview: {
    width: '100%',
    maxWidth: '220px',
    aspectRatio: '1 / 1',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#0f172a',
  } as CSSProperties,
  actions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginTop: '8px',
  } as CSSProperties,
  error: {
    color: '#fb7185',
    margin: '8px 0',
  } as CSSProperties,
}

export default function EditCharacterPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<UpdateCharacterInput>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function loadCharacter() {
      setLoading(true)
      setError(null)
      try {
        const character = await getCharacter(id)
        setForm({
          name: character.name,
          tier: character.tier,
          type: character.type,
          faction: character.faction,
          rarity: character.rarity,
          attribute: character.attribute,
          imageUrl: character.imageUrl,
        })
      } catch (err) {
        setError('Unable to load this character.')
      } finally {
        setLoading(false)
      }
    }

    loadCharacter()
  }, [id])

  const handleChange = (field: keyof UpdateCharacterInput) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!id) return

    setSaving(true)
    setError(null)
    try {
      const character = await updateCharacter(id, form)
      navigate(`/characters/${character.id}`)
    } catch (err) {
      setError('Unable to save this character.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingState message="Loading character..." />
  }

  return (
    <Card>
      <div style={editCharacterPageStyles.header}>
        <h2 style={editCharacterPageStyles.title}>Edit Character</h2>
        <Link to={id ? `/characters/${id}` : '/characters'}>Cancel</Link>
      </div>

      <form style={editCharacterPageStyles.form} onSubmit={handleSubmit}>
        <div style={editCharacterPageStyles.grid}>
          <Input label="Name" value={form.name} onChange={handleChange('name')} required />
          <Input label="Tier" value={form.tier} onChange={handleChange('tier')} />
          <Input label="Type" value={form.type} onChange={handleChange('type')} />
          <Input label="Faction" value={form.faction} onChange={handleChange('faction')} />
          <Input label="Rarity" value={form.rarity} onChange={handleChange('rarity')} />
          <Input label="Attribute" value={form.attribute} onChange={handleChange('attribute')} />
        </div>

        <Input label="Image URL" value={form.imageUrl} onChange={handleChange('imageUrl')} />

        {form.imageUrl && <img src={form.imageUrl} alt="" style={editCharacterPageStyles.preview} />}
        {error && <p style={editCharacterPageStyles.error}>{error}</p>}

        <div style={editCharacterPageStyles.actions}>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Character'}
          </Button>
          <Link to={id ? `/characters/${id}` : '/characters'}>Back to details</Link>
        </div>
      </form>
    </Card>
  )
}
