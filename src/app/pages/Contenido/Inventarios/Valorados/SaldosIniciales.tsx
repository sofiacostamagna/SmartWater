import React, { useCallback, useContext, useEffect, useState } from 'react'
import InventariosLayout from '../InventariosLayout/InventariosLayout'
import TableValoradosSaldosIniciales from './Tables/TableValoradosSaldosIniciales'
import Modal from '../../../EntryComponents/Modal'
import { initialBalanceMock, InventariosValoradosContext } from './InventariosValoradosProvider'
import { KardexInitialBalances, MatchedElement } from '../../../../../type/Kardex'
import { KardexApiConector } from '../../../../../api/classes/kardex'
import AddEditInitialBalances from './Modals/AddEditInitialBalances'
import ShowInitialBalancesModal from './Modals/ShowInitialBalancesModal'

const SaldosIniciales = () => {
    const {
        showMiniModal, setShowMiniModal,
        selectedInventario, setSelectedInvetario,
        showModal, setShowModal,
        selectedOption, setSelectedOption
    } = useContext(InventariosValoradosContext)

    const [elements, setElements] = useState<MatchedElement[]>([])
    const [currentData, setCurrentData] = useState<KardexInitialBalances[]>([])

    useEffect(() => {
        KardexApiConector.getKardexElements().then(res => {
            console.log("Matched Elements:", res?.elements || []); // Debug matched elements
            setElements(res?.elements || []);
        });
    }, [])

    const getData = useCallback(async () => {
        const res = await KardexApiConector.getInitialBalances();

        if (res) {
            console.log("Fetched Initial Balances:", res); // Debug fetched initial balances
            setCurrentData([res]);
        } else {
            console.log("No Initial Balances Found"); // Debug when no initial balances exist

            // Attempt to create an initial balance for the first matched element
            if (elements.length > 0) {
                const firstElement = elements[0];
                const existingBalance = currentData.find(
                    (balance) => balance.initialBalance.itemId === firstElement._id
                );

                if (existingBalance) {
                    console.warn(`Initial balance already exists for item: ${firstElement._id}`);
                    return;
                }

                const createRes = await KardexApiConector.createInitialBalance({
                    itemId: firstElement._id,
                    initialBalance: 100, // Example value
                    date: new Date().toISOString().split("T")[0], // Today's date
                });

                if (createRes) {
                    console.log("Initial Balance Created for Item:", firstElement._id);
                    await getData(); // Re-fetch data after creation
                } else {
                    console.error("Failed to Create Initial Balance for Item:", firstElement._id);
                }
            }
        }
    }, [elements, currentData])

    useEffect(() => {
        getData()
    }, [getData])

    return (
        <>
            <InventariosLayout swith switchDetails={[
                {
                    isSelected: true,
                    text: "Saldos iniciales",
                    url: "/Finanzas/Inventarios/Valorados/Saldos"
                },
                {
                    isSelected: false,
                    text: "Reportes de inventario",
                    url: "/Finanzas/Inventarios/Valorados/ReporteInventario"
                },
            ]}
                add={currentData.length === 0} onAdd={() => setShowMiniModal(true)}>
                <TableValoradosSaldosIniciales 
                    data={currentData.sort((a, b) => Number(b.initialBalance.code.split("-")[2]) - Number(a.initialBalance.code.split("-")[2]))}
                    className='w-full no-inner-border border !border-font-color/20 !rounded-[10px]' 
                />
            </InventariosLayout>

            <Modal isOpen={showMiniModal} onClose={() => setShowMiniModal(false)} className='!w-[95%] sm:!w-3/4'>
                <h2 className="text-blue_custom font-semibold p-6 pb-0 sticky top-0 z-30 bg-main-background">
                    Agregar saldos iniciales
                </h2>
                <AddEditInitialBalances onCancel={() => setShowMiniModal(false)} elements={elements} />
            </Modal>

            <Modal isOpen={showModal && selectedInventario.detailsToElements.length > 0} onClose={() => {
                setShowModal(false);
                setSelectedInvetario(initialBalanceMock)
            }} className='!w-[95%] sm:!w-3/4'>
                <h2 className="text-blue_custom font-semibold p-6 pb-0 sticky top-0 z-30 bg-main-background">
                    Agregar saldos iniciales
                </h2>
                <AddEditInitialBalances onCancel={() => {
                    setShowModal(false);
                    setSelectedInvetario(initialBalanceMock)
                }} elements={elements} />
            </Modal>

            <Modal isOpen={selectedOption && selectedInventario.detailsToElements.length > 0} onClose={() => {
                setSelectedOption(false);
                setSelectedInvetario(initialBalanceMock)
            }} className='!w-[95%] sm:!w-3/4'>
                <h2 className="text-blue_custom font-semibold p-6 pb-0 sticky top-0 z-30 bg-main-background">
                    Ver saldos iniciales
                </h2>
                <ShowInitialBalancesModal onCancel={() => {
                    setSelectedOption(false);
                    setSelectedInvetario(initialBalanceMock)
                }} elements={elements} />
            </Modal>
        </>
    )
}

export default SaldosIniciales