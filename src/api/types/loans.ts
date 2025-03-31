import { FilteredSearch, Search } from "./common";

export interface ILoansGetParams extends Search {
    filters?: {
        client?: string;
        initialDate?: string;
        finalDate?: string;
        hasContract?: boolean;
        hasExpiredContract?: boolean;
        renewedAgo?: number;
        renewedIn?: number;
        zone?: string;
        user?: string;
        year?: number;
        month?: number;
    }
}

export interface ILoanConsolidatedGetParams extends FilteredSearch {
    filters?: {
        user?: string;
        client?: string;
        initialDate?: string;
        finalDate?: string;
        hasContract?: boolean;
    }
}

export interface ILoanBody {
    data: {
        user: string;
        client: string;
        contract?: { // Hacer que contract sea opcional
            link: string | null;
            validUntil: string | null;
        };
        comment: string;
        detail: {
            item: string;
            quantity: number;
        }[];
        totalItems?: number;
        forceOut: boolean;
    };
}

export interface ILoanFilter {
    loanId: string;
}
