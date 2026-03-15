export interface TechEntry {
  name: string;
  color: string;
  category: string;
}

export const techCatalog: Record<string, TechEntry> = {
  "next.js": { name: "Next.js", color: "#000000", category: "framework" },
  nextjs: { name: "Next.js", color: "#000000", category: "framework" },
  react: { name: "React", color: "#61dafb", category: "framework" },
  typescript: { name: "TypeScript", color: "#3178c6", category: "language" },
  javascript: { name: "JavaScript", color: "#f7df1e", category: "language" },
  supabase: { name: "Supabase", color: "#3ecf8e", category: "database" },
  postgresql: { name: "PostgreSQL", color: "#336791", category: "database" },
  redis: { name: "Redis", color: "#dc382d", category: "database" },
  openai: { name: "OpenAI", color: "#10a37f", category: "ai" },
  stripe: { name: "Stripe", color: "#635bff", category: "payments" },
  github: { name: "GitHub", color: "#ffffff", category: "platform" },
  docker: { name: "Docker", color: "#2496ed", category: "infra" },
  vercel: { name: "Vercel", color: "#000000", category: "platform" },
  tailwind: { name: "Tailwind CSS", color: "#06b6d4", category: "framework" },
  node: { name: "Node.js", color: "#339933", category: "runtime" },
  python: { name: "Python", color: "#3776ab", category: "language" },
  go: { name: "Go", color: "#00add8", category: "language" },
  rust: { name: "Rust", color: "#dea584", category: "language" },
  aws: { name: "AWS", color: "#ff9900", category: "cloud" },
  gcp: { name: "Google Cloud", color: "#4285f4", category: "cloud" },
  azure: { name: "Azure", color: "#0078d4", category: "cloud" },
  mongodb: { name: "MongoDB", color: "#47a248", category: "database" },
  elasticsearch: {
    name: "Elasticsearch",
    color: "#005571",
    category: "database",
  },
  kafka: { name: "Kafka", color: "#231f20", category: "messaging" },
  rabbitmq: { name: "RabbitMQ", color: "#ff6600", category: "messaging" },
  graphql: { name: "GraphQL", color: "#e10098", category: "api" },
  grpc: { name: "gRPC", color: "#244c5a", category: "api" },
};

export function lookupTech(name: string): TechEntry | undefined {
  return techCatalog[name.toLowerCase()];
}
