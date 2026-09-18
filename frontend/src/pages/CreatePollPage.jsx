import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

const MAX_OPTIONS = 26

const initialOptions = [
  { id: 1, value: '' },
  { id: 2, value: '' },
]

function validatePoll(question, options) {
  const nextErrors = { optionFields: {} }
  const trimmedOptions = options.map((option) => option.value.trim())

  if (!question.trim()) {
    nextErrors.question = 'Add a question before publishing your poll.'
  } else if (question.trim().length < 3) {
    nextErrors.question = 'Your question must be at least 3 characters.'
  }

  if (options.length < 2) {
    nextErrors.options = 'A poll needs at least 2 options.'
  }

  options.forEach((option, index) => {
    if (!trimmedOptions[index]) {
      nextErrors.optionFields[option.id] = 'Option text is required.'
    }
  })

  const duplicateOptions = new Set()
  const seenOptions = new Map()
  trimmedOptions.forEach((option, index) => {
    if (!option) {
      return
    }

    const normalizedOption = option.toLocaleLowerCase()
    if (seenOptions.has(normalizedOption)) {
      duplicateOptions.add(seenOptions.get(normalizedOption))
      duplicateOptions.add(index)
    } else {
      seenOptions.set(normalizedOption, index)
    }
  })

  if (duplicateOptions.size > 0) {
    nextErrors.options = 'Each answer option must be different.'
    duplicateOptions.forEach((index) => {
      nextErrors.optionFields[options[index].id] = 'This option is duplicated.'
    })
  }

  if (options.length > MAX_OPTIONS) {
    nextErrors.options = `This poll supports up to ${MAX_OPTIONS} options.`
  }

  if (Object.keys(nextErrors.optionFields).length === 0) {
    delete nextErrors.optionFields
  }

  return nextErrors
}

export default function CreatePollPage() {
  const navigate = useNavigate()
  const nextOptionId = useRef(3)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(initialOptions)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateOption = (id, value) => {
    setOptions((current) => current.map((option) => (
      option.id === id ? { ...option, value } : option
    )))
    setErrors((current) => ({
      ...current,
      optionFields: { ...current.optionFields, [id]: '' },
    }))
    setSubmitError('')
  }

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) {
      return
    }

    setOptions((current) => [
      ...current,
      { id: nextOptionId.current++, value: '' },
    ])
    setErrors((current) => ({ ...current, options: '' }))
  }

  const removeOption = (id) => {
    if (options.length <= 2) {
      return
    }

    setOptions((current) => current.filter((option) => option.id !== id))
    setErrors((current) => ({
      ...current,
      optionFields: { ...current.optionFields, [id]: '' },
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validatePoll(question, options)
    setErrors(validationErrors)
    setSubmitError('')

    if (Object.keys(validationErrors).some((key) => key === 'question' || key === 'options' || key === 'optionFields')) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.post('/api/polls', {
        question: question.trim(),
        options: options.map((option) => option.value.trim()),
      })

      if (!response?.id) {
        throw new Error('The poll was created but no poll ID was returned.')
      }

      navigate(`/polls/${response.id}`)
    } catch (error) {
      setSubmitError(error.message || 'Unable to create the poll right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-shell narrow">
      <section className="card-surface creation-hero">
        <div>
          <span className="eyebrow">Create a poll</span>
          <h1>Start a new live conversation</h1>
          <p>Ask one clear question, give people a few strong choices, and watch the signal move.</p>
        </div>
        <span className="status-pill violet">Authenticated creator</span>
      </section>

      <form className="card-surface creation-form" onSubmit={handleSubmit} noValidate>
        <div className="creation-section-heading">
          <div>
            <span className="form-kicker">The prompt</span>
            <h2>What do you want to know?</h2>
          </div>
          <span className="creation-count">{options.length} options</span>
        </div>

        <label className="field-label" htmlFor="pollQuestion">Question</label>
        <input
          id="pollQuestion"
          className={errors.question ? 'input-invalid' : ''}
          value={question}
          onChange={(event) => {
            setQuestion(event.target.value)
            setErrors((current) => ({ ...current, question: '' }))
            setSubmitError('')
          }}
          placeholder="What should the team vote on next?"
          aria-invalid={Boolean(errors.question)}
          aria-describedby={errors.question ? 'poll-question-error' : undefined}
        />
        {errors.question && <p id="poll-question-error" className="field-error">{errors.question}</p>}

        <div className="form-section-header creation-options-heading">
          <div>
            <span className="field-label">Answer options</span>
            <p className="field-hint">Keep each choice short and distinct.</p>
          </div>
          <button type="button" className="secondary-btn compact" onClick={addOption} disabled={isSubmitting || options.length >= MAX_OPTIONS}>
            + Add option
          </button>
        </div>

        <div className="creation-options">
          {options.map((option, index) => (
            <div className="creation-option-row" key={option.id}>
              <span className="option-badge" data-tone={index % 2 ? 'violet' : 'indigo'}>{String.fromCharCode(65 + index)}</span>
              <input
                id={`pollOption-${option.id}`}
                aria-label={`Option ${index + 1}`}
                value={option.value}
                onChange={(event) => updateOption(option.id, event.target.value)}
                placeholder={`Option ${index + 1}`}
                className={errors.optionFields?.[option.id] ? 'input-invalid' : ''}
                aria-invalid={Boolean(errors.optionFields?.[option.id])}
                aria-describedby={errors.optionFields?.[option.id] ? `poll-option-error-${option.id}` : undefined}
              />
              <button
                type="button"
                className="remove-option"
                onClick={() => removeOption(option.id)}
                disabled={isSubmitting || options.length <= 2}
                aria-label={`Remove option ${index + 1}`}
                title={options.length <= 2 ? 'A poll needs at least two options' : 'Remove option'}
              >
                ×
              </button>
              {errors.optionFields?.[option.id] && (
                <p id={`poll-option-error-${option.id}`} className="field-error option-field-error">
                  {errors.optionFields[option.id]}
                </p>
              )}
            </div>
          ))}
        </div>

        {errors.options && <p className="field-error">{errors.options}</p>}
        {submitError && <p className="form-error" role="alert">{submitError}</p>}

        <div className="creation-footer">
          <p className="creation-note">Your poll will open live as soon as it is created.</p>
          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Launching poll...' : 'Launch live poll'}
          </button>
        </div>
      </form>
    </div>
  )
}
