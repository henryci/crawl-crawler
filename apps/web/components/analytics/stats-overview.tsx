"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsOverviewProps {
  queryString: string;
  totalCount: number;
}

export function StatsOverview({ queryString, totalCount }: StatsOverviewProps) {
  // For now, show basic stats from the games data
  // This could be expanded with dedicated API endpoints for aggregations
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {totalCount.toLocaleString()}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Filter Applied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-mana">
            {queryString ? "Yes" : "No"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Use filters above to narrow results
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-card border-border col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            About Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the filters above to explore game data. Select a species, background, or god
            to see how players train skills and which spells they use. The Skills and Spells
            tabs show aggregated data for your current filter selection.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
