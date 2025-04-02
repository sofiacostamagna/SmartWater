import { useContext, useEffect, useMemo } from "react";
import { Item } from "../../../../../../type/Item";
import Product from "../../../../../../type/Products/Products";
import { InventariosOtrosContext } from "../InventariosOtrosProvider";
import { formatDateTime } from "../../../../../../utils/helpers";
import { UnitMeasure } from "../../../../../../type/Products/UnitMeasure";
import { MatchedElement } from "../../../../../../type/Kardex";
import { showGeneratePDF } from "../../../../../../utils/pdfHelper";
import { detailsTemplate } from "./pdfTemplates";
import { useGlobalContext } from "../../../../../SmartwaterContext";


interface Props {
    onCancel?: () => void;
    elements: MatchedElement[]
}

const OtrosIgresosDetails = ({ elements, onCancel }: Props) => {
    const { selectedEntry } = useContext(InventariosOtrosContext); 
    const { setLoading } = useGlobalContext();

    useEffect(() => {
        if (!selectedEntry || selectedEntry.length === 0) {
            if (onCancel) onCancel();
        }
    }, [selectedEntry, onCancel]);

    const report = async () => {
        if (selectedEntry && selectedEntry.length > 0) {
            try {
                // Combinar todas las filas en una sola tabla
                const rows = selectedEntry.map((entry) => {
                    const product = elements.find(e => e.name === entry.elementName)?.name || "Producto desconocido";
                    const unitMeasure = (elements.find(e => e.name === entry.elementName)?.unitMeasure as UnitMeasure)?.name || "";
    
                    return [
                        formatDateTime(entry.registerDate, 'numeric', '2-digit', '2-digit'),
                        entry.type === 'production_received' ? "Ingreso de producción" : "Ingreso por ajuste",
                        product,
                        `${entry.quantity} ${unitMeasure}`,
                        entry.code || "Sin código",
                    ];
                });
    
                // Validar que las filas no estén vacías
                if (!rows || rows.length === 0) {
                    throw new Error("No hay datos para generar el PDF.");
                }
    
                // Crear los inputs para la plantilla
                const inputs = [
                    {
                        title: "Detalle de Ingresos",
                        table: {
                            rows, // Pasar todas las filas combinadas
                        },
                    },
                ];
    
                console.log("Datos para PDF:", inputs);
    
                // Generar el PDF
                await showGeneratePDF(setLoading, detailsTemplate, inputs);
            } catch (error) {
                console.error("Error al generar PDF:", error);
                alert("Error al generar el PDF"); // Mostrar alerta de error
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
                {selectedEntry?.map((entry, index) => (
                    <div key={index} className="border-b pb-4 mb-4">
                        <p>{formatDateTime(entry.registerDate, 'numeric', '2-digit', '2-digit')}</p>
                        <p><strong>Código:</strong> {entry.code || "Sin código"}</p>
                        <p><strong>Tipo:</strong> {entry.type === 'production_received' ? `Ingreso de producción` : `Ingreso por ajuste`}</p>
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

export default OtrosIgresosDetails