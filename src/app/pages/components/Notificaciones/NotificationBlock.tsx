import React, { useEffect, useState } from 'react'
import { DisconnectedData, Notification } from '../../../../type/Notification'
import { formatDateTime } from '../../../../utils/helpers';
import { Client } from '../../../../type/Cliente/Client';
import { ClientsApiConector } from '../../../../api/classes';
import { Schedule } from '../../../../type/Schedule';
import { NotificationsApiConector } from '../../../../api/classes';

interface Props {
    notification: Notification;
    markAsRead: (id: string) => void;
    onDelete: (id: string) => void; // Add a callback for deletion
}

const NotificationBlock = ({ notification, markAsRead, onDelete }: Props) => {
    const [client, setClient] = useState<Client | null>(null)
    const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null)
    const [showConfirm, setShowConfirm] = useState(false); // State for confirmation popup

    useEffect(() => {
        if (notification && notification.type === 'claim') {
            ClientsApiConector.getClient({ clientId: notification.actor }).then(res => setClient(res))
        }

        if (notification && notification.type === 'disconnected') {
            setActiveSchedule((notification.data as DisconnectedData).schedules?.find(sch => sch.days.includes((notification.data as DisconnectedData).disconnectInfo.day)) || null)
        }
    }, [notification])

    const handleDelete = () => {
        setShowConfirm(true); // Show confirmation popup
    };

    const confirmDelete = () => {
        NotificationsApiConector.delete(notification._id).then(() => {
            onDelete(notification._id); // Notify parent to update state
        });
        setShowConfirm(false); // Close confirmation popup
    };

    const cancelDelete = () => {
        setShowConfirm(false); // Close confirmation popup
    };

    return (
        <div className={`border rounded-[10px] font-normal text-font-color px-3 py-3 flex flex-col gap-1.5 ${notification.read ? "opacity-65 border-font-color/25" : "border-2 font-[500] border-font-color/60"}`}
            onClick={() => markAsRead(notification._id)}>
            <p className='text-sm font-[500]'>{notification.title}</p>

            {
                (notification.type === 'claim' && client) &&
                <>
                    <p className='text-xs'>{notification.message}</p>
                    <p className='text-xs'><strong>Cliente: </strong>{client.fullName}</p>
                </>
            }

            {
                notification.type === 'disconnected' &&
                <>
                    {
                        notification.message.includes("se ha desconectado") ?
                            <p className='text-xs'>{notification.message}</p> :
                            <p className='text-xs'><strong>Desconectado: </strong>{notification.message}</p>
                    }
                    <p className='text-xs'><strong>Fecha y hora de desconexión: </strong>{formatDateTime((notification.data as DisconnectedData).disconnectInfo.timestamp, 'numeric', '2-digit', '2-digit', true, true)}</p>
                    <p className='text-xs'><strong>Dentro del horario laboral: </strong>{(notification.data as DisconnectedData).isWithinSchedule ? "Sí" : "No"}</p>

                    {
                        activeSchedule &&
                        <p className='text-xs'><strong>Horario: </strong>{activeSchedule.startTime} - {activeSchedule.endTime}</p>
                    }
                </>
            }

            <div className='text-[10px] w-full flex justify-between items-center -mb-2 mt-1'>
                <div>{!notification.read ? "Nueva" : "Leída"}</div>
                <div className='flex items-center gap-2'>
                    <span className='text-end'>{formatDateTime(notification.created, 'numeric', '2-digit', '2-digit', true, true)}</span>
                    <button onClick={handleDelete} className="text-red-500 text-xs flex items-center">
                        <i className="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            {showConfirm && (
                <div className="absolute bg-white border border-gray-300 rounded-md shadow-md p-4 z-50">
                    <p className="text-sm mb-4">¿Estás seguro de que deseas eliminar esta notificación?</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={confirmDelete} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">Eliminar</button>
                        <button onClick={cancelDelete} className="px-3 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 text-xs">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotificationBlock