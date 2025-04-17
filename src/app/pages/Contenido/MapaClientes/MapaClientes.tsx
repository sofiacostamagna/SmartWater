import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import { FiltroPaginado, IFiltroPaginadoReference } from "../../components/FiltroPaginado/FiltroPaginado";
import { PageTitle } from "../../components/PageTitle/PageTitle";
import "./MapaClientes.css";
import { MapaClientesContext } from "./MapaClientesContext";
import { Client } from "../../../../type/Cliente/Client";
import { ClientsApiConector, LoansApiConector, OrdersApiConector, UsersApiConector, ZonesApiConector } from "../../../../api/classes";
import { IClientGetParams } from "../../../../api/types/clients";
import Modal from "../../EntryComponents/Modal";
import { User } from "../../../../type/User";
import { Zone } from "../../../../type/City";
import { useDebounce } from "@uidotdev/usehooks";
import moment from "moment";
import ClientForm from "../../EntryComponents/Client.form";
import { client } from "../Clientes/ClientesContext";
import LeafletMap from "../../components/LeafletMap/LeafletMap";
import { useSearchParams } from "react-router-dom";
import { useGlobalContext } from "../../../SmartwaterContext";
import { Order } from "../../../../type/Order/Order";
import { ClientStatus } from "../../components/LeafletMap/constants";
import FiltroClientesMapa from "./FiltroClientesMapa/FiltroClientesMapa";
import { OpcionesMap } from "./OpcionesMap/OpcionesMap";

