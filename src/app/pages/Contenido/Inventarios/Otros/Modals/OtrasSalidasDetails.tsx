import { useContext, useEffect, useMemo } from "react";
import { InventariosOtrosContext } from "../InventariosOtrosProvider";
import { formatDateTime } from "../../../../../../utils/helpers";
import { UnitMeasure } from "../../../../../../type/Products/UnitMeasure";
import { MatchedElement, OtherOutput } from "../../../../../../type/Kardex";
import { showGeneratePDF } from "../../../../../../utils/pdfHelper";
import { detailsTemplate } from "./pdfTemplates";
import { useGlobalContext } from "../../../../../SmartwaterContext";

interface Props {
    onCancel?: () => void;
    elements: MatchedElement[];
    allOutputs: OtherOutput[]; // Lista completa de salidas
}

const OtrasSalidasDetails = ({ elements, onCancel, allOutputs }: Props) => {
    const { selectedOutput } = useContext(InventariosOtrosContext);
    const { setLoading } = useGlobalContext();

    // Filtrar todas las salidas que comparten el mismo código
    const relatedOutputs = useMemo(() => {
        if (!selectedOutput || !selectedOutput.code) return [];
        return allOutputs.filter((output) => output.code === selectedOutput.code);
    }, [selectedOutput, allOutputs]);

    useEffect(() => {
        if (!selectedOutput || relatedOutputs.length === 0) {
            if (onCancel) onCancel();
        }
    }, [selectedOutput, relatedOutputs, onCancel]);

    const report = async () => {
        if (relatedOutputs.length > 0) {
            try {
                setLoading(true);

                // Crear los inputs para la plantilla
                const inputs = relatedOutputs.map((entry) => {
                    const matchedElement = elements.find(e => e.name === entry.elementName);
                    const product = matchedElement?.name || "Producto desconocido";
                    const unitMeasure = (matchedElement?.unitMeasure as UnitMeasure)?.name || "";

                    return {
                        code: JSON.stringify({ code: entry.code || "Sin código" }),
                        date: formatDateTime(entry.registerDate.toString(), 'numeric', '2-digit', '2-digit'),
                        type: entry.type === 'production_delivered' ? "Salida a producción" : "Salida por ajuste",
                        product: product,
                        quantity: JSON.stringify({ quantity: entry.quantity.toString(), unit: unitMeasure }),
                        comment: entry.detail || "Sin comentario"
                    };
                });

                console.log("Datos para PDF:", inputs);
                console.log("Datos para PDF (debug):", JSON.stringify(inputs, null, 2));

                // Generar el PDF
                await showGeneratePDF(setLoading, detailsTemplate, inputs);
            } catch (error) {
                console.error("Error al generar PDF:", error);
                alert("Error al generar el PDF: " + (error instanceof Error ? error.message : String(error)));
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full p-6 relative text-sm">
            <div className="flex gap-4 items-center justify-end absolute top-4 right-4 print:hidden">
                <button
                    type="button"
                    className="bg-blue_bright w-20 h-12 flex items-center justify-center rounded-[30px]"
                    onClick={() => report()}
                >
                    <img src="/document.svg" alt="Exportar" />
                </button>
            </div>

            <div className="mt-14 flex flex-col gap-6">
                {relatedOutputs.map((entry, index) => (
                    <div key={index} className="border-b pb-4 mb-4">
                        <p>{formatDateTime(entry.registerDate, 'numeric', '2-digit', '2-digit')}</p>
                        <p><strong>Código:</strong> {entry.code || "Sin código"}</p>
                        <p><strong>Tipo:</strong> {entry.type === 'production_delivered' ? 'Salida a producción' : 'Salida por ajuste'}</p>
                        <p><strong>Producto:</strong> {elements.find(e => e.name === entry.elementName)?.name || "Producto desconocido"}</p>
                        <p><strong>Cantidad:</strong> {entry.quantity.toLocaleString()} {(elements.find(e => e.name === entry.elementName)?.unitMeasure as UnitMeasure)?.name || ""}</p>

                        <div className="flex flex-col gap-1">
                            <strong>Comentario</strong>
                            <p className="h-[100px] p-4 rounded-[10px] border border-font-color">{entry.detail || "Sin comentario"}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="w-full sticky bottom-0 bg-main-background h-full z-50 text-base">
                <div className="py-4 flex flex-row gap-4 items-center justify-center px-6">
                    <button
                        onClick={onCancel}
                        className="w-full bg-blue_bright py-2 rounded-full text-white font-bold shadow-xl"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OtrasSalidasDetails;