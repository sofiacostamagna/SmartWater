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

    const [providerSearchTerm, setProviderSearchTerm] = useState<string>("");
    const [nitSearchTerm, setNitSearchTerm] = useState<string>("");
    const [showProviderDropdown, setShowProviderDropdown] = useState<boolean>(false);
    const [showNitDropdown, setShowNitDropdown] = useState<boolean>(false);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [selectedNit, setSelectedNit] = useState<string | null>(null);
    const providerDropdownRef = useRef<HTMLDivElement>(null);
    const nitDropdownRef = useRef<HTMLDivElement>(null);

    const NITS = useMemo(() => {
        const nits = providers.map(p => p.NIT);
        return nits.filter((item, index) => nits.indexOf(item) === index);
    }, [providers]);

    const filteredProviders = providerSearchTerm.trim() === ""
        ? providers
        : providers.filter((provider) =>
            (provider.fullName || "Sin nombre").toLowerCase().includes(providerSearchTerm.toLowerCase())
        );

    const filteredNits = nitSearchTerm.trim() === ""
        ? NITS
        : NITS.filter((nit) =>
            nit.toLowerCase().includes(nitSearchTerm.toLowerCase())
        );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
                setShowProviderDropdown(false);
            }
            if (nitDropdownRef.current && !nitDropdownRef.current.contains(event.target as Node)) {
                setShowNitDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [providerDropdownRef, nitDropdownRef]);

    const handleSelectProvider = (id: string) => {
        setSelectedProvider(id);
        setValue("provider", id, { shouldValidate: true });
        setShowProviderDropdown(false);
    };

    const handleSelectNit = (nit: string) => {
        setSelectedNit(nit);
        setValue("nit", nit, { shouldValidate: true });
        setShowNitDropdown(false);
    };

    const handleDropdownPosition = (ref: React.RefObject<HTMLDivElement>, setDropdownStyle: React.Dispatch<React.SetStateAction<React.CSSProperties>>) => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setDropdownStyle({
                position: "fixed",
                top: rect.bottom, 
                left: rect.left,
                width: `${rect.width}px`,
                zIndex: 9999,
            });
        }
    };

    const [providerDropdownStyle, setProviderDropdownStyle] = useState<React.CSSProperties>({});
    const [nitDropdownStyle, setNitDropdownStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (showProviderDropdown) {
            handleDropdownPosition(providerDropdownRef, setProviderDropdownStyle);
        }
        if (showNitDropdown) {
            handleDropdownPosition(nitDropdownRef, setNitDropdownStyle);
        }
    }, [showProviderDropdown, showNitDropdown]);

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
                    className="w-full sm:w-1/2 flex flex-col gap-2"
                >
                    <label>Proveedor o beneficiario</label>
                    <div className="relative" ref={providerDropdownRef}>
                        <div
                            className={`relative cursor-pointer p-2 py-2.5 rounded-md font-pricedown focus:outline-4 bg-main-background outline outline-2 outline-black flex justify-between items-center`}
                            onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                        >
                            <span>
                                {selectedProvider
                                    ? providers.find((p) => p._id === selectedProvider)?.fullName || "Sin selección"
                                    : "Seleccione un proveedor"}
                            </span>
                            <i className={`fa-solid fa-angle-down transition-transform ${showProviderDropdown ? "rotate-180" : ""}`}></i>
                        </div>
                        {showProviderDropdown && (
                            <div
                                style={providerDropdownStyle}
                                className="border rounded-md shadow-md max-h-60  overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-200 bg-main-background dark:border-gray-600 text-base flex flex-col text-start"
                            >
                                <div className="py-3 px-4 sticky top-0 w-full bg-main-background">
                                    <input
                                        type="text"
                                        className="w-full rounded-md bg-transparent outline-none border-2 border-black text-font-color px-2 py-1 dark:border-gray-600 dark:text-white"
                                        placeholder="Buscar..."
                                        onChange={(e) => setProviderSearchTerm(e.target.value)}
                                    />
                                </div>
                                {filteredProviders.length > 0 ? (
                                    filteredProviders.map((provider) => (
                                        <div
                                            key={provider._id}
                                            className="px-4 py-3 whitespace-nowrap hover:bg-blue-500 hover:text-white rounded-md cursor-pointer text-font-color dark:text-white"
                                            onClick={() => handleSelectProvider(provider._id)}
                                        >
                                            {provider.fullName || "Sin nombre"}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                        Sin opciones
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <input
                        type="hidden"
                        {...register("provider")}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full sm:w-1/2 flex flex-col gap-2"
                >
                    <label>NIT</label>
                    <div className="relative" ref={nitDropdownRef}>
                        <div
                            className={`relative cursor-pointer p-2 py-2.5 rounded-md font-pricedown focus:outline-4 bg-main-background outline outline-2 outline-black flex justify-between items-center`}
                            onClick={() => setShowNitDropdown(!showNitDropdown)}
                        >
                            <span>
                                {selectedNit || "Seleccione un NIT"}
                            </span>
                            <i className={`fa-solid fa-angle-down transition-transform ${showNitDropdown ? "rotate-180" : ""}`}></i>
                        </div>
                        {showNitDropdown && (
                            <div
                                style={nitDropdownStyle}
                                className="border rounded-md shadow-md max-h-60 overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-200 bg-main-background dark:border-gray-600 text-base flex flex-col text-start"
                            >
                                <div className="py-3 px-4 sticky top-0 w-full bg-main-background">
                                    <input
                                        type="text"
                                        className="w-full rounded-md bg-transparent outline-none border-2 border-black text-font-color px-2 py-1 dark:border-gray-600 dark:text-white"
                                        placeholder="Buscar..."
                                        onChange={(e) => setNitSearchTerm(e.target.value)}
                                    />
                                </div>
                                {filteredNits.length > 0 ? (
                                    filteredNits.map((nit, index) => (
                                        <div
                                            key={index}
                                            className="px-4 py-3 whitespace-nowrap hover:bg-blue-500 hover:text-white rounded-md cursor-pointer text-font-color dark:text-white"
                                            onClick={() => handleSelectNit(nit)}
                                        >
                                            {nit}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                        Sin opciones
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <input
                        type="hidden"
                        {...register("nit")}
                    />
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