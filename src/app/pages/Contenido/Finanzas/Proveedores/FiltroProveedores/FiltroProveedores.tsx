import { useContext, useEffect, useMemo, useState, useRef } from "react";
import "./FiltroProveedores.css";
import { ProveedoresContext } from "../ProveedoresContext";
import { IProvidersGetParams } from "../../../../../../api/types/providers";
import { useForm } from "react-hook-form";
import moment from "moment";
import { motion } from "framer-motion";
import { Providers } from "../../../../../../type/providers";

interface IProviderFilter {
    fromDate: string | null;
    toDate: string | null;
    provider: string | null;
    nit: string | null;
}

const initialState: IProviderFilter = {
    fromDate: null,
    toDate: null,
    provider: null,
    nit: null
}

const FiltroProveedores = ({
    onChange,
    initialFilters,
    providers
}: {
    onChange: (filters: IProvidersGetParams['filters']) => void;
    initialFilters: IProvidersGetParams['filters'];
    providers: Providers[]
}) => {
    const { register, handleSubmit, setValue, watch } = useForm<IProviderFilter>({
        defaultValues: initialState || {},
    });

    useEffect(() => {
        if (initialFilters) {
            if (initialFilters.initialDate) {
                setValue('fromDate', initialFilters.initialDate, { shouldValidate: true })
            }
            if (initialFilters.finalDate) {
                setValue('toDate', initialFilters.finalDate, { shouldValidate: true })
            }
            if (initialFilters.provider) {
                setValue('provider', initialFilters.provider, { shouldValidate: true })
            }
            if (initialFilters.NIT) {
                setValue('nit', initialFilters.NIT, { shouldValidate: true })
            }
        }
    }, [initialFilters, setValue])

    const { setShowFiltro } = useContext(ProveedoresContext);

    const onSubmit = (data: IProviderFilter) => {
        const filters = filterClients(data);
        onChange(filters);
        setShowFiltro(false);
    };

    const filterClients = (filters: IProviderFilter): IProvidersGetParams['filters'] => {
        const result: IProvidersGetParams['filters'] = {}

        if (filters.fromDate) { result.initialDate = filters.fromDate.toString() }
        if (filters.toDate) { result.finalDate = filters.toDate.toString() }
        if (filters.provider) { result.provider = filters.provider }
        if (filters.nit) { result.NIT = filters.nit }

        return result
    };

    const NITS = useMemo(() => {
        const nits = providers.map(p => p.NIT)
        return nits.filter((item, index) => nits.indexOf(item) === index)
    }, [providers])

    const [providerSearch, setProviderSearch] = useState("");
    const [nitSearch, setNitSearch] = useState("");

    const filteredProviders = useMemo(() => {
        return providers.filter(provider =>
            (provider.fullName || "Sin nombre").toLowerCase().includes(providerSearch.toLowerCase())
        );
    }, [providers, providerSearch]);

    const filteredNITS = useMemo(() => {
        return NITS.filter(nit => nit.toLowerCase().includes(nitSearch.toLowerCase()));
    }, [NITS, nitSearch]);

    const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
    const [isNitDropdownOpen, setIsNitDropdownOpen] = useState(false);
    const providerDropdownRef = useRef<HTMLDivElement>(null);
    const nitDropdownRef = useRef<HTMLDivElement>(null);

    const [selectedProviderName, setSelectedProviderName] = useState<string>("Seleccione un proveedor");
    const [selectedNit, setSelectedNit] = useState<string>("Seleccione un NIT");

    const handleSelectProvider = (providerId: string, providerName: string) => {
        setValue("provider", providerId, { shouldValidate: true });
        setSelectedProviderName(providerName || "Sin nombre");
        setIsProviderDropdownOpen(false);
    };

    const handleSelectNit = (nit: string) => {
        setValue("nit", nit, { shouldValidate: true });
        setSelectedNit(nit || "Seleccione un NIT");
        setIsNitDropdownOpen(false);
    };

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row mb-4">
                    <div className="flex-1">
                        <div className="FiltroClientes-Fechastitulo mb-2">
                            <span className="text-blue_custom font-semibold">Fechas</span>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            <div className="shadow-xl rounded-3xl px-4 py-2 border-gray-100 border flex-1 relative">
                                <span className="text-left text-sm">De</span>
                                <img src="/desde.svg" alt="" className="w-[20px] h-[20px] absolute bottom-3 left-4 invert-0 dark:invert" />
                                <input
                                    max={watch('toDate')?.toString() || moment().format("YYYY-MM-DD")}
                                    type="date"
                                    {...register("fromDate")}
                                    className="border-0 rounded outline-none font-semibold w-full bg-transparent text-sm full-selector pl-10"
                                />
                            </div>
                            <div className="shadow-xl rounded-3xl px-4 py-2 border-gray-100 border flex-1 relative">
                                <span className="text-left text-sm">A</span>
                                <img src="/hasta.svg" alt="" className="w-[20px] h-[20px] absolute bottom-3 left-4 invert-0 dark:invert" />
                                <input
                                    min={watch('fromDate')?.toString()}
                                    max={moment().format("YYYY-MM-DD")}
                                    type="date"
                                    {...register("toDate")}
                                    className="border-0  rounded outline-none font-semibold w-full bg-transparent text-sm full-selector pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full sm:w-1/2 flex flex-col gap-2 relative"
                    ref={providerDropdownRef}
                >
                    <label>Proveedor o beneficiario</label>
                    <div
                        className={`p-2 py-2.5 rounded-md focus:outline-4 bg-main-background outline outline-2 outline-black cursor-pointer flex justify-between items-center`}
                        onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
                    >
                        <span className="truncate">{selectedProviderName}</span>
                        <i
                            className={`fa-solid fa-angle-down transition-transform ml-2 ${
                                isProviderDropdownOpen ? "rotate-180" : ""
                            }`}
                        ></i>
                    </div>
                    {isProviderDropdownOpen && (
                        <div
                            className="absolute z-[9999] mt-1 bg-main-background border border-black rounded-md shadow-lg max-h-60 overflow-y-auto"
                            style={{
                                position: "fixed",
                                top: providerDropdownRef.current?.getBoundingClientRect().bottom,
                                left: providerDropdownRef.current?.getBoundingClientRect().left,
                                width: providerDropdownRef.current?.offsetWidth,
                            }}
                        >
                            <div className="sticky top-0 bg-main-background p-2 border-b border-black">
                                <input
                                    type="text"
                                    placeholder="Buscar proveedor..."
                                    value={providerSearch}
                                    onChange={(e) => setProviderSearch(e.target.value)}
                                    className="p-2 w-full rounded bg-gray-100 text-black focus:outline-none"
                                    autoFocus
                                />
                            </div>
                            <div className="py-1">
                                {filteredProviders.length > 0 ? (
                                    filteredProviders.map((provider, index) => (
                                        <div
                                            key={index}
                                            className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                                            onClick={() => handleSelectProvider(provider._id, provider.fullName || "Sin nombre")}
                                        >
                                            {provider.fullName || "Sin nombre"}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-gray-500">
                                        No se encontraron resultados
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full sm:w-1/2 flex flex-col gap-2 relative"
                    ref={nitDropdownRef}
                >
                    <label>NIT</label>
                    <div
                        className={`p-2 py-2.5 rounded-md focus:outline-4 bg-main-background outline outline-2 outline-black cursor-pointer flex justify-between items-center`}
                        onClick={() => setIsNitDropdownOpen(!isNitDropdownOpen)}
                    >
                        <span className="truncate">{selectedNit}</span>
                        <i
                            className={`fa-solid fa-angle-down transition-transform ml-2 ${
                                isNitDropdownOpen ? "rotate-180" : ""
                            }`}
                        ></i>
                    </div>
                    {isNitDropdownOpen && (
                        <div
                            className="absolute z-[9999] mt-1 bg-main-background border border-black rounded-md shadow-lg max-h-60 overflow-y-auto"
                            style={{
                                position: "fixed",
                                top: nitDropdownRef.current?.getBoundingClientRect().bottom,
                                left: nitDropdownRef.current?.getBoundingClientRect().left,
                                width: nitDropdownRef.current?.offsetWidth,
                            }}
                        >
                            <div className="sticky top-0 bg-main-background p-2 border-b border-black">
                                <input
                                    type="text"
                                    placeholder="Buscar NIT..."
                                    value={nitSearch}
                                    onChange={(e) => setNitSearch(e.target.value)}
                                    className="p-2 w-full rounded bg-gray-100 text-black focus:outline-none"
                                    autoFocus
                                />
                            </div>
                            <div className="py-1">
                                {filteredNITS.length > 0 ? (
                                    filteredNITS.map((nit, index) => (
                                        <div
                                            key={index}
                                            className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                                            onClick={() => handleSelectNit(nit)}
                                        >
                                            {nit}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-gray-500">
                                        No se encontraron resultados
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>

                <div className="flex justify-between w-full items-center gap-3 px-4">
                    <button
                        type="button"
                        onClick={() => {
                            setShowFiltro(false);
                            onChange({});
                        }}
                        className="mt-4 border-blue-500 border-2 rounded-full px-4 py-2.5 shadow-xl text-blue-500 font-bold w-full"
                    >
                        Quitar Filtros
                    </button>
                    <button
                        type="submit"
                        className="mt-4 bg-blue-500 border-2 border-blue-500 shadow-xl text-white rounded-full px-4 py-2.5 w-full font-bold"
                    >
                        Aplicar Filtros
                    </button>
                </div>
            </form>
        </>
    );
}

export { FiltroProveedores }