const MapaClientes: React.FC = () => {
  const { showFiltro, setShowFiltro, showModal, setShowModal, selectedOption, setSelectedOption, zones, setZones, allClients, setAllClients, setSelectedClient } = useContext(MapaClientesContext);
  const { setLoading } = useGlobalContext()

  const [clients, setClients] = useState<(Client & { status: ClientStatus })[]>([]);
  const [passedThis, setPassedThis] = useState<boolean>(false);

  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  const [distribuidores, setDistribuidores] = useState<User[]>([]);
  const filteredClients = clients.filter(client => 
  client.location?.latitude && client.location?.longitude
);

  const filterRef = useRef<IFiltroPaginadoReference>(null)
  const [savedFilters, setSavedFilters] = useState<IClientGetParams['filters'] & { status?: ClientStatus[] }>({});
  const [query, setQuery] = useSearchParams()
  const [queryData, setQueryData] = useState<IClientGetParams & { text?: string; status?: ClientStatus[] } | null>(null)

  useEffect(() => {
    if (query.has('latitude') && query.has('longitude')) {
      console.log("Hi there", latitude, longitude)
      setLatitude(parseFloat(query.get('latitude')!))
      setLongitude(parseFloat(query.get('longitude')!))
    } else {
      setLatitude(undefined)
      setLongitude(undefined)
    }

    if (query.has('filters')) {
      const queryRes: IClientGetParams & { text?: string; status?: ClientStatus[] } = JSON.parse(atob(query.get('filters')!))
      setQueryData(queryRes)

      if (queryRes.filters) {
        if (queryRes.text) {
          filterRef.current?.setSearch(queryRes.text)
        } else {
          filterRef.current?.clearSearch()
        }

        if (queryRes.filters) {
          const filters: IClientGetParams['filters'] & { status?: ClientStatus[] } = { ...queryRes.filters }
          if (queryRes.status) { filters.status = queryRes.status }
          setSavedFilters(filters)
        }
      }
    } else {
      setQuery({ filters: btoa(JSON.stringify({ filters: {} })) })
    }

    setPassedThis(true)
  }, [query, setQuery])

  const getClientStatus = (client: Client, orders: Order[]): ClientStatus => {
    const twoDaysAgoStart = moment().subtract(2, 'days').startOf('day'); // Started two days ago
    const todayEnd = moment().endOf('day'); // End of current day
  
    if (orders.some(o => !o.attended && o.client === client._id)) {
      return 'inProgress';
    }
    if (
      orders.some(
        o =>
          o.attended &&
          moment(o.attended).isBetween(twoDaysAgoStart, todayEnd, undefined, '[]') &&
          o.client === client._id
      )
    ) {
      return 'attended';
    }
    if (client.renewDate) {
      if (moment().isAfter(client.renewDate)) {
        return 'renewClient';
      }
    }
    return 'default';
  }

  const getClientActiveOrders = (client: Client, orders: Order[]): string[] => {
    const ords = orders.filter(o => !o.attended && moment(o.attended).isSame(moment(), 'day') && o.client === client._id)
    return ords.map(o => o._id)
  }

  const getClientStatusFromOrder = (o: Order): ClientStatus => {
    const todayStart = moment().startOf('day');
    const todayEnd = moment().endOf('day');
  
    if (!o.attended) {
      return 'inProgress';
    }
    if (o.attended && moment(o.attended).isBetween(todayStart, todayEnd, undefined, '[]')) {
      return 'attended';
    }
    return 'default';
  };
  
  const fetchClients = useCallback(async () => {
    if (passedThis) {
      setLoading(true);

      const ordersData = await OrdersApiConector.get({ pagination: { page: 1, pageSize: 30000 } });
      const ords = ordersData?.data || [];
      const loansData = await LoansApiConector.get({ pagination: { page: 1, pageSize: 30000 } });
      const loans = loansData?.data || [];

      const qd = { ...queryData };
      const extraFilters: IClientGetParams['filters'] = {};

      if (!!qd.filters?.initialDate && !qd.filters?.finalDate) {
        extraFilters.finalDate = moment().format("YYYY-MM-DD");
      }
      if (!qd.filters?.initialDate && !!qd.filters?.finalDate) {
        extraFilters.initialDate = "2020-01-01";
      }

      let filteredOrders = ords;

    // Apply filter of orders attended only for the current day if the selected status is "attended"
    if (qd.status?.includes("attended")) {
      const todayStart = moment().startOf('day');
      const todayEnd = moment().endOf('day');

      filteredOrders = ords.filter(o => {
        const attendedDate = moment(o.attended);
        return (
          o.attended &&
          attendedDate.isBetween(todayStart, todayEnd, undefined, '[]')
        );
      });
    }

      const clientsData = await ClientsApiConector.getClients({
        pagination: { page: 1, pageSize: 30000 },
        filters: { ...qd.filters, ...extraFilters, clientDeleted: false },
      });

      let clientsToSet = clientsData?.data || [];

      let clientsWithStatus: (Client & { status: ClientStatus })[] = clientsToSet.map((client) => {
        const status = getClientStatus(client, filteredOrders);
        return {
          ...client,
          status,
          associatedOrders: filteredOrders
            .filter(o => o.client === client._id)
            .map(o => o._id), // Associate the orders served to the customer
          numberOfLoans: loans.filter(l => l.client.some(c => c._id === client._id)).length,
        };
      });

    // Filter clients based on the selected status
      if (qd.status && qd.status.length > 0) {
        clientsWithStatus = clientsWithStatus.filter(client =>
          qd.status?.includes(client.status)
        );
      }

// Include unregistered customers if the filter has no restrictions
      const hasRestrictiveFilters =
        qd.filters?.hasLoan || 
        qd.filters?.hasContract || 
        qd.filters?.hasCredit || 
        (qd.filters?.renewedAgo !== undefined && qd.filters?.renewedAgo > 0) || 
        (qd.filters?.renewedIn !== undefined && qd.filters?.renewedIn > 0) || 
        qd.filters?.initialDate || 
        qd.filters?.finalDate;

      if (!hasRestrictiveFilters) {
        if (qd.status?.includes('inProgress')) {
          clientsWithStatus.push(
            ...ords
              .filter(o => !o.client && !o.attended) 
              .map((o) => ({
                ...o.clientNotRegistered as unknown as Client,
                isClient: false,
                isAgency: false,
                associatedOrders: [o._id],
                status: getClientStatusFromOrder(o),
                numberOfOrders: 1,
              }))
          );
        }
      }

      setClients(clientsWithStatus);
      setLoading(false);
    }
  }, [queryData, setLoading, passedThis]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    const fetchZones = async () => {
      setZones((await ZonesApiConector.get({}))?.data || []);
      setAllClients((await ClientsApiConector.getClients({ pagination: { page: 1, pageSize: 30000 } }))?.data || []);
      setDistribuidores((await UsersApiConector.get({ pagination: { page: 1, pageSize: 30000, sort: 'desc' }, filters: { desactivated: false } }))?.data || []);
    }
    fetchZones()
  }, [])

  const handleFilterChange = (filters: IClientGetParams['filters'] & { status?: ClientStatus[] }) => {
    const status = filters.status
    delete filters.status

    setQuery({ filters: btoa(JSON.stringify({ filters, text: queryData?.text, status })) })
    setSavedFilters(filters);
  };

  const [searchTerm, setSearchTerm] = useState<string>("")
  const searchParam = useDebounce<string>(searchTerm, 400)
  useEffect(() => {
    if (searchParam && searchParam.trim() !== "") {
      if (!queryData?.text || queryData.text !== searchParam) {
        setQuery({ filters: btoa(JSON.stringify({ ...queryData, text: searchParam })) })
      }
    } else {
      if (!!queryData?.text) {
        setQuery({ filters: btoa(JSON.stringify({ ...queryData, text: undefined })) })
      }
    }
  }, [searchParam])

  // Función para manejar clics en los íconos de estado
  const handleStatusFilterClick = (statusKey: ClientStatus) => {
    const newFilters = {
      ...savedFilters,
      status: [statusKey], // Combina el estado actual con el nuevo
    };
  
    // Si el estado es "inProgress", asegúrate de incluir solo clientes registrados
    if (statusKey === "inProgress") {
      newFilters.isClient = true;
    
    }
  
    handleFilterChange(newFilters); // Actualizar los filtros
  };

  const clearFilters = () => {
    setSavedFilters({});
    setQuery({ filters: btoa(JSON.stringify({ filters: {} })) });
    fetchClients(); // Recargar los clientes sin filtros
  };

  return (
    <>
      <div className="px-10 overflow-auto h-screen flex justify-between flex-col">
        <PageTitle titulo="Mapa de clientes" icon="./ubicacion-icon.svg" />
        <FiltroPaginado
          ref={filterRef}
          noContent
          filtro
          paginacion={false}
          exportar={false}
          iconUbicacion
          iconUbicacionInject={
            <div
              style={{
                display: "flex",
                gap: "15px", // Reduce el espacio entre los elementos
                marginBottom: "25px",
                marginTop: "10px",
                alignItems: "center", // Alinea verticalmente los elementos
              }}
            >
              {/* Contenedor de los íconos SVG */}
              <div style={{ display: "flex", gap: "15px" }}>
                {/* Pedidos en curso */}
                <div
                  className="Mapaclientes-ubicacion"
                  onClick={() => handleStatusFilterClick("inProgress")}
                  style={{ cursor: "pointer" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="30"
                    viewBox="0 0 31 47"
                    fill="#DD0000"
                  >
                    <path d="M31 15.3918C31 23.8925 23.1159 33.807 15.5 47C6.78557 33.807 0 23.8925 0 15.3918C0 6.89115 6.93959 0 15.5 0C24.0604 0 31 6.89115 31 15.3918Z" />
                  </svg>
                  <span>Pedidos en curso</span>
                </div>

                {/* Clientes deben renovar */}
                <div
                  className="Mapaclientes-ubicacion"
                  onClick={() => handleStatusFilterClick("renewClient")}
                  style={{ cursor: "pointer" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="30"
                    viewBox="0 0 31 47"
                    fill="#FF5C00"
                  >
                    <path d="M31 15.3918C31 23.8925 23.1159 33.807 15.5 47C6.78557 33.807 0 23.8925 0 15.3918C0 6.89115 6.93959 0 15.5 0C24.0604 0 31 6.89115 31 15.3918Z" />
                  </svg>
                  <span>Clientes deben renovar</span>
                </div>

                {/* Resto de clientes */}
                <div
                  className="Mapaclientes-ubicacion"
                  onClick={() => handleStatusFilterClick("default")}
                  style={{ cursor: "pointer" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="30"
                    viewBox="0 0 31 47"
                    fill="#960090"
                  >
                    <path d="M31 15.3918C31 23.8925 23.1159 33.807 15.5 47C6.78557 33.807 0 23.8925 0 15.3918C0 6.89115 6.93959 0 15.5 0C24.0604 0 31 6.89115 31 15.3918Z" />
                  </svg>
                  <span>Resto de clientes</span>
                </div>

                {/* Pedidos atendidos */}
                <div
                  className="Mapaclientes-ubicacion"
                  onClick={() => handleStatusFilterClick("attended")}
                  style={{ cursor: "pointer" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="30"
                    viewBox="0 0 31 47"
                    fill="#1FAF38"
                  >
                    <path d="M31 15.3918C31 23.8925 23.1159 33.807 15.5 47C6.78557 33.807 0 23.8925 0 15.3918C0 6.89115 6.93959 0 15.5 0C24.0604 0 31 6.89115 31 15.3918Z" />
                  </svg>
                  <span>Pedidos atendidos</span>
                </div>
              </div>

              {/* Botón Quitar Filtros */}
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-blue-500 underline hover:text-blue-700"
                style={{ marginLeft: "10px" }} // Espaciado sutil entre los íconos y el botón
              >
                Quitar filtros
              </button>
            </div>
          }
          search={(val: string) => setSearchTerm(val)}
          onFilter={() => setShowFiltro(true)}
          hasFilter={!!savedFilters && Object.keys(savedFilters).length > 0}
        ></FiltroPaginado>
     
        <div className="MapaClientes w-full flex-1 pb-10">
        <LeafletMap
  onAdd={() => setSelectedOption(true)}
  clients={filteredClients} 
  latitude={latitude}
  longitude={longitude}
  setSelectedClient={setSelectedClient}
/>
        </div>
      </div>

      <Modal isOpen={showFiltro} onClose={() => setShowFiltro(false)}>
        <FiltroClientesMapa
          setShowFiltro={setShowFiltro}
          distribuidores={distribuidores}
          zones={zones}
          onChange={handleFilterChange}
          initialFilters={savedFilters}
        />
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2 className="text-blue_custom font-semibold p-6 pb-0 sticky top-0 z-30 bg-main-background">
          Registrar Cliente
        </h2>
        <ClientForm zones={zones} isOpen={showModal} onCancel={() => setShowModal(false)} allClients={allClients} selectedClient={client} />
      </Modal>

      <Modal
        isOpen={selectedOption}
        onClose={() => {
          setSelectedOption(false);
        }}
        className="w-3/12"
      >
        <h2 className="text-blue_custom font-semibold p-6 pb-0 sticky top-0 z-30 bg-main-background">
          {/* Registrar Cliente */}
        </h2>
        <div className="p-6">
          <OpcionesMap onClose={() => { setSelectedOption(false); }} />
        </div>
      </Modal>
    </>
  );
};

export { MapaClientes };