import React, { useCallback, useContext, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { formatDateTime } from '../../../../../../utils/helpers'
import { InventariosOtrosContext } from '../InventariosOtrosProvider'
import { useGlobalContext } from '../../../../../SmartwaterContext'
import { OtherEntry } from '../../../../../../type/Kardex'
import { ValuedPhysicalApiConector } from '../../../../../../api/classes/valued-physical'

interface Props {
    data: OtherEntry[];
    totalRows: number;
    pageSize: number;
    handleChangePage: React.Dispatch<React.SetStateAction<number>>
    className?: string;
    tableClassName?: string;
}

const TableOtrosIngresos = ({ data, className, tableClassName, pageSize, totalRows, handleChangePage }: Props) => {
    const { setSelectedEntry, setSelectedOption, setShowModal } = useContext(InventariosOtrosContext)
    const { loading } = useGlobalContext()

    // Add currentPage state
    const [currentPage, setCurrentPage] = useState(1);

    const deleteRegistry = useCallback((code: string) => {
        toast.error(
            (t) => (
                <div>
                    <p className="mb-4 text-center text-[#888]">
                        Se <b>eliminarán</b> todos los registros con el código <b>{code}</b>, <br /> pulsa <b>Proceder</b> para continuar
                    </p>
                    <div className="flex justify-center">
                        <button
                            className="bg-red-500 px-3 py-1 rounded-lg ml-2 text-white"
                            onClick={() => { toast.dismiss(t.id); }}
                        >
                            Cancelar
                        </button>
                        <button
                            className="bg-blue_custom px-3 py-1 rounded-lg ml-2 text-white"
                            onClick={async () => {
                                toast.dismiss(t.id);

                                // Filtrar los registros con el código especificado
                                const entriesToDelete = data.filter(entry => entry.code === code);

                                // Eliminar cada registro
                                for (const entry of entriesToDelete) {
                                    if (entry._id) {
                                        const response = await ValuedPhysicalApiConector.deleteOther({ entryId: entry._id, type: 'entrys' });
                                        if (!response || !response.message) {
                                            toast.error(`Error al eliminar el registro con ID ${entry._id}`, {
                                                position: "top-center",
                                                duration: 2000
                                            });
                                            return;
                                        }
                                    }
                                }

                                toast.success(`Se eliminaron todos los registros con el código ${code}`, {
                                    position: "top-center",
                                    duration: 2000
                                });
                                window.location.reload();
                            }}
                        >
                            Proceder
                        </button>
                    </div>
                </div>
            ),
            {
                className: "shadow-md dark:shadow-slate-400 border border-slate-100 bg-main-background",
                icon: null,
                position: "top-center"
            }
        );
    }, [data]);

    const groupedData = useMemo(() => {
        const groups: { [key: string]: OtherEntry[] } = {};
        data.forEach((entry) => {
            const code = entry.code || "Sin código";
            if (!groups[code]) {
                groups[code] = [];
            }
            groups[code].push(entry);
        });
        return groups;
    }, [data]);

    return (
        <div className={`text-font-color ${className}`}>
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr_1fr_1fr]  font-bold p-3 border border-gray-300 rounded-t-md border-b-0 text-sm items-start text-start">
                <div className="truncate">Fecha y hora</div>
                <div className="truncate">Tipo de ingreso</div>
                <div className="truncate">Código</div>
                <div className="truncate">Comentario</div>
                <div className="truncate">Cantidad</div>
                <div></div> {/* Empty column for actions */}
            </div>

            {/* Grouped Rows */}
            {Object.entries(groupedData).map(([code, entries]) => (
                <div key={code} className="border-2 border-blue-500 rounded-lg mb-2">
                    {entries.map((entry, index) => (
           <div key={entry._id || index} className="grid grid-cols-[1fr_1fr_1fr_1.5fr_1fr_1fr] items-center border-b last:border-b-0 p-3 text-sm">
                            <div className="truncate">{entry.registerDate ? formatDateTime(entry.registerDate, 'numeric', '2-digit', '2-digit', true, true) : "N/A"}</div>
                            <div className="truncate">{entry.type === 'production_received' ? "De producción" : "Por ajuste"}</div>
                            <div className="truncate">{code}</div>
                            <div className="truncate">{entry.detail || "Sin comentario"}</div>
                            <div className="truncate">{entry.quantity.toLocaleString()}</div>
                            <div className="flex justify-end gap-2 mr-2">
                         <button onClick={() => { 
                           setSelectedEntry(entries); 
                            setSelectedOption(true); 
                           }}>
                        <i className="fa fa-eye text-blue_bright" aria-hidden="true"></i>
                   </button>
<button onClick={() => { setSelectedEntry([entry]); setShowModal(true); }}>
    <i className="fa-solid fa-pen-to-square text-blue_bright" aria-hidden="true"></i>
</button>
                                <button onClick={() => entry.code && deleteRegistry(entry.code)}>
                                    <i className="fa fa-trash text-red-500" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            

            {/* Pagination */}
            {totalRows > pageSize && (
                <div className="flex gap-2 w-full justify-end mt-2 items-center">
                    <button
                        type="button"
                        className={`px-2 py-0.5 rounded-sm shadow-xl ${
                            currentPage === 1 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white"
                        }`}
                        onClick={() => {
                            if (currentPage > 1) {
                                setCurrentPage((prev) => prev - 1);
                                handleChangePage((prev) => prev - 1);
                            }
                        }}
                        disabled={currentPage === 1}
                    >
                        {"<"}
                    </button>
                    <span className="text-sm">{` ${currentPage} de ${Math.ceil(totalRows / pageSize)} `}</span>
                    <button
                        type="button"
                        className={`px-2 py-0.5 rounded-sm shadow-xl ${
                            currentPage === Math.ceil(totalRows / pageSize) ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white"
                        }`}
                        onClick={() => {
                            if (currentPage < Math.ceil(totalRows / pageSize)) {
                                setCurrentPage((prev) => prev + 1);
                                handleChangePage((prev) => prev + 1);
                            }
                        }}
                        disabled={currentPage === Math.ceil(totalRows / pageSize)}
                    >
                        {">"}
                    </button>
                </div>
            )}
        </div>
    );
}

export default TableOtrosIngresos;