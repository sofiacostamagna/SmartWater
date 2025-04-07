import React, { useContext, useEffect, useState } from 'react'
import { User } from '../../../../../../type/User';
import { MatchedElementRoot } from '../../../../../../type/Kardex';
import { InventariosFisicosContext } from '../InventariosFisicosProvider';
import { useFieldArray, useForm } from 'react-hook-form';
import moment from 'moment';
import { motion } from 'framer-motion';
import Input from '../../../../EntryComponents/Inputs';
import { IInitialBalanceBody, IInitialBalanceUpdateBody } from '../../../../../../api/types/physical-inventory';
import toast from 'react-hot-toast';
import { PhysicalInventoryApiConector } from '../../../../../../api/classes/physical-inventory';
import DataTable, { TableColumn } from 'react-data-table-component';

interface Props {
    onCancel?: () => void;
    distribuidores: User[];
    elements: MatchedElementRoot[];
}

type FormType = {
    registerDate: string;
    user: string;
    role: 'admin' | 'user';
    code?: string;  // For edit
    forceCreation?: boolean; // For create
    elements: {
        product?: string;
        item?: string;
        initialBalance: number;
    }[]
}

const SaldosInicialesForm = ({ distribuidores, elements, onCancel }: Props) => {
    const [active, setActive] = useState(false);
    const { selectedBalance } = useContext(InventariosFisicosContext);

    const { control, register, formState: { errors, isValid }, handleSubmit, watch, setValue } = useForm<FormType>({
        defaultValues: selectedBalance.code !== "" ? {
            registerDate: selectedBalance.showDate.format("YYYY-MM-DDTHH:mm"),
            code: selectedBalance.code,
            forceCreation: true,
            role: selectedBalance.user.isAdmin ? 'admin' : "user",
            user: selectedBalance.user._id,
            elements: selectedBalance.saldo.map(s => ({
                product: s.product?._id,
                item: s.item?._id,
                initialBalance: s.initialBalance || 0 // Inicializamos con 0
            }))
        } : {
            elements: elements.map(e => ({
                product: e.isProduct ? e._id : undefined,
                item: e.isItem ? e._id : undefined,
                initialBalance: 0 // Inicializamos con 0
            }))
        },
        mode: 'all'
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'elements',
        rules: { required: "Debes agregar al menos un producto" }
    });

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (e.target.value === "0") {
            e.target.value = "";
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (e.target.value === "") {
            e.target.value = "0";
        }
    };

    const columns: TableColumn<MatchedElementRoot>[] = [
        {
            name: "Producto",
            selector: row => row.name || "Producto desconocido",
        },
        {
            name: "Unidad",
            selector: row => row.unitMeasure?.name || "Unidad desconocida",
        },
        {
            name: "Cantidad",
            cell: (row, index) => (
                <Input
                    type="number"
                    className="no-spinner outline-dashed my-4 text-right"
                    min={0}
                    label="Cantidad"
                    isVisibleLable
                    name={`elements.${index}.initialBalance`}
                    register={register}
                    errors={errors.elements?.[index]?.initialBalance}
                    validateAmount={(val: number) => val < 0 ? "Indica un valor" : true}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
            )
        },
    ];

    const onSubmit = async (data: FormType) => {
        let res = null
        setActive(true)

        if (selectedBalance.code !== "") {
            const formData: IInitialBalanceUpdateBody['data'] = {
                users: [{
                    role: data.role,
                    user: data.user,
                    code: selectedBalance.code,
                    lastRegisterDate: selectedBalance.showDate.format("YYYY-MM-DDTHH:mm"),
                    elements: data.elements.map(d => {
                        const res: IInitialBalanceBody['data']['users'][0]['elements'][0] = { initialBalance: Number(String(d.initialBalance)), }
                        if (d.item) { res.item = d.item }
                        if (d.product) { res.product = d.product }
                        return res
                    })
                }]
            }

            res = await PhysicalInventoryApiConector.update({ data: formData })
        } else {
            const formData: IInitialBalanceBody['data'] = {
                registerDate: data.registerDate,
                users: [{
                    role: data.role,
                    user: data.user,
                    forceCreation: true,
                    elements: data.elements.map(d => {
                        const res: IInitialBalanceBody['data']['users'][0]['elements'][0] = { initialBalance: Number(String(d.initialBalance)), }
                        if (d.item) { res.item = d.item }
                        if (d.product) { res.product = d.product }
                        return res
                    })
                }]
            }

            res = await PhysicalInventoryApiConector.createBalance({ data: formData });
        }

        if (res) {
            if ('message' in res) {
                if ('results' in res) {
                    toast.success(`Ingreso registrado correctamente`, { position: "bottom-center" });
                    window.location.reload();
                } else {
                    let messageResult = res.message
                    console.log(messageResult)
                    if (res.message.includes("no tiene stock")) {
                        const itemId = res.message.split(" ")[2]
                        const productName = elements.find(e => e._id === itemId)?.name || itemId
                        messageResult = messageResult.replace(itemId, productName)
                    }

                    toast.error(messageResult, { position: "bottom-right", duration: 2000 });
                    setActive(false)
                }
            } else if ('mensaje' in res) {
                toast.success(res.mensaje, { position: "bottom-center" });
                window.location.reload();
            } else {
                toast.error("Upps error al registrar el ingreso", { position: "bottom-right" });
                setActive(false)
            }
        } else {
            toast.error("Upps error al registrar el ingreso", { position: "bottom-right" });
            setActive(false)
        }
    }

    const validateHours = (val: string): string | boolean => {
        const check = moment(val)
        const end = moment()

        if (check.isAfter(end)) {
            return `La fecha de cierre debe ser menor que la fecha y hora actual`
        }

        return true
    }

    const user = watch('user')
    useEffect(() => {
        if (user) {
            const dist = distribuidores.find(d => d._id === user)

            if (dist) {
                setValue('role', dist.role === 'admin' ? 'admin' : 'user')
            }
        }
    }, [user, distribuidores, setValue])

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 justify-center items-center w-full p-10"
        >
            <div className="flex flex-col sm:flex-row gap-6 w-full">
                <Input
                    required
                    max={moment().format("YYYY-MM-DDTHH:mm")}
                    type="datetime-local"
                    label="Fecha de apertura"
                    name="registerDate"
                    register={register}
                    errors={errors.registerDate}
                    className="full-selector bg-transparent w-full"
                />
                <motion.div className="w-full flex flex-col gap-2">
                    <label htmlFor='user'>Distribuidores</label>
                    <select id='user' {...register('user', { required: "Debes seleccionar un distribuidor" })} className="p-2 py-2.5 rounded-md bg-main-background outline outline-2 outline-black">
                        <option value="">Sin selección</option>
                        {distribuidores.map(d => (
                            <option key={d._id} value={d._id}>{d.fullName || "Sin nombre"} {d.role === 'admin' ? "(Administrador)" : ""}</option>
                        ))}
                    </select>
                    {errors.user && <span className="text-red-500">{errors.user.message}</span>}
                </motion.div>
            </div>

            <DataTable
                columns={columns}
                data={elements}
                noDataComponent={<div className="min-h-[150px] flex items-center justify-center">Sin productos</div>}
                className="w-full overflow-x-auto no-inner-border border !border-font-color/20 !rounded-[10px]" 
            />

            <div className="w-full sticky bottom-0 bg-main-background h-full z-50">
                <div className="py-4 flex flex-row gap-4 items-center justify-center px-6">
                    <button
                        onClick={onCancel}
                        className="w-full outline outline-2 outline-blue-500 py-2 rounded-full text-blue-600 font-black shadow-xl"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!isValid || active}
                        className="disabled:bg-gray-400 w-full bg-blue-500 py-2 rounded-full text-white font-black shadow-xl truncate"
                    >
                        {active ? (
                            <i className="fa-solid fa-spinner animate-spin"></i>
                        ) : (
                            <span>{selectedBalance.code !== "" ? "Editar" : "Generar"}</span>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default SaldosInicialesForm;