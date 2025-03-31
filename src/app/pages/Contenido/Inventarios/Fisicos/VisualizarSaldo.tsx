import React, { useContext } from 'react';
import { InventariosFisicosContext } from './InventariosFisicosProvider';

const VisualizarSaldo = () => {
    const { initialBalance } = useContext(InventariosFisicosContext);

    return (
        <div>
            {initialBalance?.isUnique ? (
                <p>Ya existe un registro único de saldos iniciales.</p>
            ) : (
                <p>No hay registros únicos de saldos iniciales.</p>
            )}
        </div>
    );
};

export default VisualizarSaldo;

export {};
