import { useContext, useEffect, useState, useRef } from "react";
import "./FiltroEgresosGastos.css";
import { EgresosGastosContext } from "../EgresosGastosContext";
import { Providers } from "../../../../../../type/providers";
import { Account } from "../../../../../../type/AccountEntry";
import { IExpensesGetParams } from "../../../../../../api/types/expenses";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import moment from "moment";
import { User } from "../../../../../../type/User";
import { Zone } from "../../../../../../type/City";

interface IExpenseFilter {
    cash: boolean;
    credit: boolean;
    currentAccount: boolean;

    withInvoice: boolean;
    withoutInvoice: boolean;

    provider: string | null;
    accountEntry: string | null;

    fromDate: string | null;
    toDate: string | null;

    zones: Record<string, string>;
    distributor: Record<string, string>;
}

const initialState: IExpenseFilter = {
    cash: false,
    credit: false,
    currentAccount: false,
    withInvoice: false,
    withoutInvoice: false,
    accountEntry: null,
    provider: null,
    fromDate: null,
    toDate: null,
    zones: {},
    distributor: {}
}

const FiltroEgresosGastos = ({
    onChange,
    initialFilters,
    accounts, providers,
    distribuidores,
    zones
}: {
    providers: Providers[];
    accounts: Account[];
    distribuidores: User[];
    zones: Zone[];
    onChange: (filters: IExpensesGetParams['filters']) => void;
    initialFilters: IExpensesGetParams['filters'];
}) => {
    const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm<IExpenseFilter>({
        defaultValues: initialState || {},
    });
    const [selectedDists, setSelectedDists] = useState<User[]>([])
    const [providerSearchTerm, setProviderSearchTerm] = useState<string>("");
    const [accountSearchTerm, setAccountSearchTerm] = useState<string>("");
    const [showProviderDropdown, setShowProviderDropdown] = useState<boolean>(false);
    const [showAccountDropdown, setShowAccountDropdown] = useState<boolean>(false);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const providerDropdownRef = useRef<HTMLDivElement>(null);
    const accountDropdownRef = useRef<HTMLDivElement>(null);
    const [providerTouched, setProviderTouched] = useState<boolean>(false);
    const [accountTouched, setAccountTouched] = useState<boolean>(false);

    const handleProviderBlur = () => {
        setProviderTouched(true);
        trigger("provider"); // Trigger validation only after interaction
    };

    const handleAccountBlur = () => {
        setAccountTouched(true);
        trigger("accountEntry"); // Trigger validation only after interaction
    };

    const filteredProviders = providerSearchTerm.trim() === ""
        ? providers
        : providers.filter((provider) =>
            (provider.fullName || "Sin nombre").toLowerCase().includes(providerSearchTerm.toLowerCase())
        );

    const filteredAccounts = accountSearchTerm.trim() === ""
        ? accounts
        : accounts.filter((account) =>
            account.name.toLowerCase().includes(accountSearchTerm.toLowerCase())
        );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (providerDropdownRef.current && !providerDropdownRef.current.contains(event.target as Node)) {
                setShowProviderDropdown(false);
                trigger("provider");
            }
            if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
                setShowAccountDropdown(false);
                trigger("accountEntry");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [providerDropdownRef, accountDropdownRef, trigger]);

    const handleSelectProvider = (id: string) => {
        setSelectedProvider(id);
        setValue("provider", id, { shouldValidate: true });
        setShowProviderDropdown(false);
    };

    const handleSelectAccount = (id: string) => {
        setSelectedAccount(id);
        setValue("accountEntry", id, { shouldValidate: true });
        setShowAccountDropdown(false);
    };

    useEffect(() => {
        if (initialFilters) {
            if (initialFilters.hasOwnProperty('paymentMethodCurrentAccount') && initialFilters.hasOwnProperty('creditBuy')) {
                const credit = initialFilters.creditBuy
                const cta = initialFilters.paymentMethodCurrentAccount

                let is: "credit" | 'cta' | 'cash' | 'none' = 'none'

                if (!credit && !cta) { is = 'cash' }
                else if (!!credit && !cta) { is = 'credit' }
                else if (!credit && !!cta) { is = 'cta' }
                else { is = 'none' }

                setValue('credit', is === 'credit', { shouldValidate: true })
                setValue('currentAccount', is === 'cta', { shouldValidate: true })
                setValue('cash', is === 'cash', { shouldValidate: true })
            }
            if (initialFilters.hasOwnProperty('paymentMethodCurrentAccount')) {
                setValue('currentAccount', !!initialFilters.paymentMethodCurrentAccount, { shouldValidate: true })
            }

            if (initialFilters.hasOwnProperty('hasInVoice')) {
                setValue('withInvoice', !!initialFilters.hasInVoice, { shouldValidate: true })
                setValue('withoutInvoice', !initialFilters.hasInVoice, { shouldValidate: true })
            }

            if (initialFilters.provider) {
                setValue('provider', initialFilters.provider, { shouldValidate: true })
            } else {
                setValue('provider', "", { shouldValidate: true })
            }

            if (initialFilters.accountEntry) {
                setValue('accountEntry', initialFilters.accountEntry, { shouldValidate: true })
            } else {
                setValue('accountEntry', "", { shouldValidate: true })
            }

            if (initialFilters.initialDate) {
                setValue('fromDate', initialFilters.initialDate, { shouldValidate: true })
            }
            if (initialFilters.finalDate) {
                setValue('toDate', initialFilters.finalDate, { shouldValidate: true })
            }
            if (initialFilters.zone) {
                initialFilters.zone.split(",").forEach((z) => {
                    setValue(`zones.${z}`, z, { shouldValidate: true })
                })
            }
            if (initialFilters.user) {
                setSelectedDists(distribuidores.filter(d => initialFilters.user!.includes(d._id)))
            }
        }
    }, [initialFilters, setValue, distribuidores])

    const { setShowFiltro } = useContext(EgresosGastosContext);

    const onSubmit = (data: IExpenseFilter) => {
        const filters = filterClients(data);
        onChange(filters);
        setShowFiltro(false);
    };

    const filterClients = (filters: IExpenseFilter): IExpensesGetParams['filters'] => {
        const result: IExpensesGetParams['filters'] = {}

        if (filters.provider && filters.provider !== "") { result.provider = filters.provider }
        if (filters.accountEntry && filters.accountEntry !== "") { result.accountEntry = filters.accountEntry }

        if (filters.credit) { result.paymentMethodCurrentAccount = false; result.creditBuy = true }
        if (filters.currentAccount) { result.paymentMethodCurrentAccount = true; result.creditBuy = false }
        if (filters.cash) { result.paymentMethodCurrentAccount = false; result.creditBuy = false }

        if (!((!!filters.withInvoice && !!filters.withoutInvoice) || (!filters.withInvoice && !filters.withoutInvoice))) {
            result.hasInVoice = filters.withInvoice
        }

        if (filters.fromDate) { result.initialDate = filters.fromDate.toString() }
        if (filters.toDate) { result.finalDate = filters.toDate.toString() }

        if (filters.zones) {
            const zones = Object.values(filters.zones).filter(z => !!z).join(',')
            if (zones !== "") { result.zone = zones }
        }

        if (selectedDists.length > 0) {
            const dists = selectedDists.map(z => z._id).join(',')
            if (dists !== "") { result.user = dists }
        }

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

                <div className="flex flex-col sm:flex-row mb-4 gap-3">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-full sm:w-1/2 flex flex-col gap-2"
                    >
                        <label>Proveedor</label>
                        <div className="relative" ref={providerDropdownRef}>
                            <div
                                className={`relative cursor-pointer p-2 py-2.5 rounded-md font-pricedown focus:outline-4 bg-main-background outline ${
                                    errors.provider && providerTouched
                                        ? showProviderDropdown
                                            ? "outline-4 outline-red-500"
                                            : "outline-2 outline-red-500"
                                        : showProviderDropdown
                                            ? "outline-4 outline-black"
                                            : "outline-2 outline-black"
                                } flex justify-between items-center`}
                                onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                                onBlur={handleProviderBlur}
                            >
                                <span>
                                    {selectedProvider
                                        ? providers.find((p) => p._id === selectedProvider)?.fullName || "Sin selección"
                                        : "Sin selección"}
                                </span>
                                <i className={`fa-solid fa-angle-down transition-transform ${showProviderDropdown ? "rotate-180" : ""}`}></i>
                            </div>
                            {showProviderDropdown && (
                                <div
                                    className="absolute top-full translate-y-3 left-0 w-full border rounded-md shadow-md z-[9999] max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-200 bg-main-background dark:border-gray-600 text-base flex flex-col text-start mt-2"
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
                            {...register("provider", {
                                required: "Debes seleccionar un proveedor",
                                validate: (value) => {
                                    return value && value.trim() !== ""
                                        ? true
                                        : "Debes seleccionar un proveedor válido";
                                },
                            })}
                        />
                        {errors.provider && providerTouched && (
                            <span className="text-red-500 font-normal text-sm font-pricedown">
                                <i className="fa-solid fa-triangle-exclamation"></i>{" "}
                                {errors.provider.message}
                            </span>
                        )}
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-full sm:w-1/2 flex flex-col gap-2"
                    >
                        <label>Cuenta contable</label>
                        <div className="relative" ref={accountDropdownRef}>
                            <div
                                className={`relative cursor-pointer p-2 py-2.5 rounded-md font-pricedown focus:outline-4 bg-main-background outline ${
                                    errors.accountEntry && accountTouched
                                        ? showAccountDropdown
                                            ? "outline-4 outline-red-500"
                                            : "outline-2 outline-red-500"
                                        : showAccountDropdown
                                            ? "outline-4 outline-black"
                                            : "outline-2 outline-black"
                                } flex justify-between items-center`}
                                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                                onBlur={handleAccountBlur}
                            >
                                <span>
                                    {selectedAccount
                                        ? accounts.find((a) => a._id === selectedAccount)?.name || "Sin selección"
                                        : "Sin selección"}
                                </span>
                                <i className={`fa-solid fa-angle-down transition-transform ${showAccountDropdown ? "rotate-180" : ""}`}></i>
                            </div>
                            {showAccountDropdown && (
                                <div
                                    className="absolute top-full translate-y-3 left-0 w-full border rounded-md shadow-md z-[9999] max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-200 bg-main-background dark:border-gray-600 text-base flex flex-col text-start mt-2"
                                >
                                    <div className="py-3 px-4 sticky top-0 w-full bg-main-background">
                                        <input
                                            type="text"
                                            className="w-full rounded-md bg-transparent outline-none border-2 border-black text-font-color px-2 py-1 dark:border-gray-600 dark:text-white"
                                            placeholder="Buscar..."
                                            onChange={(e) => setAccountSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    {filteredAccounts.length > 0 ? (
                                        filteredAccounts.map((account) => (
                                            <div
                                                key={account._id}
                                                className="px-4 py-3 whitespace-nowrap hover:bg-blue-500 hover:text-white rounded-md cursor-pointer text-font-color dark:text-white"
                                                onClick={() => handleSelectAccount(account._id)}
                                            >
                                                {account.name}
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
                            {...register("accountEntry", {
                                required: "Debes seleccionar una cuenta contable",
                                validate: (value) => {
                                    return value && value.trim() !== ""
                                        ? true
                                        : "Debes seleccionar una cuenta contable válida";
                                },
                            })}
                        />
                        {errors.accountEntry && accountTouched && (
                            <span className="text-red-500 font-normal text-sm font-pricedown">
                                <i className="fa-solid fa-triangle-exclamation"></i>{" "}
                                {errors.accountEntry.message}
                            </span>
                        )}
                    </motion.div>
                </div>

                <div className="flex flex-col mb-4">
                    <div className="FiltroClientes-RenovaciónTitulo mb-2">
                        <span className="text-blue_custom font-semibold">Medio de pago</span>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="flex gap-3 items-center">
                            <input
                                className="input-check accent-blue_custom"
                                type="checkbox"
                                id="check4"
                                checked={watch('credit')}
                                onChange={() => {
                                    const credit = watch("credit")
                                    setValue("credit", !credit);
                                    setValue("currentAccount", false);
                                    setValue("cash", false);
                                }}
                            />
                            <label htmlFor="check4" className="text-sm" >
                                A crédito
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
                                    setValue("credit", false);
                                    setValue("cash", false);
                                }}
                            />
                            <label htmlFor="check19" className="text-sm" >
                                Cta. Cte.
                            </label>
                        </div>
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
                                    setValue("credit", false);
                                }}
                            />
                            <label htmlFor="check20" className="text-sm" >
                                Efectivo
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col mb-4">
                    <div className="FiltroClientes-RenovaciónTitulo mb-2">
                        <span className="text-blue_custom font-semibold">Factura</span>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="flex gap-3 items-center">
                            <input
                                className="input-check accent-blue_custom"
                                type="checkbox"
                                id="check5"
                                checked={watch('withInvoice')}
                                onChange={() => {
                                    const credit = watch("withInvoice")
                                    setValue("withInvoice", !credit);
                                    setValue("withoutInvoice", false);
                                }}
                            />
                            <img src="/ConFactura.svg" alt="" />
                            <label htmlFor="check5" className="text-sm" >
                                Con factura
                            </label>
                        </div>
                        <div className="flex gap-3 items-center">
                            <input
                                className="input-check accent-blue_custom"
                                type="checkbox"
                                id="check6"
                                checked={watch('withoutInvoice')}
                                onChange={() => {
                                    const credit = watch("withoutInvoice")
                                    setValue("withoutInvoice", !credit);
                                    setValue("withInvoice", false);
                                }}
                            />
                            <img src="/nofactura.svg" alt="" />
                            <label htmlFor="check6" className="text-sm" >
                                Sin factura
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

                                        zones.forEach(z => setValue(`zones.${z._id}`, "", { shouldValidate: true }))
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

                                        zones.forEach(z => setValue(`zones.${z._id}`, "", { shouldValidate: true }))
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
        </>
    );
}

export { FiltroEgresosGastos }