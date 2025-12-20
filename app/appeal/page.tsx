import { MessageSquare, FileText, AlertCircle, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AppealPage() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="absolute inset-0 texture-noise pointer-events-none" />

      <div className="relative mx-auto max-w-4xl px-4 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-special/10 border border-special/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-special" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Data Format Appeal</h1>
              <p className="text-sm text-muted-foreground">An open letter to the DCSS development team</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mb-8 flex items-start gap-2 p-4 rounded-md bg-special/10 border border-special/20">
          <AlertCircle className="w-5 h-5 text-special mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-special">Content Coming Soon</p>
            <p className="text-muted-foreground">
              This appeal is currently being drafted. The final version will be posted here once complete.
            </p>
          </div>
        </div>

        {/* Appeal Content Area */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-5 h-5 text-special" />
              An Appeal to the Crawl Dev Team
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Regarding morgue file formats and data accessibility</p>
          </CardHeader>
          <CardContent className="py-8">
            {/* Article-style content area */}
            <article className="prose prose-invert prose-sm max-w-none">
              <div className="space-y-6 text-foreground/90 leading-relaxed">
                <p className="text-lg text-muted-foreground italic">Dear DCSS Development Team,</p>

                <p className="text-muted-foreground">
                  [Content placeholder - The full appeal will be written here, discussing suggestions for improving
                  morgue file formats, data accessibility, and API possibilities for the DCSS community.]
                </p>

                <div className="my-8 p-6 bg-secondary/50 rounded-lg border border-border">
                  <h3 className="text-base font-semibold text-foreground mb-3">Topics to be addressed:</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-special">•</span>
                      <span>Standardized machine-readable morgue formats (JSON/XML alongside plaintext)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-special">•</span>
                      <span>Structured data exports for game statistics and records</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-special">•</span>
                      <span>API endpoints for accessing player data and game history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-special">•</span>
                      <span>Consistent formatting across different game versions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-special">•</span>
                      <span>Documentation for existing data formats and structures</span>
                    </li>
                  </ul>
                </div>

                <p className="text-muted-foreground">
                  [The appeal will elaborate on each point, providing specific examples of current challenges and
                  proposed solutions that would benefit the DCSS community and third-party tool developers.]
                </p>

                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-muted-foreground italic">
                    With respect and appreciation for your work on this incredible game,
                  </p>
                  <p className="text-foreground mt-2">— The Crawl Crawler Team</p>
                </div>
              </div>
            </article>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <a href="https://github.com/crawl/crawl" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              DCSS GitHub Repository
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://crawl.develz.org/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Official DCSS Website
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
