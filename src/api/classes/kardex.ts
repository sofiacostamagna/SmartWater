import { KardexDetail, KardexInitialBalances, MatchedElement } from "../../type/Kardex";
import { IKardexDetailGetParams, IKardexReportsParams, KardexReportReturnMap } from "../types/kardex";
import { generateQueryString } from "../utils/common";
import { ApiConnector } from "./api-conector";

export abstract class KardexApiConector {
    private static root_path = "/kardex"

    static async getInitialBalances(): Promise<KardexInitialBalances | null> {
        try {
            const res = await ApiConnector.getInstance().get(`${this.root_path}/find/initial-balance`)
            if ('initialBalance' in res.data) {
                return res.data
            } else {
                return null
            }
        } catch (error) {
            return null
        }
    }

    static async getKardexElements(): Promise<{ elements: MatchedElement[] } | null> {
        try {
            const res = await ApiConnector.getInstance().get(`${this.root_path}/elements-match`)
            return res.data
        } catch (error) {
            return null
        }
    }

    static async kardexReports<T extends keyof KardexReportReturnMap>(params: IKardexReportsParams & { type: T }): Promise<KardexReportReturnMap[T] | null> {
        const query = generateQueryString(params)

        try {
            const res = await ApiConnector.getInstance().get(`${this.root_path}/report-${params.type}${query ? `?${query}` : ''}`)
            return res.data
        } catch (error) {
            return null
        }
    }

    static async reportDetails(params: IKardexDetailGetParams): Promise<{ balances: KardexDetail[] } | null> {
        const query = generateQueryString(params)

        try {
            const res = await ApiConnector.getInstance().get(`${this.root_path}/report-detail${query ? `?${query}` : ''}`)
            return res.data
        } catch (error) {
            return null
        }
    }

    static async createInitialBalance(data: { itemId: string; initialBalance: number; date: string }): Promise<boolean> {
        try {
            // Correct the URL to avoid duplicate `/v1/`
            const res = await ApiConnector.getInstance().post(`/valued-physical-inventory/initial-balance`, data);
            console.log("Initial Balance Created:", res.data); // Debug created initial balance
            return true;
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.error("Validation Error:", error.response.data.message); // Handle validation errors
            } else {
                console.error("Error Creating Initial Balance:", error); // Debug other errors
            }
            return false;
        }
    }
}