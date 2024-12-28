export interface MenuItem {
  id: string;
  text: string;
  command?: string;
  url?: string;
  children?: MenuItem[];
}

export interface MenuCommand {
  command: string;
  description: string;
}

export interface MenuResponse {
  success: boolean;
  message?: string;
  commands?: MenuItem[];
} 