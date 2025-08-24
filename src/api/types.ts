export type Contact = {
    Email: string;
    FirstName: string;
    LastName: string;
    Status: 'Active' | 'Transactional' | 'Engaged' | 'Inactive' | 'Abuse' | 'Bounced' | 'Unsubscribed' | 'Stale' | 'NotConfirmed';
    Source: string;
    SourceInfo?: string;
    DateAdded: string;
    DateUpdated?: string;
    StatusChangeDate?: string;
    Consent?: {
        ConsentIP?: string;
        ConsentDate?: string;
        ConsentTracking?: string;
    };
    Activity?: {
        TotalSent?: number;
        TotalOpened?: number;
        TotalClicked?: number;
        TotalFailed?: number;
        LastSent?: string;
        LastOpened?: string;
        LastClicked?: string;
        LastFailed?: string;
        LastIP?: string;
        ErrorCode?: number;
        FriendlyErrorMessage?: string;
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
export type Module = {
    id: string;
    modulename: string;
    moduleprice: number;
    moduledetails: string;
    status: string;
    modulepro?: boolean;
    modulediscount?: number;
};