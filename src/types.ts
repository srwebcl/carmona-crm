export interface User {
    id: number;
    name: string;
    role: string;
    brands: string[];
    areas: string[];
}

export interface Attachment {
    name: string;
    size: number;
    type: string;
}

export interface ClaimHistory {
    id: number;
    date: string;
    user: string;
    type: string;
    text: string;
    attachments?: Attachment[];
}

export interface Claim {
    id: string;
    customer: string;
    email: string;
    phone: string;
    brand: string;
    area: string;
    detail: string;
    status: string;
    assignedTo: string;
    createdAt: string;
    history: ClaimHistory[];
    attachments?: Attachment[];
}

export type ViewState = 'dashboard' | 'claims' | 'detail' | 'simulate' | 'team';
