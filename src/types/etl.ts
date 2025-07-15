
export interface ETLTask {
  id: string;
  name: string;
  description?: string;
  status: "completed" | "in-progress" | "not-started" | "unknown";
  stage: string;
}

export interface ETLData {
  id: string;
  partner: string;
  tasks: ETLTask[];
}
