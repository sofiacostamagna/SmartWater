import { useState, useEffect, useRef } from "react";
import { OutputItemBody, MatchedElement } from "../../../../../../type/Kardex";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import Input from "../../../../EntryComponents/Inputs";

interface Props {
    updateDetails: (val: OutputItemBody, index?: number) => void;
    handleDeleteElement: (index: number) => void;
    elements: MatchedElement[];
    inventories: OutputItemBody[]
}

const InventoriesOutputForm = ({ elements, updateDetails, handleDeleteElement, inventories }: Props) => {
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [edit, setEdit] = useState<number>(-1);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const [selectedElement, setSelectedElement] = useState<string>("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { register, setValue, formState: { errors, isValid }, getValues, reset, trigger } = useForm<OutputItemBody & { element: string }>({
        mode: 'all'
    });

    const filteredElements = searchTerm.trim() === ""
        ? elements
        : elements.filter((row) =>
            row.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const handleSelectElement = (id: string) => {
        setSelectedElement(id);
        setValue("element", id, { shouldValidate: true, shouldTouch: true });
        setSearchTerm("");
        setShowDropdown(false);
        trigger("element");
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
                trigger("element");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef, trigger]);

    const setEditElement = (index: number) => {
        setEdit(index);
        const inv = inventories[index];
        if (inv.item) {
            setValue('element', inv.item, { shouldValidate: true });
        }
        if (inv.product) {
            setValue('element', inv.product, { shouldValidate: true });
        }
        setValue('quantity', inv.quantity, { shouldValidate: true });
    };

    const onSubmit = () => {
        const res: OutputItemBody = {
            quantity: parseFloat(String(getValues('quantity'))),
            outputType: getValues('outputType')
        };

        const el = elements.find((e) => e._id === selectedElement);

        if (el?.isProduct) {
            res.product = selectedElement;
        } else {
            res.item = selectedElement;
        }

        updateDetails(res, edit);
        if (edit !== -1) { setEdit(-1); }
        reset({ element: "", quantity: 0, outputType: "production_delivered" });
    };

    return (
        <div className="w-full rounded-[15px] shadow dark:shadow-gray-300 p-4">
            <div className={`w-full flex justify-between cursor-pointer ${isOpen ? "border-b-2 pb-4 mb-4" : ""}`} onClick={() => setIsOpen(!isOpen)}>
                <h4 className="text-sm font-semibold">Agregar productos e items</h4>
                <i className={`fa-solid fa-angle-down transition-all ${isOpen && "rotate-180"}`}></i>
            </div>

            {isOpen && (
                <div className="flex flex-col gap-4 text-sm">
                    <div className="flex flex-col gap-4 text-sm">
                        <div className="flex gap-4 justify-between text-sm">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.3 }}
                                className="w-full md:w-1/3 flex flex-col gap-2"
                            >
                                <label>Tipo de salida</label>
                                <select
                                    {...register("outputType", {
                                        required: "Debes seleccionar un tipo"
                                    })}
                                    className="p-2 py-2.5 rounded-md font-pricedown focus:outline-4 bg-main-background outline outline-2 outline-black"
                                >
                                    <option value="production_delivered">Salida a producción</option>
                                    <option value="adjustment_exit">Salida por ajuste</option>
                                </select>
                                {errors.outputType && (
                                    <span className="text-red-500 font-normal text-sm font-pricedown">
                                        <i className="fa-solid fa-triangle-exclamation"></i>{" "}
                                        {errors.outputType.message}
                                    </span>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.3 }}
                                className="w-full md:w-1/3 flex flex-col gap-2"
                            >
                                <label>Item o producto</label>
                                <div className="relative" ref={dropdownRef}>
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
                                                className="absolute top-full translate-y-3 left-1/2 -translate-x-[45%] w-[250px] border rounded-md shadow-md z-[9999] max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-black scrollbar-track-gray-200 bg-main-background dark:border-gray-600 text-base flex flex-col text-start"
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
                                containerClassName="flex-1"
                                validateAmount={(value) => {
                                    const val = parseFloat(value);
                                    return val > 0
                                        ? Number.isInteger(val)
                                            ? true
                                            : "La cantidad debe ser un número entero"
                                        : "La cantidad debe ser mayor que 0";
                                }}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={!isValid}
                            className="disabled:bg-gray-400 bg-blue-500 py-2 text-sm px-6 rounded-full text-white font-medium shadow-xl hover:bg-blue-600"
                        >
                            {edit !== -1 ? "Editar" : "Agregar"}
                        </button>
                    </div>

                    {
                        inventories.length > 0 &&
                        <>
                            <div className="max-h-[300px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
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
                                                {/* <p className="text-xs">Precio unitario: {product.unitPrice.toLocaleString()}</p> */}
                                                <p className="text-xs">{product.outputType === 'production_delivered' ? "Salida a producción" : "Salida por ajuste"}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center flex-col pr-4 pt-2 h-full">
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
                        </>
                    }
                </div>
            )}
        </div>
    );
};

export default InventoriesOutputForm;