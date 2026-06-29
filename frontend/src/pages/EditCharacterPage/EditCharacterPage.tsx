import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCharacter, updateCharacter, UpdateCharacterInput } from '../../api'
import { Button, Card, Input, LoadingState } from '../../components/ui'
import styles from './EditCharacterPage.module.scss'

const emptyForm: UpdateCharacterInput = {
  name: '',
  tier: '',
  type: '',
  faction: '',
  rarity: '',
  attribute: '',
  imageUrl: '',
}

export default function EditCharacterPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<UpdateCharacterInput>(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
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
        setImagePreview(character.imageUrl)
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

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setImageFile(file)

    if (file) {
      setImagePreview(URL.createObjectURL(file))
      return
    }

    setImagePreview(form.imageUrl)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!id) return

    setSaving(true)
    setError(null)
    try {
      const character = await updateCharacter(id, form, imageFile)
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
      <div className={styles.header}>
        <h2 className={styles.title}>Edit Character</h2>
        <Link to={id ? `/characters/${id}` : '/characters'}>Cancel</Link>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.grid}>
          <Input label="Name" value={form.name} onChange={handleChange('name')} required />
          <Input label="Tier" value={form.tier} onChange={handleChange('tier')} />
          <Input label="Type" value={form.type} onChange={handleChange('type')} />
          <Input label="Faction" value={form.faction} onChange={handleChange('faction')} />
          <Input label="Rarity" value={form.rarity} onChange={handleChange('rarity')} />
          <Input label="Attribute" value={form.attribute} onChange={handleChange('attribute')} />
        </div>

        <Input
          label="Character Image"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleImageChange}
          helperText="Upload a PNG, JPG, WEBP, or GIF."
        />

        {imagePreview && <img src={imagePreview} alt="" className={styles.preview} />}
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Character'}
          </Button>
          <Link to={id ? `/characters/${id}` : '/characters'}>Back to details</Link>
        </div>
      </form>
    </Card>
  )
}
