import { Schedule } from "./Schedule"

export type Notification = {
    _id: string,
    actor: string,
    user: string,
    title: string,
    message: string,
    severity: "WARNING" | "ERROR",
    priority: string,
    type: string,
    read: boolean,
    data: ClaimData | DisconnectedData,
    created: string,
    updated: string,
    resolve?: boolean, // Indicates if the notification is resolved
    deactivated?: boolean, // Indicates if the notification is deleted
    from?: "smartApp" | "system", // Indicates the source of the notification
    client?: string, // Reference to the client (if applicable)
    loan?: string // Reference to the loan (if applicable)
}

export interface ClaimData {
    loanId: string,
    status: string,
    reason: string,
    organization: string,
    timestamp: string
}

export interface DisconnectedData {
    isWithinSchedule: boolean,
    schedules: Schedule[],
    disconnectInfo: {
        day: string,
        time: string,
        timestamp: string
    }
}