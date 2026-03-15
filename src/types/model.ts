export type ObjectType = "actor" | "system" | "app" | "store" | "component";
export type Scope = "internal" | "external";
export type Status = "live" | "future" | "deprecated";
export type ConnectionType = "sync" | "async" | "event" | "data";

export interface Technology {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  category?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface ModelObject {
  id: string;
  name: string;
  type: ObjectType;
  scope: Scope;
  status: Status;
  description: string;
  detailedDescription?: string;
  icon?: string;
  parentId?: string;
  groups?: string[];
  technologies?: Technology[];
  tags?: Tag[];
  links?: { label: string; url: string }[];
  metadata?: {
    files?: string[];
    externalSystem?: string;
  };
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  description?: string;
  status: Status;
  technologies?: Technology[];
  type?: ConnectionType;
}

export interface Group {
  id: string;
  name: string;
  parentGroupId?: string;
  objectIds: string[];
}

export interface Diagram {
  id: string;
  name: string;
  level: 1 | 2 | 3;
  objectIds: string[];
  connectionIds: string[];
  positions: Record<string, { x: number; y: number }>;
}

export interface FlowStep {
  order: number;
  connectionId: string;
  description?: string;
}

export interface Flow {
  id: string;
  name: string;
  steps: FlowStep[];
}

export interface ArchGraphModel {
  version: "1.0.0";
  metadata: {
    projectName: string;
    generatedAt: string;
    generatedBy: "claude-code" | string;
    codebaseRoot: string;
  };
  objects: ModelObject[];
  connections: Connection[];
  groups: Group[];
  technologies: Technology[];
  tags: Tag[];
  diagrams: Diagram[];
  flows: Flow[];
}
