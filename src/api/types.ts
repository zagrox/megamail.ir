export type Contact = {
    Email: string;
    FirstName: string;
    LastName: string;
    Status: 'Active' | 'Transactional' | 'Engaged' | 'Inactive' | 'Abuse' | 'Bounced' | 'Unsubscribed';
    Source: string;
    DateAdded: string;
    DateUpdated?: string;
    StatusChangeDate?: string;
    Activity?: {
        TotalSent?: number;
        TotalOpened?: number;
        TotalClicked?: number;
        TotalFailed?: number;
        LastSent?: string;
        LastOpened?: string;
        LastClicked?: string;
        LastFailed?: string;
    };
    CustomFields?: Record<string, any>;
};
export type List = {
    ListName: string;
    DateAdded: string;
    ContactsCount: number;
};
export type Segment = {
    Name: string;
    Rule: string;
    ContactsCount: number;
    DateAdded: string;
};
export type FileInfo = {
    FileName: string;
    Size: number;
    DateAdded: string;
    ExpiresAfterDays?: number;
};
export type Template = {
    Name: string;
    DateAdded: string;
    Subject?: string;
    Body: { Content: string }[];
};