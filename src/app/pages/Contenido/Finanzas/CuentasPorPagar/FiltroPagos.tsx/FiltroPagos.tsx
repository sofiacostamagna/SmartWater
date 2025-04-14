import { useContext, useEffect, useState, useRef } from "react";
import "./FiltroCuentasPorPagar.css";
import { CuentasPorPagarContext } from "../CuentasPorPagarContext";
import { Zone } from "../../../../../../type/City";
import { User } from "../../../../../../type/User";
import { useForm } from "react-hook-form";
import moment from "moment";
import { Providers } from "../../../../../../type/providers";
import { IInvExpensesGetParams } from "../../../../../../api/types/invoice-expenses";
import { motion } from 'framer-motion'

interface IExpenseFilters {
    fromDate: string | null;
    toDate: string | null;
    provider: string | null;
    distributor: Record<string, string>;

    cash: boolean;
    contado: boolean;
    currentAccount: boolean;
    withBalance: boolean;
    withoutBalance: boolean;
}

const initialState: IExpenseFilters = {
    cash: false,
    contado: false,
    currentAccount: false,
    withBalance: false,
    withoutBalance: false,

    fromDate: null,
    toDate: null,
    distributor: {},
    provider: null
}
const FiltroPagos = ({
    onChange,
    initialFilters,
    zones,
    providers,
    distribuidores,
    isHistory
}: {
    zones: Zone[];
    distribuidores: User[];
    providers: Providers[];
    onChange: (filters: IInvExpensesGetParams['filters']) => void;
    initialFilters: IInvExpensesGetParams['filters'];
    isHistory?: boolean;
}) => {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<IExpenseFilters>({
        defaultValues: initialState || {},
    });

    const [selectedDists, setSelectedDists] = useState<User[]>([])
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [providerTouched, setProviderTouched] = useState<boolean>(false);

    const filteredProviders = searchTerm.trim() === ""
        ? providers
        : providers.filter((provider) =>
            (provider.fullName || "Sin nombre").toLowerCase().includes(searchTerm.toLowerCase())
        );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
               
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleSelectProvider = (id: string) => {
        setSelectedProvider(id);
        setValue("provider", id, { shouldValidate: true }); // Sync state with form value
        setShowDropdown(false);
    };

    const handleProviderBlur = () => {
        setProviderTouched(true);
    };

    useEffect(() => {
        if (initialFilters) {
            if (initialFilters.initialDate) {
                setValue('fromDate', initialFilters.initialDate, { shouldValidate: true })
            }

            if (initialFilters.finalDate) {
                setValue('toDate', initialFilters.finalDate, { shouldValidate: true })
            }

            if (initialFilters.hasOwnProperty('hasBalance')) {
                setValue('withBalance', !!initialFilters.hasBalance, { shouldValidate: true })
                setValue('withoutBalance', !initialFilters.hasBalance, { shouldValidate: true })
            }

            if (initialFilters.hasOwnProperty('paymentMethodCurrentAccount') && initialFilters.hasOwnProperty('cashPayment')) {
                const cash = initialFilters.cashPayment
                const cta = initialFilters.paymentMethodCurrentAccount

                let is: "contado" | 'cta' | 'cash' | 'none' = 'none'

                if (!cash && !cta) { is = 'contado' }
                else if (!!cash && !cta) { is = 'cash' }
                else if (!cash && !!cta) { is = 'cta' }
                else { is = 'none' }

                setValue('contado', is === 'contado', { shouldValidate: true })
                setValue('currentAccount', is === 'cta', { shouldValidate: true })
                setValue('cash', is === 'cash', { shouldValidate: true })
            }

            if (initialFilters.user) {
                setSelectedDists(distribuidores.filter(d => initialFilters.user!.includes(d._id)))
            }
            if (initialFilters.provider) {
                setValue('provider', initialFilters.provider, { shouldValidate: true });
                setSelectedProvider(initialFilters.provider); // Sync state with form value
            } else {
                setValue('provider', "", { shouldValidate: true });
                setSelectedProvider(null); // Reset state
            }
        }
    }, [initialFilters, setValue, distribuidores])

    const { setShowFiltro } = useContext(CuentasPorPagarContext);

    const onSubmit = (data: IExpenseFilters) => {
        const filters = filterClients(data);
        onChange(filters);
        setShowFiltro(false);
    };

    const filterClients = (filters: IExpenseFilters): IInvExpensesGetParams['filters'] => {
        const result: IInvExpensesGetParams['filters'] = {}

        if (filters.fromDate) { result.initialDate = filters.fromDate.toString() }
        if (filters.toDate) { result.finalDate = filters.toDate.toString() }
        if (filters.provider) { result.provider = filters.provider }

        if (!((!!filters.withBalance && !!filters.withoutBalance) || (!filters.withBalance && !filters.withoutBalance))) {
            result.hasBalance = filters.withBalance
        }

        if (filters.cash) { result.paymentMethodCurrentAccount = false; result.cashPayment = true }
        if (filters.currentAccount) { result.paymentMethodCurrentAccount = true; result.cashPayment = false }
        if (filters.contado) { result.paymentMethodCurrentAccount = false; result.cashPayment = false }

        if (selectedDists.length > 0) {
            const dists = selectedDists.map(z => z._id).join(',')
            if (dists !== "") { result.user = dists }
        }

        return result
    };

    return (
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

            {
                !isHistory &&
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-full sm:w-1/2 flex flex-col gap-2"
                    >
                        <label>Proveedor o beneficiario</label>
                        <div className="relative" ref={dropdownRef}>
                            <div
                                className={`relative cursor-pointer p-2 py-2.5 rounded-md font-pricedown focus:outline-4 bg-main-background outline ${
                                    errors.provider && providerTouched
                                        ? showDropdown
                                            ? "outline-4 outline-red-500"
                                            : "outline-2 outline-red-500"
                                        : showDropdown
                                            ? "outline-4 outline-black"
                                            : "outline-2 outline-black"
                                } flex justify-between items-center`}
                                onClick={() => setShowDropdown(!showDropdown)}
                                onBlur={handleProviderBlur}
                            >
                                <span>
                                    {selectedProvider
                                        ? providers.find((p) => p._id === selectedProvider)?.fullName || "Sin nombre"
                                        : "Seleccione un proveedor"}
                                </span>
                                <i className={`fa-solid fa-angle-down transition-transform ${showDropdown ? "rotate-180" : ""}`}></i>
                            </div>
                            {showDropdown && (
                                <div
                                    className="absolute top-full translate-y-3 left-0 w-full border rounded-md shadow-md z-[9999] max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-200 bg-main-background dark:border-gray-600 text-base flex flex-col text-start mt-2"
                                >
                                    <div className="py-3 px-4 sticky top-0 w-full bg-main-background">
                                        <input
                                            type="text"
                                            className="w-full rounded-md bg-transparent outline-none border-2 border-black text-font-color px-2 py-1 dark:border-gray-600 dark:text-white"
                                            placeholder="Buscar..."
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    {filteredProviders.length > 0 ? (
                                        filteredProviders.map((provider) => (
                                            <div
                                                key={provider._id}
                                                className="px-4 py-3 whitespace-nowrap hover:bg-blue-500 hover:text-white rounded-md cursor-pointer text-font-color dark:text-white"
                                                onClick={() => handleSelectProvider(provider._id)} // Moved onClick here
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
                        {errors.provider && providerTouched && (
                            <span className="text-red-500 font-normal text-sm font-pricedown">
                                <i className="fa-solid fa-triangle-exclamation"></i>{" "}
                                {errors.provider.message}
                            </span>
                        )}
                    </motion.div>


                    <div className="flex flex-col mb-4">
                        <div className="FiltroClientes-RenovaciónTitulo mb-2">
                            <span className="text-blue_custom font-semibold">Pagos</span>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex gap-3 items-center">
                                <input
                                    className="input-check accent-blue_custom"
                                    type="checkbox"
                                    id="check20"
                                    checked={watch('cash')}
                                    onChange={() => {
                                        const credit = watch("cash")
                                        setValue("cash", !credit);
                                        setValue("currentAccount", false);
                                        setValue("contado", false);
                                    }}
                                />
                                <label htmlFor="check20" className="text-sm" >
                                    Efectivo
                                </label>
                            </div>
                            <div className="flex gap-3 items-center">
                                <input
                                    className="input-check accent-blue_custom"
                                    type="checkbox"
                                    id="check19"
                                    checked={watch('currentAccount')}
                                    onChange={() => {
                                        const credit = watch("currentAccount")
                                        setValue("currentAccount", !credit);
                                        setValue("contado", false);
                                        setValue("cash", false);
                                    }}
                                />
                                <label htmlFor="check19" className="text-sm" >
                                    Cta. Cte.
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col mb-4">
                        <div className="FiltroClientes-RenovaciónTitulo mb-2">
                            <span className="text-blue_custom font-semibold">Cuentas por pagar</span>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex gap-3 items-center">
                                <input
                                    className="input-check accent-blue_custom"
                                    type="checkbox"
                                    id="check5"
                                    checked={watch('withBalance')}
                                    onChange={() => {
                                        const credit = watch("withBalance");
                                        setValue("withBalance", !credit);
                                        setValue("withoutBalance", false); // Ensure mutual exclusivity
                                    }}
                                />
                                <img src="/Moneda-icon-blue.svg" alt="" />
                                <label htmlFor="check5" className="text-sm" >
                                    Con saldos
                                </label>
                            </div>
                            <div className="flex gap-3 items-center">
                                <input
                                    className="input-check accent-blue_custom"
                                    type="checkbox"
                                    id="check6"
                                    checked={watch('withoutBalance')}
                                    onChange={() => {
                                        const credit = watch("withoutBalance");
                                        setValue("withoutBalance", !credit);
                                        setValue("withBalance", false); // Ensure mutual exclusivity
                                    }}
                                />
                                <img src="/nosaldo.svg" alt="" />
                                <label htmlFor="check6" className="text-sm" >
                                    Sin saldos
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="w-full flex flex-col gap-2 my-6">
                        <label className="font-semibold text-blue_custom">Distribuidores</label>
                        <div className="flex flex-wrap gap-x-6 gap-y-4">
                            {distribuidores.filter(d => d.role === 'user').map((dists, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3"
                                >
                                    <input
                                        className="input-check accent-blue_custom"
                                        type="checkbox"
                                        onChange={() => {
                                            if (selectedDists.some(s => s._id === dists._id)) {
                                                setSelectedDists(prev => prev.filter(s => s._id !== dists._id))
                                            } else {
                                                setSelectedDists(prev => [...prev, dists])
                                            }
                                        }}
                                        checked={selectedDists.some(sd => sd._id === dists._id)}
                                        id={`distrib-${dists._id}`}
                                    />
                                    <label
                                        htmlFor={`distrib-${dists._id}`}
                                        className="text-sm"
                                    >
                                        {dists.fullName || "Sin nombre"}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <label className="text-blue_custom mt-2">Administradores</label>
                        <div className="flex flex-wrap gap-x-6 gap-y-4">
                            {distribuidores.filter(d => d.role === 'admin').map((dists, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3"
                                >
                                    <input
                                        className="input-check accent-blue_custom"
                                        type="checkbox"
                                        onChange={() => {
                                            if (selectedDists.some(s => s._id === dists._id)) {
                                                setSelectedDists(prev => prev.filter(s => s._id !== dists._id))
                                            } else {
                                                setSelectedDists(prev => [...prev, dists])
                                            }
                                        }}
                                        checked={selectedDists.some(sd => sd._id === dists._id)}
                                        id={`distrib-${dists._id}`}
                                    />
                                    <label
                                        htmlFor={`distrib-${dists._id}`}
                                        className="text-sm"
                                    >
                                        {dists.fullName || "Sin nombre"}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                </>
            }

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
        </form >
    );
}

export { FiltroPagos }