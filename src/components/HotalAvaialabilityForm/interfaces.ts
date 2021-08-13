interface Form {
  arrivalDate: null | Date,
  departureDate: null | Date,
  location: string,
  rooms: number,
}

interface SubmiteDate {
  arrivalDate: Date,
  departureDate: Date,
  rooms: number,
}

export interface HotelAvaialabilityFormProps {
  disabled?: boolean,
  onSubmit?: (data: SubmiteDate) => void
}

export interface HotelAvaialabilityFormState {
  form: Form,
  selectDate: 'arrival' | 'departure' | null,
}
