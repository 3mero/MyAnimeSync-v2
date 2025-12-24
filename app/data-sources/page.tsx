import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { animeApis, type ApiInfo } from "@/lib/anime-apis"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ExternalLink, Check } from "lucide-react"

function ApiCard({ api }: { api: ApiInfo }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{api.name}</span>
          <Link
            href={api.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Visit <ExternalLink className="w-4 h-4" />
          </Link>
        </CardTitle>
        <CardDescription>
          {api.name === "Jikan API" ? (
            <Badge variant="secondary" className="border-green-500/50 text-green-700 dark:text-green-400">
              Integrated
            </Badge>
          ) : (
            <Badge variant="outline">Not Integrated</Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-semibold mb-2">Features:</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {api.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default function DataSourcesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Anime API Sources</h1>
        <p className="text-lg text-muted-foreground mt-2">A list of APIs used and considered for AnimeSync.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(animeApis).map((api) => (
          <ApiCard key={api.name} api={api} />
        ))}
      </div>
    </main>
  )
}
