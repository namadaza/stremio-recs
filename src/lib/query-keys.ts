export const QUERY_KEYS = {
  profile: ["profile"] as const,
  recommendationConfig: ["recommendation-config"] as const,
  recommendations: {
    all: ["recommendations"] as const,
    current: ["recommendations", "current"] as const,
    history: ["recommendations", "history"] as const,
    refresh: ["recommendations", "refresh"] as const,
    batch: (batchId: number) => ["recommendations", "batch", batchId] as const,
  },
  addonInstallation: ["addon-installation"] as const,
  catalogStatus: ["catalog-status"] as const,
  movieSearch: (query: string) => ["movie-search", query] as const,
  algorithmMovieReactions: () => ["algorithm-movie-reactions"] as const,
} as const;
