import React, { createContext, PropsWithChildren, useState } from 'react'
import { 
  PhysicalBalanceToShow, 
  PhysiscalGeneratedReport, 
  PhysiscalPreviousReport,
  PhysicalInitialBalace, 
  PhysicalBalace
} from '../../../../../type/PhysicalInventory';
import moment from 'moment';

type InventariosFisicosContextType = {
    showModal: boolean;
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
    showMiniModal: boolean;
    setShowMiniModal: React.Dispatch<React.SetStateAction<boolean>>;
    selectedOption: boolean;
    setSelectedOption: React.Dispatch<React.SetStateAction<boolean>>;
    showFiltro: boolean;
    setShowFiltro: React.Dispatch<React.SetStateAction<boolean>>;
    selectedBalance: PhysicalBalanceToShow;
    setSelectedBalance: React.Dispatch<React.SetStateAction<PhysicalBalanceToShow>>;
    selectedInventario: PhysiscalPreviousReport[];
    setSelectedInvetario: React.Dispatch<React.SetStateAction<PhysiscalPreviousReport[]>>;
    selectedReport: PhysiscalGeneratedReport;
    setSelectedReport: React.Dispatch<React.SetStateAction<PhysiscalGeneratedReport>>;
    // Estados modificados para ajustarse a tus tipos
    initialBalance: PhysicalInitialBalace | null;
    setInitialBalance: React.Dispatch<React.SetStateAction<PhysicalInitialBalace | null>>;
    editingInitialBalance: boolean;
    setEditingInitialBalance: React.Dispatch<React.SetStateAction<boolean>>;
    currentBalanceDetail: PhysicalBalace['saldo'][0] | null; // Para editar individualmente
    setCurrentBalanceDetail: React.Dispatch<React.SetStateAction<PhysicalBalace['saldo'][0] | null>>;
    validateUniqueInitialBalance: (newBalance: PhysicalInitialBalace) => void;
};

export const InventariosFisicosContext =
    createContext<InventariosFisicosContextType>({} as InventariosFisicosContextType);

// Valores iniciales usando tus tipos
export const initialPhysicalInitialBalance: PhysicalInitialBalace = {
    user: "",
    saldosIniciales: []
};

export const balance: PhysicalBalanceToShow = {
    code: "",
    saldo: [],
    showDate: moment(),
    user: {
        _id: "",
        isAdmin: false,
        name: ""
    }
}

export const physicalReport: PhysiscalGeneratedReport = { 
    _id: "", 
    elements: [], 
    registerDate: "", 
    role: "user", 
    user: "" 
}

const InventariosFisicosProvider = ({ children }: PropsWithChildren) => {
    const [showModal, setShowModal] = useState<boolean>(false);
    const [showMiniModal, setShowMiniModal] = useState<boolean>(false);
    const [selectedOption, setSelectedOption] = useState<boolean>(false);
    const [showFiltro, setShowFiltro] = useState<boolean>(false);
    const [selectedInventario, setSelectedInvetario] = useState<PhysiscalPreviousReport[]>([]);
    const [selectedBalance, setSelectedBalance] = useState<PhysicalBalanceToShow>(balance);
    const [selectedReport, setSelectedReport] = useState<PhysiscalGeneratedReport>(physicalReport);
    
    // Nuevos estados adaptados a tus tipos
    const [initialBalance, setInitialBalance] = useState<PhysicalInitialBalace | null>(null);
    const [editingInitialBalance, setEditingInitialBalance] = useState<boolean>(false);
    const [currentBalanceDetail, setCurrentBalanceDetail] = useState<PhysicalBalace['saldo'][0] | null>(null);

    // Nueva función para validar un único registro de saldos iniciales
    const validateUniqueInitialBalance = (newBalance: PhysicalInitialBalace) => {
        if (initialBalance?.isUnique) {
            throw new Error("Ya existe un registro único de saldos iniciales.");
        }
        setInitialBalance({ ...newBalance, isUnique: true });
    };

    return (
        <InventariosFisicosContext.Provider
            value={{
                showModal,
                setShowModal,
                showMiniModal,
                setShowMiniModal,
                selectedOption,
                setSelectedOption,
                showFiltro,
                setShowFiltro,
                selectedInventario,
                setSelectedInvetario,
                selectedBalance,
                setSelectedBalance,
                selectedReport,
                setSelectedReport,
                // Nuevos valores
                initialBalance,
                setInitialBalance,
                editingInitialBalance,
                setEditingInitialBalance,
                currentBalanceDetail,
                setCurrentBalanceDetail,
                validateUniqueInitialBalance // Exponer la función en el contexto
            }}
        >
            {children}
        </InventariosFisicosContext.Provider>
    );
}

export default InventariosFisicosProvider