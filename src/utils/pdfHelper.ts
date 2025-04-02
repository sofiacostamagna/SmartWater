import { Template } from "@pdfme/common";
import { generate } from "@pdfme/generator";
import { text, multiVariableText, table, rectangle } from "@pdfme/schemas";
import React from "react";
import toast from "react-hot-toast";

export const showGeneratePDF = async (
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    template: Template,
    inputs: any[]
) => {
    setLoading(true);

    try {
        console.log("Template (debug):", JSON.stringify(template, null, 2));
        console.log("Inputs (debug):", JSON.stringify(inputs, null, 2));
        const pdf = await generate({
            template,
            inputs,
            plugins: { 
                Text: text, 
                Rectangle: rectangle, 
                Table: table, 
                "Multi-Variable Text": multiVariableText 
            },
        });

        const blob = new Blob([pdf], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Otros_Ingresos_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error generando el PDF:", error);
        toast.error("Error generando el PDF");
        throw error; // Re-lanzar el error para manejarlo en el componente
    } finally {
        setLoading(false);
    }
};