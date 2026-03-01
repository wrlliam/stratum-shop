'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/Input'
import type { DeliveryAddress } from '@/types'

const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i

interface Props {
  address: DeliveryAddress
  onChange: (address: DeliveryAddress) => void
  errors?: Partial<Record<keyof DeliveryAddress, string>>
}

export function AddressForm({ address, onChange, errors }: Props) {
  const line1Ref = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [loaded, setLoaded] = useState(false)

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace()
    if (!place?.address_components) return

    const get = (type: string) =>
      place.address_components?.find((c) => c.types.includes(type))?.long_name || ''

    const streetNumber = get('street_number')
    const route = get('route')
    const line1 = streetNumber ? `${streetNumber} ${route}` : route

    onChange({
      ...address,
      line1: line1 || address.line1,
      city: get('postal_town') || get('locality') || address.city,
      county: get('administrative_area_level_2') || address.county || '',
      postcode: get('postal_code') || address.postcode,
    })
  }, [address, onChange])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || loaded) return

    let mounted = true

    async function init() {
      const { setOptions, importLibrary: loadLibrary } = await import('@googlemaps/js-api-loader')
      setOptions({ key: apiKey!, libraries: ['places'] })
      await loadLibrary('places')

      if (!mounted || !line1Ref.current) return

      const autocomplete = new google.maps.places.Autocomplete(line1Ref.current, {
        componentRestrictions: { country: 'gb' },
        types: ['address'],
        fields: ['address_components'],
      })

      autocomplete.addListener('place_changed', handlePlaceChanged)
      autocompleteRef.current = autocomplete
      setLoaded(true)
    }

    init().catch(console.error)
    return () => { mounted = false }
  }, [loaded, handlePlaceChanged])

  const update = (field: keyof DeliveryAddress, value: string) => {
    onChange({ ...address, [field]: value })
  }

  return (
    <div className="space-y-3">
      <Input
        label="Full Name"
        placeholder="John Smith"
        value={address.name}
        onChange={(e) => update('name', e.target.value)}
        error={errors?.name}
        required
      />
      <Input
        ref={line1Ref}
        label="Address Line 1"
        placeholder="Start typing your address..."
        value={address.line1}
        onChange={(e) => update('line1', e.target.value)}
        error={errors?.line1}
        required
      />
      <Input
        label="Address Line 2"
        placeholder="Flat, suite, etc. (optional)"
        value={address.line2 || ''}
        onChange={(e) => update('line2', e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="City / Town"
          placeholder="London"
          value={address.city}
          onChange={(e) => update('city', e.target.value)}
          error={errors?.city}
          required
        />
        <Input
          label="County"
          placeholder="Optional"
          value={address.county || ''}
          onChange={(e) => update('county', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Postcode"
          placeholder="SW1A 1AA"
          value={address.postcode}
          onChange={(e) => update('postcode', e.target.value.toUpperCase())}
          error={errors?.postcode}
          required
        />
        <div>
          <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">
            Country
          </label>
          <input
            value="United Kingdom"
            disabled
            className="w-full bg-brand-arctic border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-muted cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  )
}

export function validateAddress(address: DeliveryAddress): Partial<Record<keyof DeliveryAddress, string>> | null {
  const errors: Partial<Record<keyof DeliveryAddress, string>> = {}

  if (!address.name.trim()) errors.name = 'Name is required'
  if (!address.line1.trim()) errors.line1 = 'Address is required'
  if (!address.city.trim()) errors.city = 'City is required'
  if (!address.postcode.trim()) {
    errors.postcode = 'Postcode is required'
  } else if (!UK_POSTCODE_REGEX.test(address.postcode.trim())) {
    errors.postcode = 'Please enter a valid UK postcode'
  }

  return Object.keys(errors).length > 0 ? errors : null
}
