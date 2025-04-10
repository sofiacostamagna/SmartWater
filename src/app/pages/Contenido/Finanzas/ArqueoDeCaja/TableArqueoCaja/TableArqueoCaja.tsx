import { useCallback, useContext, useEffect, useState, useMemo } from "react";
import { Transaction } from "../../../../../../type/Cash";
import { formatDateTime } from "../../../../../../utils/helpers";
import DataTable, { TableColumn } from "react-data-table-component";
import toast from "react-hot-toast";
import Modal from "../../../../EntryComponents/Modal";
import { FinalizarArqueoCaja } from "../FinalizarArqueoCaja/FinalizarArqueoCaja";
import { CashRegisterApiConector } from "../../../../../../api/classes";
import { ArqueoDeCajaContext } from "../ArqueoDeCajaContext";
import moment from "moment";
import { FiltroPaginado } from "../../../../components/FiltroPaginado/FiltroPaginado";
import { FiltroArqueoDeCaja } from "../FiltroArqueoDeCaja/FiltroArqueoDeCaja";

const TableArqueoCaja = ({ cash }: { cash: Transaction[] }) => {
  const { selectedTransaction, setSelectedTransaction } = useContext(ArqueoDeCajaContext);
  const [filteredCash, setFilteredCash] = useState<Transaction[]>([]); // Estado para los datos filtrados
  const [onlyOpen, setOnlyOpen] = useState<boolean>(false); // Estado para mostrar solo abiertos
  const [showFiltroModal, setShowFiltroModal] = useState(false); // State for showing the filter modal
  const [hasFilter, setHasFilter] = useState(false); // State for active filters
  const [appliedFilters, setAppliedFilters] = useState<{ initialDate: string; finalDate: string } | null>(null); // State for storing applied filters

  const fetchCashData = async () => {
    try {
      const filters: any = {};

      // Combine "Mostrar solo abiertos" filter
      if (onlyOpen) {
        filters.open = true;
      }

      // Combine date filters
      if (appliedFilters) {
        const { initialDate, finalDate } = appliedFilters;
        filters.initialDate = initialDate;
        filters.finalDate = finalDate;
      }

      console.log("Fetching data with combined filters:", filters); // Debugging combined filters

      const response = await CashRegisterApiConector.get({ filters });

      console.log("API response:", response); // Debugging API response

      if (response) {
        setFilteredCash(response || []);
      } else {
        setFilteredCash([]);
      }
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      toast.error("Error al cargar los datos.");
    }
  };

  // Trigger `fetchCashData` whenever `onlyOpen` or `appliedFilters` changes
  useEffect(() => {
    fetchCashData();
  }, [onlyOpen, appliedFilters]);

  const deleteRegistry = useCallback((id: string) => {
    toast.error(
      (t) => (
        <div>
          <p className="mb-4 text-center text-[#888]">
            Se <b>eliminará</b> este arqueo, <br /> pulsa <b>Proceder</b> para continuar
          </p>
          <div className="flex justify-center">
            <button
              className="bg-red-500 px-3 py-1 rounded-lg ml-2 text-white"
              onClick={() => {
                toast.dismiss(t.id);
              }}
            >
              Cancelar
            </button>
            <button
              className="bg-blue_custom px-3 py-1 rounded-lg ml-2 text-white"
              onClick={async () => {
                toast.dismiss(t.id);
                const response = await CashRegisterApiConector.delete({ registryId: id }) as any;
                if (!!response) {
                  if (response.mensaje) {
                    toast.success(response.mensaje, {
                      position: "top-center",
                      duration: 2000,
                    });
                    fetchCashData(); // Recargar los datos después de eliminar
                  } else if (response.error) {
                    toast.error(response.error, {
                      position: "top-center",
                      duration: 2000,
                    });
                  }
                } else {
                  toast.error("Error al eliminar cliente", {
                    position: "top-center",
                    duration: 2000,
                  });
                }
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
        position: "top-center",
      }
    );
  }, []);

  const columns: TableColumn<Transaction>[] = useMemo<TableColumn<Transaction>[]>(() => [
    {
      name: "Hora de apertura",
      selector: (row) =>
        row.startDate
          ? formatDateTime(row?.startDate, "numeric", "2-digit", "2-digit", true, true)
          : "N/A",
      width: "15%",
    },
    {
      name: "Hora de cierre",
      selector: (row) =>
        row.endDate
          ? formatDateTime(row?.endDate, "numeric", "2-digit", "2-digit", true, true)
          : "N/A",
      width: "15%",
    },
    {
      name: "Distribuidor",
      selector: (row) =>
        `${row.userDetails?.fullName || "Distribuidor desconocido"} ${
          row.userDetails?.role === "admin" ? "(Administrador)" : ""
        }`,
      width: "30%",
    },
    {
      name: "Sistema",
      selector: (row) =>
        `${
          (row?.initialAmount || 0) +
          (row?.incomeCashTotal || 0) +
          (row?.creditBillsSales || 0) -
          ((row?.expenseCashTotal || 0) + (row?.expenseCurrentAccountTotal || 0)) || "N/A"
        } Bs`,
      width: "10%",
    },
    {
      name: "Diferencia",
      selector: (row) =>
        `${
          !row.creationMethod || row.creationMethod === "open-close"
            ? "0"
            : row?.difference.toLocaleString() || "N/A"
        } Bs`,
      width: "10%",
    },
    {
      name: "Estado",
      selector: (row) => (row?.state ? "Abierto" : "Cerrado"),
      width: "10%",
    },
    {
      name: "Acciones",
      width: "10%",
      cell: (row) => (
        <div className="flex items-center w-full gap-4">
          <button onClick={() => setSelectedTransaction(row)}>
            <i className="fa fa-eye text-blue_bright" aria-hidden="true"></i>
          </button>
          <button onClick={() => deleteRegistry(row._id)}>
            <i className="fa fa-trash text-red-500" aria-hidden="true"></i>
          </button>
        </div>
      ),
    },
  ], [deleteRegistry, setSelectedTransaction]);

  const handleApplyFilters = (filters: { initialDate: string; finalDate: string }) => {
    console.log("Applying date filters:", filters); // Debugging applied filters
    setAppliedFilters(filters); // Save applied filters
    setHasFilter(true); // Mark filters as active
    setShowFiltroModal(false); // Close the filter modal
  };

  const handleResetDateFilters = () => {
    console.log("Resetting date filters"); // Debugging reset date filters
    setAppliedFilters(null); // Clear only date filters
    setHasFilter(false); // Mark filters as inactive
    setShowFiltroModal(false); // Close the filter modal
  };

  return (
    <>
      <div className="text-font-color">
        <DataTable
          columns={columns}
          actions={
            <div className="text-sm flex items-center gap-3">
              <button
                type="button"
                className="boton-filtro relative mr-5"
                onClick={() => setShowFiltroModal(true)}
              >
                {hasFilter && (
                  <div className="bg-red-500 rounded-full p-[5px] absolute -top-1 -right-1" />
                )}
                <span style={{ marginRight: "5px" }}>Filtrar</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <g clipPath="url(#clip0_35_4995)">
                    <path
                      d="M0 19.5C0 18.6703 0.670312 18 1.5 18H4.06406C4.64062 16.6734 5.9625 15.75 7.5 15.75C9.0375 15.75 10.3594 16.6734 10.9359 18H22.5C23.3297 18 24 18.6703 24 19.5C24 20.3297 23.3297 21 22.5 21H10.9359C10.3594 22.3266 9.0375 23.25 7.5 23.25C5.9625 23.25 4.64062 22.3266 4.06406 21H1.5C0.670312 21 0 20.3297 0 19.5ZM9 19.5C9 18.6703 8.32969 18 7.5 18C6.67031 18 6 18.6703 6 19.5C6 20.3297 6.67031 21 7.5 21C8.32969 21 9 20.3297 9 19.5ZM18 12C18 11.1703 17.3297 10.5 16.5 10.5C15.6703 10.5 15 11.1703 15 12C15 12.8297 15.6703 13.5 16.5 13.5C17.3297 13.5 18 12.8297 18 12ZM16.5 8.25C18.0375 8.25 19.3594 9.17344 19.9359 10.5H22.5C23.3297 10.5 24 11.1703 24 12C24 12.8297 23.3297 13.5 22.5 13.5H19.9359C19.3594 14.8266 18.0375 15.75 16.5 15.75C14.9625 15.75 13.6406 14.8266 13.0641 13.5H1.5C0.670312 13.5 0 12.8297 0 12C0 11.1703 0.670312 10.5 1.5 10.5H13.0641C13.6406 9.17344 14.9625 8.25 16.5 8.25ZM9 3C8.17031 3 7.5 3.67031 7.5 4.5C7.5 5.32969 8.17031 6 9 6C9.82969 6 10.5 5.32969 10.5 4.5C10.5 3.67031 9.82969 3 9 3ZM12.4359 3H22.5C23.3297 3 24 3.67031 24 4.5C24 5.32969 23.3297 6 22.5 6H12.4359C11.8594 7.32656 10.5375 8.25 9 8.25C7.4625 8.25 6.14062 7.32656 5.56406 6H1.5C0.670312 6 0 5.32969 0 4.5C0 3.67031 0.670312 3 1.5 3H5.56406C6.14062 1.67344 7.4625 0.75 9 0.75C10.5375 0.75 11.8594 1.67344 12.4359 3Z"
                    fill="currentColor"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_35_4995">
                    <rect width="24" height="24" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </button>
            <input
              type="checkbox"
              id="only"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)} // Toggle the "Mostrar solo abiertos" state
              className="accent-blue_custom"
            />
            <label htmlFor="only">Mostrar solo abiertos</label>
          </div>
        }
        className="no-border"
        data={filteredCash} // Use filteredCash for proper filtering
        pagination={true} // Enable pagination
        paginationPerPage={5} // Set pagination size
        noDataComponent={<div className="min-h-[150px] flex items-center justify-center">Sin registros</div>}
        paginationComponent={({ currentPage, onChangePage, rowCount, rowsPerPage }) => (
          <div className="flex gap-2 w-full justify-end mt-2">
            <button
              type="button"
              className="bg-blue-600 shadow-xl disabled:bg-gray-500 disabled:cursor-not-allowed px-2 py-0.5 rounded-sm"
              onClick={() => onChangePage(currentPage - 1, rowCount)}
              disabled={currentPage === 1}
            >
              <i className="fa-solid fa-angle-left text-white"></i>
            </button>
            <div className="flex items-center">
              <span className="text-paginado">{`${currentPage} de ${Math.ceil(rowCount / rowsPerPage)}`}</span>
            </div>
            <button
              type="button"
              className="bg-blue-600 shadow-xl disabled:bg-gray-500 disabled:cursor-not-allowed px-2 py-0.5 rounded-sm"
              onClick={() => onChangePage(currentPage + 1, rowCount)}
              disabled={currentPage === Math.ceil(rowCount / rowsPerPage)}
            >
              <i className="fa-solid fa-angle-right text-white"></i>
            </button>
          </div>
        )}
      />
    </div>

    <Modal isOpen={showFiltroModal} onClose={() => setShowFiltroModal(false)}>
      <FiltroArqueoDeCaja
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetDateFilters} // Reset only the date filters
        initialFilters={appliedFilters || { initialDate: "", finalDate: "" }}
      />
    </Modal>

    <Modal
      isOpen={!!selectedTransaction}
      onClose={() => setSelectedTransaction(undefined)}
      className="w-[90%] lg:w-1/2"
    >
      <h2 className="text-blue_custom font-semibold p-6 pb-0 sticky top-0 z-30 bg-main-background">
        Detalles de arqueo
      </h2>
      <div className="px-6">
        <FinalizarArqueoCaja
          cash={selectedTransaction}
          handleOnSubmit={() => {
            setSelectedTransaction(undefined);
            fetchCashData(); // Recargar los datos después de finalizar
          }}
        />
      </div>
    </Modal>
  </>
);
};

export { TableArqueoCaja };
