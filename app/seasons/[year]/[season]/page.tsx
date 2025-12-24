// This page now simply redirects to the new paginated route structure.
import { redirect } from "next/navigation"

export default function SeasonRedirectPage({ params }: { params: { year: string; season: string } }) {
  const { year, season } = params
  // Redirect to the first page of the new structure.
  redirect(`/seasons/${year}/${season}/1`)
}
