import { useState, useRef, useEffect } from "react";
import { IExpenseDetailsBody } from "../../../../../../api/types/expenses"
import { MatchedElement } from "../../../../../../type/Kardex";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import Input from "../../../../EntryComponents/Inputs";

interface Props {
    updateDetails: (val: IExpenseDetailsBody['data']['details'][0], index?: number) => void;
    handleDeleteElement: (index: number) => void;
    elements: MatchedElement[];
    inventories: IExpenseDetailsBody['data']['details']
}

const InventoriesForm = ({ elements, updateDetails, handleDeleteElement, inventories }: Props) => {
    const [isOpen, setIsOpen] = useState<boolean>(true)
    const [edit, setEdit] = useState<number>(-1)

    const { register, setValue, formState: { errors, isValid }, getValues, reset, trigger } = useForm<IExpenseDetailsBody['data']['details'][0] & { element: string }>({
        mode: 'all'
    })

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const [selectedElement, setSelectedElement] = useState<string>("");

    const filteredElements = searchTerm.trim() === ""
        ? elements
        : elements.filter((row) =>
            row.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null); // Reference for the dropdown trigger

    const calculateDropdownPosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            return {
                top: rect.bottom + window.scrollY + 12, // Add spacing below the trigger
                left: rect.left + window.scrollX,
                width: rect.width + 50, // Make the dropdown slightly wider
            };
        }
        return { top: 0, left: 0, width: "auto" };
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
                trigger("element"); // Trigger validation for element
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [trigger]);

    const handleSelectElement = (id: string) => {
        setSelectedElement(id);
        setValue("element", id, { shouldValidate: true });
        setSearchTerm("");
        setShowDropdown(false);
    };

    const handleBlurElement = () => {
        if (!selectedElement) {
            setValue("element", "", { shouldValidate: true }); // Ensure validation is triggered
            trigger("element");
        }
        setShowDropdown(false);
    };

    const setEditElement = (index: number) => {
        setEdit(index)

        const inv = inventories[index]
        if (inv.item) {
            setValue('element', inv.item, { shouldValidate: true })
        }
        if (inv.product) {
            setValue('element', inv.product, { shouldValidate: true })
        }

        setValue('inputImport', inv.inputImport, { shouldValidate: true })
        setValue('quantity', inv.quantity, { shouldValidate: true })
    }

    const onSubmit = () => {
        const res: IExpenseDetailsBody['data']['details'][0] = {
            inputImport: parseFloat(String(getValues('inputImport'))),
            quantity: parseFloat(String(getValues('quantity')))
        }

        const elem = getValues('element')
        const el = elements.find(e => e._id === elem)
        console.log(el)

        if (el?.isProduct) {
            res.product = elem
        } else {
            res.item = elem
        }
        console.log(res)

        updateDetails(res, edit)
        if (edit !== -1) { setEdit(-1) }
        reset({ element: "", inputImport: 0, quantity: 0 })
    }

    return (
        <div className="w-full rounded-[15px] shadow dark:shadow-gray-300 p-4">
            <div className={`w-full flex justify-between cursor-pointer ${isOpen ? "border-b-2 pb-4 mb-4" : ""}`} onClick={() => setIsOpen(!isOpen)}>
                <h4 className="text-sm font-semibold">Agregar inventarios</h4>
                <i className={`fa-solid fa-angle-down transition-all ${isOpen && "rotate-180"}`}></i>
            </div>

            {
                isOpen &&
                <div className="flex flex-col gap-4 text-sm">
                    <div className="flex flex-col gap-4 text-sm">
                        <div className="flex gap-4 justify-between text-sm flex-wrap">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.3 }}
                                className="w-full md:w-1/3 flex flex-col gap-2"
                            >
                                <label>Item o producto</label>
                                <div className="relative" ref={triggerRef}>
                                    <div className="relative w-full">
                                        <motion.div
                                            key={selectedElement}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.3 }}
                                            className={`relative cursor-pointer p-2 py-2.5 rounded-md font-pricedown focus:outline-4 bg-main-background outline ${
                                                errors.element
                                                    ? showDropdown
                                                        ? "outline-4 outline-red-500"
                                                        : "outline-2 outline-red-500"
                                                    : showDropdown
                                                    ? "outline-4 outline-black"
                                                    : "outline-2 outline-black"
                                            } flex justify-between items-center`}
                                            onClick={() => setShowDropdown(!showDropdown)}
                                            onBlur={handleBlurElement} // Ensure validation is triggered on blur
                                        >
                                            <span>
                                                {selectedElement
                                                    ? elements.find((e) => e._id === selectedElement)?.name || "Seleccione uno"
                                                    : "Seleccione uno"}
                                            </span>
                                            <i className={`fa-solid fa-angle-down transition-transform ${showDropdown ? "rotate-180" : ""}`}></i>
                                        </motion.div>
                                        {showDropdown && (
                                            <div
                                                ref={dropdownRef}
                                                style={{
                                                    position: "fixed",
                                                    ...calculateDropdownPosition(),
                                                    zIndex: 1050,
                                                }}
                                                className="border rounded-md shadow-md max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-200 bg-main-background dark:border-gray-600 text-base flex flex-col text-start"
                                            >
                                                <div className="py-3 px-4 sticky top-0 w-full bg-main-background">
                                                    <input
                                                        type="text"
                                                        className="w-full rounded-md bg-transparent outline-none border-2 border-black text-font-color px-2 py-1 dark:border-gray-600 dark:text-white"
                                                        placeholder="Buscar..."
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                {filteredElements.length > 0 ? (
                                                    filteredElements.map((row) => (
                                                        <div
                                                            key={row._id}
                                                            className="px-4 py-3 whitespace-nowrap hover:bg-blue-500 hover:text-white rounded-md cursor-pointer text-font-color dark:text-white"
                                                            onClick={() => handleSelectElement(row._id)}
                                                        >
                                                            {row.name}
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
                                </div>
                                <input
                                    type="hidden"
                                    {...register("element", {
                                        required: "Debes seleccionar un elemento",
                                        validate: (value) => {
                                            return value && value.trim() !== ""
                                                ? true
                                                : "Debes seleccionar un elemento válido";
                                        },
                                    })}
                                />
                                {errors.element && (
                                    <span className="text-red-500 font-normal text-sm font-pricedown">
                                        <i className="fa-solid fa-triangle-exclamation"></i>{" "}
                                        {errors.element.message}
                                    </span>
                                )}
                            </motion.div>

                            <Input
                                label="Cantidad"
                                name="quantity"
                                register={register}
                                type="number"
                                min={0}
                                className="no-spinner"
                                errors={errors.quantity}
                                required
                                containerClassName='flex-1'
                                validateAmount={(value) => {
                                    const val = parseFloat(value)
                                    return val > 0 ? Number.isInteger(val) ? true : "La cantidad debe ser un número entero" : "La cantidad debe ser mayor que 0"
                                }}
                            />

                            <Input
                                label="Costo unitario"
                                name="inputImport"
                                register={register}
                                sufix={<span>Bs</span>}
                                errors={errors.inputImport}
                                required
                                numericalOnly
                                containerClassName='flex-1'
                                validateAmount={(val: number) => val > 0 ? true : "El costo debe ser mayor que 0"}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => onSubmit()}
                            disabled={!isValid}
                            className="disabled:bg-gray-400 bg-blue-500 py-2  text-sm px-6 rounded-full text-white font-medium shadow-xl hover:bg-blue-600"
                        >
                            {
                                edit !== -1 ? "Editar" : "Agregar"
                            }
                        </button>
                    </div>

                    {
                        inventories.length > 0 &&
                        <>
                            <h4 className="text-sm font-semibold">Lista de inventarios</h4>
                            <div className="max-h-[300px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                                {inventories.map((product, index) => (
                                    <motion.div
                                        key={index}
                                        className={`mb-2 flex justify-between items-center bg-blocks dark:border-blocks shadow-md border shadow-zinc-300/25 rounded-2xl p-2 ${index === edit && "border-2 border-blue_custom"}`}
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="flex flex-col gap-4 p-1">
                                            <p className="font-semibold">
                                                {
                                                    elements.find(e => (product.item ? product.item : product.product) === e._id)?.name || "Producto desconocido"
                                                }
                                            </p>
                                            <div className="flex gap-1 items-start flex-col">
                                                <p className="text-xs">Cantidad: {product.quantity}</p>
                                                <p className="text-xs">Costo unitario: {product.inputImport.toLocaleString()}</p>
                                                <p className="text-xs">Subtotal: {(product.inputImport * product.quantity).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center flex-col pr-4">
                                            <button
                                                type="button"
                                                className="text-blue_custom hover:text-blue-600"
                                                onClick={() => setEditElement(index)} >
                                                <i className="fa-solid fa-pen"></i>
                                            </button>
                                            <button
                                                type="button"
                                                className="text-red-700 hover:text-red-500"
                                                onClick={() => handleDeleteElement(index)}
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="w-full text-end border-t pt-2"><span className="font-semibold">Total:</span> {inventories.reduce<number>((acc, curr) => acc += curr.inputImport * curr.quantity, 0)}</div>
                        </>
                    }
                </div>
            }
        </div >
    )
}

export default InventoriesForm