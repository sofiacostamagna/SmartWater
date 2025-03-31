import React, { useContext } from 'react';
import { InventariosFisicosContext } from './InventariosFisicosProvider';

const RegistroSaldo = () => {
    const { validateUniqueInitialBalance, setInitialBalance } = useContext(InventariosFisicosContext);

    const handleRegisterSaldo = () => {
        try {
            const newBalance = {
                user: "user123",
                saldosIniciales: [],
            };

            // Validar si ya existe un registro único
            validateUniqueInitialBalance(newBalance);

            // Si no hay error, registrar el nuevo saldo inicial
            setInitialBalance({ ...newBalance, isUnique: true });
            alert("Saldo inicial registrado correctamente.");
        } catch (error) {
            
            if (error instanceof Error) {
                alert(error.message); 
            } else {
                alert("Ocurrió un error desconocido."); 
            }
        }
    };

    return (
        <div>
            <button onClick={handleRegisterSaldo}>Registrar Saldo Inicial</button>
        </div>
    );
};

export default RegistroSaldo;

export {};
