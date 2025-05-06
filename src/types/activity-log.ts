// src/types/activity-log.ts

export interface ActivityLog {
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
    };
    action: string;
    target?: string;
    metadata?: Record<string, any>;
    timestamp: string;
  }
  