import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import Input from "../../../../EntryComponents/Inputs";
import moment from "moment";
import { EntryItemBody, MatchedElement, OtherEntry } from "../../../../../../type/Kardex";
import InventoriesEntryForm from "./InventoriesEntryForm";
import { AuthService } from "../../../../../../api/services/AuthService";
import { IOthersEntryMoreBody } from "../../../../../../api/types/kardex";
import toast from "react-hot-toast";
import { ValuedPhysicalApiConector } from "../../../../../../api/classes/valued-physical";

interface Props {
    onCancel?: () => void;
    elements: MatchedElement[];
    initialData: Partial<OtherEntry>;
    onSubmit: (data: Partial<OtherEntry>) => Promise<void>;
}

type FormType = {
    comment: string;
    documentNumber: string;
    registerDate: string;
}

const OtrosIngresosForm = ({ initialData, onSubmit, onCancel, elements }: Props) => {
    const dropdownRef = useRef<HTMLDivElement>(null); // Add dropdownRef

    const [formData, setFormData] = useState(initialData || {}); // Inicializamos con los datos existentes

    useEffect(() => {
        setFormData(initialData || {}); // Actualizamos los datos si cambian
    }, [initialData]);

    const handleChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSubmit = () => {
        onSubmit(formData); // Enviamos los datos actualizados
    };

    const [active, setActive] = useState(false);

    const { register, formState: { errors, isValid }, handleSubmit: handleFormSubmit } = useForm<FormType>({
        defaultValues: {},
        mode: 'all'
    })

    const [inventories, setInventories] = useState<EntryItemBody[]>([])

    const [searchTerm, setSearchTerm] = useState("");
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [selectedElementName, setSelectedElementName] = useState<string>("Seleccione uno");

    const filteredElements = elements.filter((element) =>
        element.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    const handleSelectElement = (element: MatchedElement) => {
        setSelectedElementName(element.name);
        setDropdownVisible(false);
        setSearchTerm("");
    };

    const onSubmitHandler = async (data: FormType) => {
        const userData = AuthService.getUser()

        const selected = moment(data.registerDate)
        const now = moment.utc().set({ date: selected.date(), month: selected.month(), year: selected.year() })
        data.registerDate = now.format("YYYY-MM-DDTHH:mm")

        const reduced = inventories.reduce<{ [key: string]: IOthersEntryMoreBody['elementsDetails'][0]['elements'] }>((acc, prev) => {
            const entity: IOthersEntryMoreBody['elementsDetails'][0]['elements'][0] = {
                quantity: prev.quantity,
                // unitPrice: prev.unitPrice,
            }
            if (prev.item) {
                entity.item = prev.item
            }
            if (prev.product) {
                entity.product = prev.product
            }

            if (acc[prev.inputType]) {
                acc[prev.inputType].push(entity)
            } else {
                acc[prev.inputType] = [entity]
            }

            return acc
        }, {})

        const requestBody: IOthersEntryMoreBody = {
            comment: data.comment,
            documentNumber: data.documentNumber,
            registerDate: data.registerDate,
            user: userData?._id || '',
            elementsDetails: Object.keys(reduced).map(k => ({
                inputType: k as IOthersEntryMoreBody['elementsDetails'][0]['inputType'],
                elements: reduced[k]
            }))
        }

        let res = null
        setActive(true)

        // if (selectedItem._id !== "") {
        //     res = await ItemsApiConector.update({ productId: selectedItem._id, data })
        // } else {
        res = await ValuedPhysicalApiConector.registerEntryMore({ data: requestBody });
        // }

        if (res) {
            // toast.success(`Item ${selectedItem._id === "" ? "registrado" : "editado"} correctamente`, { position: "bottom-center" });
            toast.success(`Ingreso registrado correctamente`, { position: "bottom-center" });
            window.location.reload();
        } else {
            toast.error("Upps error al registrar el ingreso", { position: "bottom-center" });
            setActive(false)
        }
    }

    const onAddElements = (val: EntryItemBody, index: number = -1) => {
        if (index > -1) {
            const updateElements = [...inventories]
            updateElements[index] = val
            setInventories(updateElements)
        } else {
            const idx = inventories.findIndex(i => val.product ? i.product === val.product : i.item === val.item);
            if (idx !== -1) {
                setInventories(prev => prev.map(i => {
                    if ((!!val.product && i.product === val.product) || (!!val.item && i.item === val.item)) {
                        // return { ...i, unitPrice: val.unitPrice, quantity: val.quantity, inputType: val.inputType }
                        return { ...i, quantity: val.quantity, inputType: val.inputType }
                    } else {
                        return i
                    }
                }))
            } else {
                setInventories([...inventories, val])
            }
        }
    }

    const handleDeleteElement = (index: number) => {
        setInventories(inventories.filter((_, i) => i !== index));
    };

    return (
        <form
            onSubmit={handleFormSubmit(onSubmitHandler)}
            className="flex flex-col gap-6 justify-center items-center w-full p-6"
        >
            <div className="flex gap-4 justify-between text-sm flex-wrap w-full">
                <Input
                    required
                    max={moment().format("YYYY-MM-DD")}
                    type="date"
                    label="Fecha"
                    iconContainerClassName="!border-0 !ps-1"
                    name="registerDate"
                    register={register}
                    errors={errors.registerDate}
                    containerClassName="flex-1"
                    className="full-selector bg-transparent w-full"
                    icon={<img src="/desde.svg" alt="" className="w-[20px] h-[20px] absolute bottom-3 left-4 invert-0 dark:invert" />}
                    value={formData.registerDate || ""}
                    onChange={(e) => handleChange("registerDate", e.target.value)}
                />

                <Input
                    containerClassName="flex-1"
                    label="Número de documento"
                    name="documentNumber"
                    required
                    register={register}
                    errors={errors.documentNumber}
                    value={formData.documentNumber || ""}
                    onChange={(e) => handleChange("documentNumber", e.target.value)}
                />
            </div>

            <InventoriesEntryForm
                elements={elements}
                handleDeleteElement={handleDeleteElement}
                inventories={inventories}
                updateDetails={onAddElements}
            />

            <Input
                rows={3}
                textarea
                label="Comentario"
                name="comment"
                register={register}
                errors={errors.comment}
                value={formData.comment || ""} // Verificamos si 'comment' existe en formData
                onChange={(e) => handleChange("comment", e.target.value)} // Actualizamos el estado local
            />

            <div className="relative" ref={dropdownRef}>
                <div
                    className={`p-2 py-2.5 rounded-md focus:outline-4 bg-main-background outline outline-2 outline-black cursor-pointer flex justify-between items-center`}
                    onClick={() => setDropdownVisible(!dropdownVisible)}
                >
                    <span className="truncate">{selectedElementName}</span>
                    <i
                        className={`fa-solid fa-angle-down transition-transform ml-2 ${
                            dropdownVisible ? "rotate-180" : ""
                        }`}
                    ></i>
                </div>
                {dropdownVisible && (
                    <div
                        className="absolute z-[9999] mt-1 bg-main-background border border-black rounded-md shadow-lg max-h-60 overflow-y-auto"
                        style={{
                            position: "fixed",
                            top: dropdownRef.current?.getBoundingClientRect().bottom,
                            left: dropdownRef.current?.getBoundingClientRect().left,
                            width: dropdownRef.current?.offsetWidth,
                        }}
                    >
                        <div className="sticky top-0 bg-main-background p-2 border-b border-black">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="p-2 w-full rounded bg-gray-100 text-black focus:outline-none"
                                autoFocus
                            />
                        </div>
                        <div className="py-1">
                            {filteredElements.length > 0 ? (
                                filteredElements.map((element, index) => (
                                    <div
                                        key={index}
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSelectElement(element)}
                                    >
                                        {element.name}
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
            </div>

            <div className="w-full  sticky bottom-0 bg-main-background h-full z-50">
                <div className="py-4 flex flex-row gap-4 items-center justify-center px-6">
                    <button
                        onClick={onCancel}
                        className="w-full outline outline-2 outline-blue-500 py-2 rounded-full text-blue-600 font-black shadow-xl"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!isValid || active || inventories.length === 0}
                        className="disabled:bg-gray-400 w-full bg-blue-500 py-2 rounded-full text-white font-black shadow-xl truncate"
                    >
                        {active ? (
                            <i className="fa-solid fa-spinner animate-spin"></i>
                        ) : (
                            <>
                                Registrar
                                {/* {selectedInventario._id !== "" ? "Editar" : "Registrar"} */}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    )
}

export default OtrosIngresosForm